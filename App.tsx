 
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { RotateCcw, Code2, Ruler, Trophy, X, Flag, Save, FolderOpen, Check, AlertCircle, Info, Terminal, Star, Home, Eye, Move, Hand, Bot, Target, FileCode, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';
import BlocklyEditor, { BlocklyEditorHandle } from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState, CustomObject, ContinuousDrawing, SimulationHistory, CameraMode, EditorTool, PathShape, SensorReadings } from './types'; // Import SensorReadings
import Numpad from './components/Numpad';
import SensorDashboard from './components/SensorDashboard';
import RulerTool from './components/RulerTool';
import ColorPickerTool from './components/ColorPickerTool';
import CameraManager, { CameraLayerManager } from './components/CameraManager'; // ייבוא CameraManager ו-CameraLayerManager
import { CHALLENGES, Challenge } from './data/challenges';
import { ThreeEvent, useThree } from '@react-three/fiber'; // Import ThreeEvent and useThree here
import { ROBOT_LAYER } from './types'; // Import ROBOT_LAYER

const TICK_RATE = 16; 
const BASE_VELOCITY = 0.165; // Retained at 3x original for normal forward movement
const BASE_TURN_SPEED = 3.9; // Increased to 30x original (0.13 * 30) for much faster turning
const TURN_TOLERANCE = 0.5; // degrees - for turn precision

// Updated to a more appropriate dropper cursor SVG
const DROPPER_CURSOR_URL = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1NzVlNzUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGlwZXR0ZSI%2BPHBhdGggZD0ibTIgMjIgNS01Ii8%2BPHBhdGggZD0iTTkuNSAxNC41IDE2IDhsM3AzLTYuNSA2LjUtMy0zEiIvPjxwYXRoIGQ9Imm3LjUgMTEuNSAzLTVsLz48cGF0aCBkPSJmMTggMyAzLTMiLz48cGF0aCBkPSJNMjAuOSA3LjFhMiAyIDAgMSAwLTIuOC0yLjhsLTEuNCAxLjQgMi44IDIuOCAx.NC0x.NCeiIvPjxwYXRoIGQ9Im11OCAzIDMtMyIvPjxwYXRoIGQ9Ik0yMC45IDcuMWEyIDIgMCAxIDAtMi44LTIuOGwtMS40IDEuNCAyLjggMi44IDEuNC0xLjR6Ii8%2BPC9zdmc%2B) 0 24, crosshair`;

// Canonical map for common color names to their representative hex values (aligned with Blockly icons)
const CANONICAL_COLOR_MAP: Record<string, string> = {
    'red': '#EF4444',     // From Blockly's red star
    'green': '#22C55E',   // From Blockly's green square
    'blue': '#3B82F6',    // From Blockly's blue circle
    'yellow': '#EAB308',  // From Blockly's yellow triangle (Blockly's specific yellow)
    'orange': '#F97316',  // From Blockly's orange heart
    'purple': '#A855F7',  // From Blockly's purple moon
    'cyan': '#06B6D4',    // From Blockly's cyan cloud
    'magenta': '#EC4899', // From Blockly's pink diamond (using magenta as the name in code)
    'black': '#000000',
    'white': '#FFFFFF',
};

// Helper function to normalize angles to 0-360 degrees
const normalizeAngle = (angle: number) => (angle % 360 + 360) % 360;

// Helper function to get the shortest difference between two angles
const getAngleDifference = (angle1: number, angle2: number) => {
    let diff = normalizeAngle(angle1 - angle2);
    if (diff > 180) diff -= 360;
    return diff;
};

// Check if two hex colors (or color names) are "close" to each other
const isColorClose = (hex1: string, hex2: string, threshold = 0.2) => { // Changed threshold to 0.2 for stricter comparison
    try {
        if (!hex1 || !hex2) return false;
        const h1 = hex1.toLowerCase();
        const h2 = hex2.toLowerCase();
        if (h1 === h2) return true;

        // Resolve both inputs to their canonical hex values
        const finalH1 = CANONICAL_COLOR_MAP[h1] || (h1.startsWith('#') ? h1 : '#' + h1);
        const finalH2 = CANONICAL_COLOR_MAP[h2] || (h2.startsWith('#') ? h2 : '#' + h2);

        // Handle cases where a name maps to nothing, or input is malformed
        if (!finalH1 || !finalH2) {
            try { new THREE.Color(finalH1); } catch { return false; }
            try { new THREE.Color(finalH2); } catch { return false; }
        }

        const c1 = new THREE.Color(finalH1);
        const c2 = new THREE.Color(finalH2);
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db) < threshold;
    } catch (e) {
        console.error("Error in isColorClose:", e);
        return false;
    }
};

const getLocalCoords = (px: number, pz: number, objX: number, objZ: number, rotation: number) => {
    const dx = px - objX;
    const dz = pz - objZ;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    return { lx: dx * cos - dz * sin, lz: dx * sin + dz * cos };
};

const isPointInObject = (px: number, pz: number, obj: CustomObject) => {
    const { lx, lz } = getLocalCoords(px, pz, obj.x, obj.z, obj.rotation || 0);
    const halfW = obj.width / 2; 
    const halfL = (obj.type === 'PATH' && obj.shape === 'CORNER') ? obj.width / 2 : obj.length / 2;
    return Math.abs(lx) <= halfW && Math.abs(lz) <= halfL;
};

// פונקציה עם סף רגישות למגע
const isPointInObjectWithTolerance = (px: number, pz: number, obj: CustomObject, tolerance: number) => {
    const { lx, lz } = getLocalCoords(px, pz, obj.x, obj.z, obj.rotation || 0);
    const halfW = obj.width / 2; 
    const halfL = (obj.type === 'PATH' && obj.shape === 'CORNER') ? obj.width / 2 : obj.length / 2;
    return Math.abs(lx) <= (halfW + tolerance) && Math.abs(lz) <= (halfL + tolerance);
};

// Modified to include 'type' in complexZones for dynamic tolerance calculation
const getEnvironmentConfig = (challengeId?: string, customObjects: CustomObject[] = []) => {
    let walls: {minX: number, maxX: number, minZ: number, maxZ: number}[] = [];
    let complexZones: {x: number, z: number, width: number, length: number, rotation: number, color: number, shape?: PathShape, type: EditorTool}[] = [];
    if (['c10', 'c16', 'c19', 'c20'].includes(challengeId || '')) walls.push({ minX: -3, maxX: 3, minZ: -10.25, maxZ: -9.75 });
    customObjects.forEach(obj => {
        // Sanitize object properties here to prevent NaN/undefined from entering calculation logic
        const safeX = Number.isFinite(obj.x) ? obj.x : 0;
        const safeZ = Number.isFinite(obj.z) ? obj.z : 0;
        // Ensure dimensions are positive to prevent errors like division by zero or negative geometry args
        const safeWidth = Number.isFinite(obj.width) && obj.width > 0 ? obj.width : 0.01; 
        const safeLength = Number.isFinite(obj.length) && obj.length > 0 ? obj.length : 0.01; 
        const safeRotation = Number.isFinite(obj.rotation) ? obj.rotation : 0;
        // For height, use a default if undefined/non-finite, but it can be 0.01 for minimal height
        const safeHeight = Number.isFinite(obj.height) && (obj.height as number) >= 0 ? (obj.height as number) : 0.01; 

        if (obj.type === 'WALL') { 
            const hW = safeWidth / 2; 
            const hL = safeLength / 2; 
            walls.push({ minX: safeX - hW, maxX: safeX + hW, minZ: safeZ - hL, maxZ: safeZ + hL }); 
        }
        else if (obj.type === 'PATH') { 
            const lineHex = obj.color || '#FFFF00'; 
            const colorVal = parseInt(lineHex.replace('#', '0x'), 16); 
            complexZones.push({ x: safeX, z: safeZ, width: safeWidth, length: safeLength, rotation: safeRotation, color: colorVal, shape: obj.shape || 'STRAIGHT', type: obj.type }); 
        } 
        else if (obj.type === 'COLOR_LINE') { 
            const hC = obj.color || '#FF0000'; 
            complexZones.push({ x: safeX, z: safeZ, width: safeWidth, length: safeLength, rotation: safeRotation, color: parseInt(hC.replace('#', '0x'), 16), type: obj.type }); 
        }
        else if (obj.type === 'RAMP') { 
            const rampHex = obj.color || '#334155';
            const colorVal = parseInt(rampHex.replace('#', '0x'), 16);
            complexZones.push({ x: safeX, z: safeZ, width: safeWidth, length: safeLength, rotation: safeRotation, color: colorVal, type: obj.type });
        }
    });
    return { walls, complexZones };
};


// Modified to include challengeId parameter and c18 specific logic
const getSurfaceHeightAt = (qx: number, qz: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    // Sanitize inputs
    const safeQx = Number.isFinite(qx) ? qx : 0;
    const safeQz = Number.isFinite(qz) ? qz : 0;

    let maxHeight = 0;
    for (const obj of customObjects) {
        if (obj.type === 'RAMP') {
            // Sanitize object properties before use
            const safeObjX = Number.isFinite(obj.x) ? obj.x : 0;
            const safeObjZ = Number.isFinite(obj.z) ? obj.z : 0;
            const safeObjRotation = Number.isFinite(obj.rotation) ? obj.rotation : 0;
            const safeObjWidth = Number.isFinite(obj.width) && obj.width > 0 ? obj.width : 0.01;
            const safeObjLength = Number.isFinite(obj.length) && obj.length > 0 ? obj.length : 0.01;
            const safeObjHeight = Number.isFinite(obj.height) && (obj.height as number) >= 0 ? (obj.height as number) : 0.01; // Ensure height is explicitly number
            
            const { lx, lz } = getLocalCoords(safeQx, safeQz, safeObjX, safeObjZ, safeObjRotation);
            const hW = safeObjWidth / 2; 
            const hL = safeObjLength / 2; 
            const h = safeObjHeight; // Use the sanitized height
            
            if (Number.isFinite(lx) && Number.isFinite(lz) && Math.abs(lx) <= hW && Math.abs(lz) <= hL) {
                const section = safeObjLength / 3; 
                const uphillEnd = -hL + section; 
                const downhillStart = hL - section;
                let currentY_raw = 0; // Initialize raw currentY
                
                if (Number.isFinite(section) && section > 0) { // Avoid division by zero
                    if (lz < uphillEnd) {
                        const t = (lz - (-hL)) / section;
                        currentY_raw = t * h;
                    } else if (lz < downhillStart) {
                        currentY_raw = h;
                    } else {
                        const t = (lz - downhillStart) / section;
                        currentY_raw = h - (t * h);
                    }
                } else {
                    currentY_raw = h; // Default to max height if section is invalid or zero
                }
                const currentY = Number.isFinite(currentY_raw) ? currentY_raw : 0; // Sanitize currentY
                maxHeight = Math.max(maxHeight, currentY);
            }
        }
    }
    // Reintroduced challenge-specific ramp logic from the user's working version
    if (challengeId === 'c18') {
        let calculatedHeight_raw = 0; // Initialize raw calculatedHeight
        if (safeQx >= -2.1 && safeQx <= 2.1) {
            if (safeQz < -0.2 && safeQz > -3.7) calculatedHeight_raw = ((safeQz - (-0.2)) / -3.5) * 1.73;
            else if (safeQz <= -3.7 && safeQz >= -7.4) calculatedHeight_raw = 1.73;
            else if (safeQz < -7.4 && safeQz > -10.9) calculatedHeight_raw = 1.73 - (((safeQz - (-7.4)) / -3.5) * 1.73);
            
            const calculatedHeight = Number.isFinite(calculatedHeight_raw) ? calculatedHeight_raw : 0; // Sanitize calculatedHeight
            maxHeight = Math.max(maxHeight, calculatedHeight);
        }
    }
    return Number.isFinite(maxHeight) ? maxHeight : 0; // Ensure final return is finite
};

// New simplified checkTouchSensorHit to use `walls` directly
const checkTouchSensorHit = (x: number, z: number, rotation: number, walls: {minX: number, maxX: number, minZ: number, maxZ: number}[]) => {
    const safeX = Number.isFinite(x) ? x : 0;
    const safeZ = Number.isFinite(z) ? z : 0;
    const safeRotation = Number.isFinite(rotation) ? rotation : 0;

    const rad = (safeRotation * Math.PI) / 180; 
    const sin_raw = Math.sin(rad); 
    const cos_raw = Math.cos(rad);
    const sin = Number.isFinite(sin_raw) ? sin_raw : 0;
    const cos = Number.isFinite(cos_raw) ? cos_raw : 0;
    
    const sensorTipX_raw = safeX + sin * 1.7; 
    const sensorTipZ_raw = safeZ + cos * 1.7;
    const sensorTipX = Number.isFinite(sensorTipX_raw) ? sensorTipX_raw : safeX; // Sanitize sensorTipX
    const sensorTipZ = Number.isFinite(sensorTipZ_raw) ? sensorTipZ_raw : safeZ; // Sanitize sensorTipZ

    for (const w of walls) { 
        if (Number.isFinite(sensorTipX) && Number.isFinite(sensorTipZ) &&
            sensorTipX >= w.minX && sensorTipX <= w.maxX && sensorTipZ >= w.minZ && sensorTipZ <= w.maxZ) return true; 
    }
    return false;
};

// New simplified checkPhysicsHit to use `walls` directly
const checkPhysicsHit = (px: number, pz: number, walls: {minX: number, maxX: number, minZ: number, maxZ: number}[]) => {
    const safePx = Number.isFinite(px) ? px : 0;
    const safePz = Number.isFinite(pz) ? pz : 0;

    for (const w of walls) { 
        if (Number.isFinite(safePx) && Number.isFinite(safePz) &&
            safePx >= w.minX && safePx <= w.maxX && safePz >= w.minZ && safePz <= w.maxZ) return true; 
    }
    return false;
};

// Modified to include challengeId parameter and use getEnvironmentConfig
const calculateSensorReadings = (x: number, z: number, rotation: number, challengeId?: string, customObjects: CustomObject[] = []): SensorReadings => {
    // Sanitize inputs before calculations
    const safeX = Number.isFinite(x) ? x : 0;
    const safeZ = Number.isFinite(z) ? z : 0;
    const safeRotation = Number.isFinite(rotation) ? rotation : 0;

    const rad = (safeRotation * Math.PI) / 180; 
    const sin_raw = Math.sin(rad); 
    const cos_raw = Math.cos(rad);
    const sin = Number.isFinite(sin_raw) ? sin_raw : 0;
    const cos = Number.isFinite(cos_raw) ? cos_raw : 0;

    const env = getEnvironmentConfig(challengeId, customObjects); // Use getEnvironmentConfig here
    const gyro = Math.round(normalizeAngle(safeRotation)); // Use normalizeAngle here
    
    const getPointWorldPos = (lx: number, lz: number) => {
        const safeLx = Number.isFinite(lx) ? lx : 0; // Sanitize internal arguments
        const safeLz = Number.isFinite(lz) ? lz : 0; // Sanitize internal arguments
        const wx_raw = safeX + (safeLx * cos + safeLz * sin);
        const wz_raw = safeZ + (-safeLx * sin + safeLz * cos);
        return { 
            wx: Number.isFinite(wx_raw) ? wx_raw : safeX,
            wz: Number.isFinite(wz_raw) ? wz_raw : safeZ
        };
    };

    // Positions for robot's contact points (wheels/casters)
    const wheelOffsetZ = 0.5; // Approx half of robot body length
    const wheelOffsetX = 0.95; // Approx half of robot body width
    const casterOffsetZ = -0.8; // Approx position of back caster
    const frontSensorPos = getPointWorldPos(0, 1.1); // For tilt calculation, still use an effective front point

    const leftWheelPos = getPointWorldPos(-wheelOffsetX, wheelOffsetZ);
    const rightWheelPos = getPointWorldPos(wheelOffsetX, wheelOffsetZ);
    const backCasterPos = getPointWorldPos(0, casterOffsetZ);

    // Get surface heights at these points, passing challengeId
    const rawHLeft = getSurfaceHeightAt(leftWheelPos.wx, leftWheelPos.wz, challengeId, customObjects);
    const hLeft = Number.isFinite(rawHLeft) ? rawHLeft : 0;
    const rawHRight = getSurfaceHeightAt(rightWheelPos.wx, rightWheelPos.wz, challengeId, customObjects);
    const hRight = Number.isFinite(rawHRight) ? rawHRight : 0;
    const rawHBack = getSurfaceHeightAt(backCasterPos.wx, backCasterPos.wz, challengeId, customObjects);
    const hBack = Number.isFinite(rawHBack) ? rawHBack : 0;
    const rawHFront = getSurfaceHeightAt(frontSensorPos.wx, frontSensorPos.wz, challengeId, customObjects);
    const hFront = Number.isFinite(rawHFront) ? rawHFront : 0;


    // Reverted: Calculate y as the average of the contact points (from working version)
    const rawCalculatedY = (hLeft + hRight + hBack) / 3; 
    const calculatedY = Number.isFinite(rawCalculatedY) ? rawCalculatedY : 0;

    // Tilt and Roll calculations using the front/back/side height differences (from working version)
    const rawFrontAvg = (hLeft + hRight) / 2;
    const frontAvg = Number.isFinite(rawFrontAvg) ? rawFrontAvg : 0;
    const rawCalculatedTilt = Math.atan2(frontAvg - hBack, 1.3) * (180 / Math.PI); // Distance between front/back effective points (1.3 from working version)
    const calculatedTilt = Number.isFinite(rawCalculatedTilt) ? rawCalculatedTilt : 0;
    const rawCalculatedRoll = Math.atan2(hLeft - hRight, wheelOffsetX * 2) * (180 / Math.PI); // Distance between left/right wheels
    const calculatedRoll = Number.isFinite(rawCalculatedRoll) ? rawCalculatedRoll : 0;

    // Sensor color reading position (remains the same)
    const cx_raw = safeX + sin * 0.9; 
    const cz_raw = safeZ + cos * 0.9;
    const cx = Number.isFinite(cx_raw) ? cx_raw : 0;
    const cz = Number.isFinite(cz_raw) ? cz_raw : 0;

    let sensorDetectedColor = "white"; // Renamed for clarity
    let sensorIntensity = 100; // Add intensity as it's in the old working version, though not used widely
    let sensorRawDecimalColor = 0xFFFFFF;

    // --- NEW LOGIC: Prioritize Custom Objects for Color Detection ---
    for (const zZone of env.complexZones) {
        // Sanitize zZone properties as well (already done in getEnvironmentConfig, but defensive check)
        const safeZoneX = Number.isFinite(zZone.x) ? zZone.x : 0;
        const safeZoneZ = Number.isFinite(zZone.z) ? zZone.z : 0;
        const safeZoneRotation = Number.isFinite(zZone.rotation) ? zZone.rotation : 0;
        const safeZoneWidth = Number.isFinite(zZone.width) && zZone.width > 0 ? zZone.width : 0.01;
        const safeZoneLength = Number.isFinite(zZone.length) && zZone.length > 0 ? zZone.length : 0.01;

        const dx_raw = cx - safeZoneX; 
        const dz_raw = cz - safeZoneZ;
        const dx = Number.isFinite(dx_raw) ? dx_raw : 0;
        const dz = Number.isFinite(dz_raw) ? dz_raw : 0;

        const cR_raw = Math.cos(-safeZoneRotation); 
        const sR_raw = Math.sin(-safeZoneRotation);
        const cR = Number.isFinite(cR_raw) ? cR_raw : 0;
        const sR = Number.isFinite(sR_raw) ? sR_raw : 0;

        const lX_raw = dx * cR - dz * sR; 
        const lZ_raw = dx * sR + dz * cR;
        const lX = Number.isFinite(lX_raw) ? lX_raw : 0;
        const lZ = Number.isFinite(lZ_raw) ? lZ_raw : 0;
        
        let onZone = false; 
        
        // Dynamically calculate tolerance based on object dimensions
        // Add a small epsilon (0.1) to the half-width/length for detection "fudge factor"
        const xTolerance = safeZoneWidth / 2 + 0.1; 
        const zTolerance = safeZoneLength / 2 + 0.1; 

        if (zZone.type === 'RAMP') {
          const hW_ramp = safeZoneWidth / 2;
          const hL_ramp = safeZoneLength / 2;
          if (Math.abs(lX) <= (hW_ramp + 0.1) && Math.abs(lZ) <= (hL_ramp + 0.1)) {
            onZone = true;
          }
        }
        else if (zZone.shape === 'STRAIGHT' || !zZone.shape) { 
            if (Math.abs(lX) <= xTolerance && Math.abs(lZ) <= zTolerance) onZone = true;
        } else if (zZone.shape === 'CORNER') {
            const halfCornerWidth = safeZoneWidth / 2;
            if (
                (Math.abs(lX) <= (xTolerance) && lZ >= -0.1 && lZ <= (halfCornerWidth + 0.1)) || 
                (Math.abs(lZ) <= (zTolerance) && lX >= -0.1 && lX <= (halfCornerWidth + 0.1))    
            ) {
                onZone = true;
            }
        } else if (zZone.shape === 'CURVED') {
            const midRadius = safeZoneLength / 2; 
            const shiftedLX_raw = lX + midRadius;
            const shiftedLX = Number.isFinite(shiftedLX_raw) ? shiftedLX_raw : 0;

            const distFromArcCenter_raw = Math.sqrt(Math.pow(shiftedLX, 2) + Math.pow(lZ, 2)); 
            const distFromArcCenter = Number.isFinite(distFromArcCenter_raw) ? distFromArcCenter_raw : 0;
            
            const angle_raw = Math.atan2(lZ, shiftedLX); 
            const angle = Number.isFinite(angle_raw) ? angle_raw : 0;

            const halfPathWidth = safeZoneWidth / 2;
            if (
                Math.abs(distFromArcCenter - midRadius) <= (halfPathWidth + 0.1) && 
                angle >= -0.1 && angle <= Math.PI/2 + 0.1 
            ) {
                onZone = true;
            }
        }

        if (onZone) {
            sensorRawDecimalColor = zZone.color; 
            const hexStr = "#" + (Number.isFinite(sensorRawDecimalColor) ? sensorRawDecimalColor : 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
            
            if (isColorClose(hexStr, CANONICAL_COLOR_MAP['red'])) { sensorDetectedColor = "red"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['blue'])) { sensorDetectedColor = "blue"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['green'])) { sensorDetectedColor = "green"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['yellow'])) { sensorDetectedColor = "yellow"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['orange'])) { sensorDetectedColor = "orange"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['purple'])) { sensorDetectedColor = "purple"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['cyan'])) { sensorDetectedColor = "cyan"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['magenta'])) { sensorDetectedColor = "magenta"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['black'])) { sensorDetectedColor = "black"; }
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['white'])) { sensorDetectedColor = "white"; }
            else { 
              sensorDetectedColor = hexStr; 
            }
            break; 
        }
    }

    // --- OLD LOGIC: Challenge-specific overrides, ONLY IF no custom object color found ---
    if (sensorDetectedColor === "white") { 
        if (challengeId === 'c21') { 
            const dist_raw = Math.sqrt(Math.pow(cx - (-6), 2) + Math.pow(cz - 0, 2));
            const dist = Number.isFinite(dist_raw) ? dist_raw : 0;
            if (Math.abs(dist - 6.0) <= 0.25) { sensorDetectedColor = "black"; sensorIntensity = 5; sensorRawDecimalColor = 0x000000; }
        } else if (challengeId === 'c12') { 
            const ex = cx - 0; const ez = cz - (-8);
            const normDist_raw = Math.sqrt(Math.pow(ex/9, 2) + Math.pow(ez/6, 2));
            const normDist = Number.isFinite(normDist_raw) ? normDist_raw : 0;

            if (Math.abs(normDist - 1.0) <= 0.04) {
                sensorDetectedColor = "black"; sensorIntensity = 5; sensorRawDecimalColor = 0x000000;
                const angle_raw = Math.atan2(ez, ex); 
                const angle = Number.isFinite(angle_raw) ? angle_raw : 0;
                const deg = (angle * 180 / Math.PI + 360) % 360;
                const markerThreshold = 4.0;
                if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['red'], 0.1) || Math.abs(deg - 0) < markerThreshold || Math.abs(deg - 360) < markerThreshold) { sensorDetectedColor = "red"; sensorIntensity = 40; sensorRawDecimalColor = 0xFF0000; } 
                else if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['blue'], 0.1) || Math.abs(deg - 90) < markerThreshold) { sensorDetectedColor = "blue"; sensorIntensity = 30; sensorRawDecimalColor = 0x0000FF; } 
                else if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['green'], 0.1) || Math.abs(deg - 180) < markerThreshold) { sensorDetectedColor = "green"; sensorIntensity = 50; sensorRawDecimalColor = 0x22C55E; } 
                else if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['yellow'], 0.1) || Math.abs(deg - 270) < markerThreshold) { sensorDetectedColor = "yellow"; sensorIntensity = 80; sensorRawDecimalColor = 0xFFFF00; } 
            }
        } else if (challengeId === 'c10') { 
            if (Math.abs(cx) <= 1.25 && cz <= 0 && cz >= -15) {
                sensorDetectedColor = "#64748b"; sensorIntensity = 40; sensorRawDecimalColor = 0x64748b;
            }
        } else if (challengeId === 'c18') {
            if (Math.abs(cx) <= 2.1 && cz <= -17.25 && cz >= -17.75) {
                sensorDetectedColor = "red"; sensorIntensity = 40; sensorRawDecimalColor = 0xFF0000;
            }
        } else if (challengeId === 'c15' || challengeId === 'c14') {
            if (Math.abs(cx) <= 1.5 && cz <= -9.5 && cz >= -12.5) { sensorDetectedColor = "blue"; sensorIntensity = 30; sensorRawDecimalColor = 0x0000FF; }
            else if (Math.abs(cx) <= 1.5 && cz <= -3.5 && cz >= -6.5) { sensorDetectedColor = "red"; sensorIntensity = 40; sensorRawDecimalColor = 0xFF0000; }
        }
    }


    const touchSensorPressed = checkTouchSensorHit(safeX, safeZ, safeRotation, env.walls);
    const physicalHitForMovement_raw_sin = Number.isFinite(sin) ? sin : 0;
    const physicalHitForMovement_raw_cos = Number.isFinite(cos) ? cos : 0;

    const physicalHitForMovement = checkPhysicsHit(
        safeX + physicalHitForMovement_raw_sin * 1.5, 
        safeZ + physicalHitForMovement_raw_cos * 1.5, 
        env.walls
    );

    let distance = 255; 
    for (let d = 0; d < 40.0; d += 0.2) { 
        // Ensure sin/cos are finite before multiplication
        const currentSin = Number.isFinite(sin) ? sin : 0;
        const currentCos = Number.isFinite(cos) ? cos : 0;

        if (checkPhysicsHit(safeX + currentSin * (1.7 + d), safeZ + currentCos * (1.7 + d), env.walls)) { 
            const rawDistance = d * 10;
            distance = Math.round(Number.isFinite(rawDistance) ? rawDistance : 255); 
            break; 
        } 
    }
    
    return { 
        gyro: Number.isFinite(gyro) ? gyro : 0, 
        tilt: Number.isFinite(calculatedTilt) ? calculatedTilt : 0, 
        roll: Number.isFinite(calculatedRoll) ? calculatedRoll : 0, 
        y: Number.isFinite(calculatedY) ? calculatedY : 0, 
        isTouching: touchSensorPressed, 
        physicalHit: physicalHitForMovement, 
        distance: Number.isFinite(distance) ? distance : 255, 
        color: sensorDetectedColor, 
        intensity: Number.isFinite(sensorIntensity) ? sensorIntensity : 100, 
        rawDecimalColor: Number.isFinite(sensorRawDecimalColor) ? sensorRawDecimalColor : 0xFFFFFF, 
        sensorX: Number.isFinite(cx) ? cx : 0, 
        sensorZ: Number.isFinite(cz) ? cz : 0 
    };
};


const App: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [startBlockCount, setStartBlockCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('HOME');
  const [editorTool, setEditorTool] = useState<EditorTool>('NONE');
  const [pickerHoverColor, setPickerHoverColor] = useState<string | null>(null);
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null); 
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [projectModal, setProjectModal] = useState<{isOpen: boolean, mode: 'save' | 'load'}>({isOpen: false, mode: 'save'});
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [monitoredValues, setMonitoredValues] = useState<Record<string, any>>({});
  // FIX: Corrected useState declaration for visibleVariables.
  const [visibleVariables, setVisibleVariables] = useState<Set<string>>(() => new Set<string>());
  const blocklyEditorRef = useRef<BlocklyEditorHandle>(null);
  const controlsRef = useRef<any>(null); // Reference to OrbitControls
  const historyRef = useRef<SimulationHistory>({ maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 });
  const executionId = useRef(0);
  const [numpadConfig, setNumpadConfig] = useState({ isOpen: false, value: 0, onConfirm: (val: number) => {} });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  // Refactored drawing state
  const [activeDrawing, setActiveDrawing] = useState<ContinuousDrawing | null>(null);
  const [completedDrawings, setCompletedDrawings] = useState<ContinuousDrawing[]>([]);
  const activeDrawingRef = useRef<ContinuousDrawing | null>(null); // Ref for immediate access in callbacks

  const robotRef = useRef<RobotState>({ 
    x: 0, y: 0, z: 0, 
    rotation: 180, tilt: 0, roll: 0, 
    speed: 100, motorLeftSpeed: 0, motorRightSpeed: 0, 
    ledLeftColor: 'black', ledRightColor: 'black', 
    isMoving: false, isTouching: false, 
    penDown: false, penColor: '#000000', 
    sensorX: 0, sensorZ: 0 
  });
  const [robotState, setRobotState] = useState<RobotState>(robotRef.current);
  const isPlacingRobot = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listenersRef = useRef<{ messages: Record<string, (() => Promise<void>)[]>, colors: { color: string, cb: () => Promise<void>, lastMatch: boolean }[], obstacles: { cb: () => Promise<void>, lastMatch: boolean }[], distances: { threshold: number, cb: () => Promise<void>, lastMatch: boolean }[], variables: Record<string, any> }>({ messages: {}, colors: [], obstacles: [], distances: [], variables: {} });

  const blocklyColorFieldRef = useRef<any | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); }, []);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    executionId.current++; 
    const envObjs = activeChallenge?.environmentObjects || [];
    setCustomObjects(envObjs);
    setSelectedObjectId(null);
    
    // FIX: Ensure startX, startZ, startRot are always finite numbers before passing.
    const rawStartX = activeChallenge?.startPosition?.x;
    const rawStartZ = activeChallenge?.startPosition?.z;
    const rawStartRot = activeChallenge?.startRotation;

    const startX: number = Number.isFinite(rawStartX) ? rawStartX as number : 0; 
    const startZ: number = Number.isFinite(rawStartZ) ? rawStartZ as number : 0; 
    const startRot: number = Number.isFinite(rawStartRot) ? rawStartRot as number : 180;
    
    // Initial sensor reading for start position
    const sd_initial: SensorReadings = calculateSensorReadings(startX, startZ, startRot, activeChallenge?.id, envObjs); 
    
    // FIX: Explicitly ensure all numeric RobotState properties are finite.
    const d: RobotState = { 
        x: startX, 
        y: sd_initial.y, 
        z: startZ, 
        rotation: startRot, 
        motorLeftSpeed: 0, 
        motorRightSpeed: 0, 
        ledLeftColor: 'black', 
        ledRightColor: 'black', 
        tilt: sd_initial.tilt, 
        roll: sd_initial.roll, 
        penDown: false, 
        isTouching: false,
        isMoving: false, 
        speed: 100, 
        penColor: '#000000', 
        sensorX: sd_initial.sensorX, 
        sensorZ: sd_initial.sensorZ  
    };
    robotRef.current = d; 
    setRobotState(d); 
    setIsRunning(false); setChallengeSuccess(false); setMonitoredValues({}); 
    
    setCompletedDrawings([]);
    setActiveDrawing(null);
    activeDrawingRef.current = null; 

    historyRef.current = { maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 }; 
    listenersRef.current = { messages: {}, colors: [], obstacles: [], distances: [], variables: {} };
    if (controlsRef.current) { controlsRef.current.reset(); setCameraMode('HOME'); }
  }, [activeChallenge]);

  useEffect(() => { handleReset(); }, [activeChallenge, handleReset]);

  // General 3D environment pointer handlers for editor tools
  const handlePointerDown = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return;

    e.stopPropagation(); 
    if (editorTool === 'ROBOT_MOVE') {
      isPlacingRobot.current = true;
      const point = e.point;
      // FIX: Ensure point.x and point.z are finite numbers.
      const safePointX: number = Number.isFinite(point.x) ? point.x as number : robotRef.current.x;
      const safePointZ: number = Number.isFinite(point.z) ? point.z as number : robotRef.current.z;
      const safeRobotRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;

      const sd: SensorReadings = calculateSensorReadings(safePointX, safePointZ, safeRobotRotation, activeChallenge?.id, customObjects);
      const next = { 
          ...robotRef.current, 
          x: safePointX, // Use the sanitized value directly
          z: safePointZ, // Use the sanitized value directly
          y: sd.y, 
          tilt: sd.tilt, 
          roll: sd.roll, 
          sensorX: sd.sensorX, 
          sensorZ: sd.sensorZ 
      };
      robotRef.current = next;
      setRobotState(next);
    }
  }, [editorTool, activeChallenge, customObjects, isColorPickerActive]);

  const handlePointerMove = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return;

    e.stopPropagation(); 
    if (isPlacingRobot.current && editorTool === 'ROBOT_MOVE') {
      const point = e.point;
      // FIX: Ensure point.x and point.z are finite numbers.
      const safePointX: number = Number.isFinite(point.x) ? point.x as number : robotRef.current.x;
      const safePointZ: number = Number.isFinite(point.z) ? point.z as number : robotRef.current.z;
      const safeRobotRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;


      const sd: SensorReadings = calculateSensorReadings(safePointX, safePointZ, safeRobotRotation, activeChallenge?.id, customObjects);
      const next = { 
          ...robotRef.current, 
          x: safePointX, // Use the sanitized value directly
          z: safePointZ, // Use the sanitized value directly
          y: sd.y, 
          tilt: sd.tilt, 
          roll: sd.roll, 
          sensorX: sd.sensorX, 
          sensorZ: sd.sensorZ 
      };
      robotRef.current = next;
      setRobotState(next);
    }
  }, [editorTool, activeChallenge, customObjects, isColorPickerActive]);

  const handlePointerUp = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return;

    e.stopPropagation(); 
    isPlacingRobot.current = false;
  }, [isColorPickerActive]);

  const handleRun = useCallback(async () => {
    if (isRunning) return; 
    setIsRunning(true); 
    setChallengeSuccess(false); 
    const currentRunId = ++executionId.current; 
    const controller = new AbortController(); 
    abortControllerRef.current = controller;
    const checkAbort = () => { if (controller.signal.aborted || executionId.current !== currentRunId) throw new Error("Simulation aborted"); };
    
    const robotApi = {
      move: async (dist: number) => {
        checkAbort();
        const startX = Number.isFinite(robotRef.current.x) ? robotRef.current.x : 0;
        const startZ = Number.isFinite(robotRef.current.z) ? robotRef.current.z : 0;
        const targetDist = Math.abs(dist) * 0.1; const direction = dist > 0 ? 1 : -1;
        const power = 100 * direction;
        robotRef.current = { ...robotRef.current, motorLeftSpeed: Number.isFinite(power) ? power : 0, motorRightSpeed: Number.isFinite(power) ? power : 0 };
        while (true) {
          checkAbort();
          const moved = Math.sqrt(Math.pow(robotRef.current.x - startX, 2) + Math.pow(robotRef.current.z - startZ, 2));
          if (moved >= targetDist) break;
          await new Promise(r => setTimeout(r, TICK_RATE));
          const sd: SensorReadings = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects);
          if (sd.isTouching) break;
        }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 };
      },
      turn: async (angle: number) => {
        checkAbort();
        const initialRotation = normalizeAngle(Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation : 0);
        const targetAbsoluteRotation = normalizeAngle(initialRotation + angle);

        const direction = angle > 0 ? 1 : -1;
        const power = 50 * direction; 
        
        robotRef.current = { ...robotRef.current, motorLeftSpeed: Number.isFinite(-power) ? -power : 0, motorRightSpeed: Number.isFinite(power) ? power : 0 };

        while (true) {
          checkAbort();
          await new Promise(r => setTimeout(r, TICK_RATE));

          const currentRotation = normalizeAngle(Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation : 0);
          const diffToTarget = getAngleDifference(targetAbsoluteRotation, currentRotation);

          if (direction > 0 && diffToTarget <= TURN_TOLERANCE) break; 
          if (direction < 0 && diffToTarget >= -TURN_TOLERANCE) break; 
        }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 };
        robotRef.current.rotation = Number.isFinite(targetAbsoluteRotation) ? targetAbsoluteRotation : robotRef.current.rotation;
        setRobotState({ ...robotRef.current }); 
      },
      setHeading: async (targetAngle: number) => { 
        checkAbort(); 
        const currentRot = normalizeAngle(Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation : 0); 
        const normalizedTarget = normalizeAngle(targetAngle); 
        let diff = getAngleDifference(normalizedTarget, currentRot); 
        
        await robotApi.turn(Number.isFinite(diff) ? diff : 0);
        checkAbort();
      },
      wait: (ms: number) => new Promise((resolve, reject) => { const t = setTimeout(resolve, ms); controller.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error("Simulation aborted")); }, { once: true }); }),
      setMotorPower: async (left: number, right: number) => { checkAbort(); robotRef.current = { ...robotRef.current, motorLeftSpeed: Number.isFinite(left) ? left : 0, motorRightSpeed: Number.isFinite(right) ? right : 0 }; },
      setSpeed: async (s: number) => { checkAbort(); robotRef.current.speed = Number.isFinite(s) ? s : 100; },
      stop: async () => { checkAbort(); robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 }; },
      setPen: async (down: boolean) => { 
        checkAbort(); 
        robotRef.current.penDown = down; 
        setRobotState(prev => ({ ...prev, penDown: down }));
        
        if (!down) { 
            if (activeDrawingRef.current) {
                setCompletedDrawings(prev => [...prev, activeDrawingRef.current!]);
                setActiveDrawing(null); 
                activeDrawingRef.current = null; 
            }
        }
      },
      setPenColor: async (color: string) => { checkAbort(); robotRef.current.penColor = color; setRobotState(prev => ({ ...prev, penColor: color })); },
      clearPen: async () => { 
        checkAbort(); 
        setCompletedDrawings([]); 
        setActiveDrawing(null); 
        activeDrawingRef.current = null; 
      },
      getDistance: async () => { 
        checkAbort(); 
        // FIX: Ensure robotRef.current.x/z/rotation are finite before passing to calculateSensorReadings
        const safeX: number = Number.isFinite(robotRef.current.x) ? robotRef.current.x as number : 0;
        const safeZ: number = Number.isFinite(robotRef.current.z) ? robotRef.current.z as number : 0;
        const safeRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;
        const sd: SensorReadings = calculateSensorReadings(safeX, safeZ, safeRotation, activeChallenge?.id, customObjects);
        return sd.distance; 
      },
      getTouch: async () => { 
        checkAbort(); 
        // FIX: Ensure robotRef.current.x/z/rotation are finite before passing to calculateSensorReadings
        const safeX: number = Number.isFinite(robotRef.current.x) ? robotRef.current.x as number : 0;
        const safeZ: number = Number.isFinite(robotRef.current.z) ? robotRef.current.z as number : 0;
        const safeRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;
        const sd: SensorReadings = calculateSensorReadings(safeX, safeZ, safeRotation, activeChallenge?.id, customObjects);
        return sd.isTouching; 
      },
      getGyro: async (mode: 'ANGLE' | 'TILT') => { 
        checkAbort(); 
        // FIX: Ensure robotRef.current.x/z/rotation are finite before passing to calculateSensorReadings
        const safeX: number = Number.isFinite(robotRef.current.x) ? robotRef.current.x as number : 0;
        const safeZ: number = Number.isFinite(robotRef.current.z) ? robotRef.current.z as number : 0;
        const safeRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;
        const sd: SensorReadings = calculateSensorReadings(safeX, safeZ, safeRotation, activeChallenge?.id, customObjects); 
        return mode === 'TILT' ? sd.tilt : sd.gyro; 
      },
      getColor: async () => { 
        checkAbort(); 
        // FIX: Ensure robotRef.current.x/z/rotation are finite before passing to calculateSensorReadings
        const safeX: number = Number.isFinite(robotRef.current.x) ? robotRef.current.x as number : 0;
        const safeZ: number = Number.isFinite(robotRef.current.z) ? robotRef.current.z as number : 0;
        const safeRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;
        const sd: SensorReadings = calculateSensorReadings(safeX, safeZ, safeRotation, activeChallenge?.id, customObjects); 
        return sd.color; 
      },
      isTouchingColor: async (hex: string) => { 
        checkAbort(); 
        // FIX: Ensure robotRef.current.x/z/rotation are finite before passing to calculateSensorReadings
        const safeX: number = Number.isFinite(robotRef.current.x) ? robotRef.current.x as number : 0;
        const safeZ: number = Number.isFinite(robotRef.current.z) ? robotRef.current.z as number : 0;
        const safeRotation: number = Number.isFinite(robotRef.current.rotation) ? robotRef.current.rotation as number : 0;
        const sd: SensorReadings = calculateSensorReadings(safeX, safeZ, safeRotation, activeChallenge?.id, customObjects); 
        let detectedColorToCompare = sd.color;
        return isColorClose(detectedColorToCompare, hex); 
      },
      getCircumference: async () => 3.77,
      setLed: (side: 'left' | 'right' | 'both', color: string) => { checkAbort(); if (side === 'left' || side === 'both') robotRef.current.ledLeftColor = color; if (side === 'right' || side === 'both') robotRef.current.ledRightColor = color; setRobotState({ ...robotRef.current }); },
      onMessage: (msg: string, cb: () => Promise<void>) => { if (!listenersRef.current.messages[msg]) listenersRef.current.messages[msg] = []; listenersRef.current.messages[msg].push(cb); },
      sendMessage: async (msg: string) => { checkAbort(); if (listenersRef.current.messages[msg]) await Promise.all(listenersRef.current.messages[msg].map(cb => cb())); },
      onColor: (color: string, cb: () => Promise<void>) => { listenersRef.current.colors.push({ color, cb, lastMatch: false }); },
      onObstacle: (cb: () => Promise<void>) => { listenersRef.current.obstacles.push({ cb, lastMatch: false }); },
      onDistance: (threshold: number, cb: () => Promise<void>) => { listenersRef.current.distances.push({ threshold: Number.isFinite(threshold) ? threshold : 0, cb, lastMatch: false }); },
      updateVariable: (name: string, val: any) => { setMonitoredValues(prev => ({ ...prev, [name]: val })); },
      stopProgram: async () => { controller.abort(); setIsRunning(false); }
    };
    try { 
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor; 
        await new AsyncFunction('robot', generatedCode)(robotApi); 
    } catch (e: any) { 
        if (e.message !== "Simulation aborted") { console.error(e); setIsRunning(false); } 
    }
  }, [isRunning, generatedCode, activeChallenge, customObjects]);

  useEffect(() => {
    let interval: any; 
    if (isRunning) { 
      interval = setInterval(() => { 
        const current = robotRef.current; 

        // --- Aggressive NaN and Finite Number Check at the start of each tick ---
        const safeX = Number.isFinite(current.x) ? current.x : 0;
        const safeY = Number.isFinite(current.y) ? current.y : 0;
        const safeZ = Number.isFinite(current.z) ? current.z : 0;
        const safeRotation = Number.isFinite(current.rotation) ? current.rotation : 0;
        const safeTilt = Number.isFinite(current.tilt) ? current.tilt : 0;
        const safeRoll = Number.isFinite(current.roll) ? current.roll : 0;
        const safeSpeed = Number.isFinite(current.speed) ? current.speed : 100;
        const safeMotorLeftSpeed = Number.isFinite(current.motorLeftSpeed) ? current.motorLeftSpeed : 0;
        const safeMotorRightSpeed = Number.isFinite(current.motorRightSpeed) ? current.motorRightSpeed : 0;
        // --- End Aggressive NaN and Finite Number Check ---

        // Simplified calculation of fV and rV from direct motor speeds (from working version)
        const f = safeSpeed / 100.0; 
        const pL = safeMotorLeftSpeed / 100.0; 
        const pR = safeMotorRightSpeed / 100.0;
        
        let fV_raw = ((pL + pR) / 2.0) * BASE_VELOCITY * f; 
        let fV_adjusted = Number.isFinite(fV_raw) ? fV_raw : 0; // Sanitize fV_raw immediately
        const rV_raw = (pR - pL) * BASE_TURN_SPEED * f; 
        const rV = Number.isFinite(rV_raw) ? rV_raw : 0; // Sanitize rV_raw immediately
        
        // --- Dynamic Velocity Reduction (retained as an. improvement) ---
        const sd_current_for_tilt: SensorReadings = calculateSensorReadings(safeX, safeZ, safeRotation, activeChallenge?.id, customObjects);
        const currentTilt = sd_current_for_tilt.tilt; // Sanitize currentTilt

        if (Math.abs(currentTilt) > 3) { 
            let tiltFactor = Math.abs(currentTilt) / 25; 
            tiltFactor = Number.isFinite(tiltFactor) ? Math.min(tiltFactor, 1) : 0; // Sanitize tiltFactor
            
            let reductionMultiplier = 1;

            if (fV_adjusted > 0 && currentTilt > 0) { 
                reductionMultiplier = Math.max(0.2, 1 - tiltFactor * 0.8); 
            } else if (fV_adjusted < 0 && currentTilt < 0) { 
                reductionMultiplier = Math.max(0.2, 1 - tiltFactor * 0.8); 
            }
            fV_adjusted = fV_adjusted * (Number.isFinite(reductionMultiplier) ? reductionMultiplier : 1); // Sanitize result
        }
        // --- End Dynamic Velocity Reduction ---

        const nr_potential_raw = safeRotation + rV; 
        const nr_potential = Number.isFinite(nr_potential_raw) ? nr_potential_raw : safeRotation; // Sanitize nr_potential

        const nx_potential_raw = safeX + (Number.isFinite(Math.sin(nr_potential * Math.PI / 180)) ? Math.sin(nr_potential * Math.PI / 180) : 0) * fV_adjusted; 
        const nx_potential = Number.isFinite(nx_potential_raw) ? nx_potential_raw : safeX; // Sanitize nx_potential
        
        const nz_potential_raw = safeZ + (Number.isFinite(Math.cos(nr_potential * Math.PI / 180)) ? Math.cos(nr_potential * Math.PI / 180) : 0) * fV_adjusted; 
        const nz_potential = Number.isFinite(nz_potential_raw) ? nz_potential_raw : safeZ; // Sanitize nz_potential
        
        // Calculate sensor readings for the *potential* next position
        const sd_predicted: SensorReadings = calculateSensorReadings(nx_potential, nz_potential, nr_potential, activeChallenge?.id, customObjects);
        
        const finalX = sd_predicted.isTouching ? safeX : nx_potential; 
        const finalZ = sd_predicted.isTouching ? safeZ : nz_potential;
        
        const next: RobotState = { 
          ...current, 
          x: Number.isFinite(finalX) ? finalX : safeX, 
          z: Number.isFinite(finalZ) ? finalZ : safeZ, 
          y: Number.isFinite(sd_predicted.y) ? (safeY + (sd_predicted.y - safeY) * 0.3) : safeY, 
          tilt: Number.isFinite(sd_predicted.tilt) ? (safeTilt + (sd_predicted.tilt - safeTilt) * 0.3) : safeTilt, 
          roll: Number.isFinite(sd_predicted.roll) ? (safeRoll + (sd_predicted.roll - safeRoll) * 0.3) : safeRoll, 
          rotation: Number.isFinite(nr_potential) ? nr_potential : safeRotation, 
          isTouching: sd_predicted.isTouching, 
          isMoving: Number.isFinite(fV_adjusted) && Number.isFinite(rV) && (Math.abs(fV_adjusted) > 0.001 || Math.abs(rV) > 0.001), 
          sensorX: Number.isFinite(sd_predicted.sensorX) ? sd_predicted.sensorX : 0, 
          sensorZ: Number.isFinite(sd_predicted.sensorZ) ? sd_predicted.sensorZ : 0, 
        }; 
        robotRef.current = next; setRobotState(next); 

        const curDetectedColor = sd_predicted.color; 
        listenersRef.current.colors.forEach(l => { 
            const isMatch = isColorClose(curDetectedColor, l.color); 
            if (isMatch && !l.lastMatch) l.cb(); 
            l.lastMatch = isMatch; 
        });
        listenersRef.current.obstacles.forEach(l => { 
            const isMatch = sd_predicted.isTouching;
            if (isMatch && !l.lastMatch) l.cb(); 
            l.lastMatch = isMatch; 
        });
        listenersRef.current.distances.forEach(l => { 
            const isMatch = sd_predicted.distance < l.threshold; 
            if (isMatch && !l.lastMatch) l.cb(); 
            l.lastMatch = isMatch; 
        });
        if (sd_predicted.isTouching) historyRef.current.touchedWall = true; 
        
        // Ensure startX and startZ from activeChallenge are finite
        const histStartX: number = Number.isFinite(activeChallenge?.startPosition?.x) ? activeChallenge?.startPosition?.x as number : 0; 
        const histStartZ: number = Number.isFinite(activeChallenge?.startPosition?.z) ? activeChallenge?.startPosition?.z as number : 0;
        const distMoved_raw = Math.sqrt(Math.pow(next.x - histStartX, 2) + Math.pow(next.z - histStartZ, 2));
        historyRef.current.maxDistanceMoved = Math.max(historyRef.current.maxDistanceMoved, (Number.isFinite(distMoved_raw) ? distMoved_raw : 0) * 10); 
        if (!historyRef.current.detectedColors.includes(curDetectedColor)) historyRef.current.detectedColors.push(curDetectedColor);
        
        // FIX: Ensure activeChallenge?.startRotation is explicitly a number
        const startRotationForHistory: number = Number.isFinite(activeChallenge?.startRotation) ? activeChallenge?.startRotation as number : 180;
        historyRef.current.totalRotation = Number.isFinite(robotRef.current.rotation) ? (robotRef.current.rotation - startRotationForHistory) : 0;

        // --- NEW DRAWING LOGIC ---
        if (next.penDown) { 
          const currPos: [number, number, number] = [
            Number.isFinite(next.x) ? next.x : 0, 
            Number.isFinite(next.y) ? (next.y + 0.02) : 0.02, 
            Number.isFinite(next.z) ? next.z : 0
          ]; 
          
          setActiveDrawing(prevActiveDrawing => {
              let drawingToModify = prevActiveDrawing;

              if (!drawingToModify || drawingToModify.color !== next.penColor) {
                  if (drawingToModify) { 
                      setCompletedDrawings(oldCompleted => [...oldCompleted, drawingToModify!]);
                  }
                  const newDrawing = { id: `path-${Date.now()}`, points: [currPos], color: next.penColor };
                  activeDrawingRef.current = newDrawing; 
                  return newDrawing;
              } else {
                  const hasMovedSignificantly = drawingToModify.points.length > 0 &&
                      (Math.pow(currPos[0] - drawingToModify.points[drawingToModify.points.length - 1][0], 2) + 
                       Math.pow(currPos[2] - drawingToModify.points[drawingToModify.points.length - 1][2], 2) > 0.001);

                  if (drawingToModify.points.length === 0 || hasMovedSignificantly) {
                      const updatedDrawing = { ...drawingToModify, points: [...drawingToModify.points, currPos] };
                      activeDrawingRef.current = updatedDrawing; 
                      return updatedDrawing;
                  }
                  activeDrawingRef.current = drawingToModify; 
                  return drawingToModify;
              }
          });
        } else { 
            if (activeDrawingRef.current) { 
                setCompletedDrawings(prevCompleted => [...prevCompleted, activeDrawingRef.current!]);
                setActiveDrawing(null);
                activeDrawingRef.current = null; 
            }
        }
        // --- END NEW DRAWING LOGIC ---

        if (activeChallenge && activeChallenge.check(robotRef.current, robotRef.current, historyRef.current) && !challengeSuccess) { setChallengeSuccess(true); showToast("Mission Accomplished!", "success"); } 
      }, TICK_RATE); 
    } 
    return () => {
      clearInterval(interval);
      if (activeDrawingRef.current) {
          setCompletedDrawings(prevCompleted => [...prevCompleted, activeDrawingRef.current!]);
          setActiveDrawing(null);
          activeDrawingRef.current = null; 
      }
    };
  }, [isRunning, customObjects, activeChallenge, challengeSuccess, showToast]); 

  const sensorReadings: SensorReadings = useMemo(() => calculateSensorReadings(robotState.x, robotState.z, robotState.rotation, activeChallenge?.id, customObjects), [robotState.x, robotState.z, robotState.rotation, activeChallenge, customObjects]);

  const orbitControlsProps = useMemo(() => {
    let props: any = {
      enablePan: true,
      enableRotate: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      minPolarAngle: 0, 
      maxPolarAngle: Math.PI,
      minDistance: 1.2,
      maxDistance: 60,
    };

    if (editorTool === 'PAN') {
      props.enablePan = true;
      props.enableRotate = false;
      props.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE 
      };
    } else if (editorTool === 'ROBOT_MOVE') {
      props.enablePan = false;
      props.enableRotate = false;
    }

    if (isColorPickerActive) {
        props.enablePan = false;
        props.enableRotate = false;
        props.enableZoom = false;
    }

    if (cameraMode === 'TOP') {
      props.enableRotate = false; 
      props.minPolarAngle = 0;    
      props.maxPolarAngle = 0;    
      props.mouseButtons = { 
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.DOLLY 
      };
    } else if (cameraMode === 'FOLLOW') { 
      props.enableRotate = false; 
      props.enablePan = false;    
      props.minPolarAngle = Math.PI / 6; 
      maxPolarAngle: Math.PI / 2 - 0.1; 
      props.mouseButtons = { 
        LEFT: THREE.MOUSE.DOLLY,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.DOLLY 
      };
    }

    return props;
  }, [editorTool, cameraMode, isColorPickerActive]);

  useEffect(() => {
    if (controlsRef.current) {
      if (cameraMode === 'HOME') {
        controlsRef.current.reset(); 
        controlsRef.current.minDistance = 1.2; 
        controlsRef.current.maxDistance = 60;
      } else if (cameraMode === 'TOP') {
        controlsRef.current.object.position.set(0, 20, 0); 
        controlsRef.current.target.set(0, 0, 0); 
        controlsRef.current.minDistance = 0.1; 
        controlsRef.current.maxDistance = 100; 
      } else if (cameraMode === 'FOLLOW') {
        controlsRef.current.minDistance = 1; 
        controlsRef.current.maxDistance = 20;
      }
      controlsRef.current.update(); 
    }
  }, [cameraMode, controlsRef]);


  const openPythonView = () => {
    if (blocklyEditorRef.current) {
      setIsPythonModalOpen(true);
    }
  };

  const showBlocklyNumpad = useCallback((initialValue: string | number, onConfirm: (newValue: number) => void) => {
    setNumpadConfig({ isOpen: true, value: parseFloat(String(initialValue)), onConfirm });
  }, []);

  const handlePickerHover = useCallback((hexColor: string) => {
    setPickerHoverColor(hexColor);
  }, []);

  const handlePickerSelect = useCallback((hexColor: string, field: any) => {
    if (field) {
      field.setValue(hexColor); 
    } else {
      console.error("ColorPickerTool: Blockly field instance is null. Cannot set color.");
      showToast("Failed to set color in Blockly. Please try again.", "error");
    }
    setIsColorPickerActive(false);
    setPickerHoverColor(null);
    blocklyColorFieldRef.current = null; 
  }, [showToast]); 

  const showBlocklyColorPicker = useCallback((field: any) => {
    setIsColorPickerActive(true); 
    blocklyColorFieldRef.current = field; 
  }, []);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50" dir="ltr">
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[500000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 border-2 ${toast.type === 'success' ? 'bg-green-600 border-green-400 text-white' : toast.type === 'error' ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
          {toast.type === 'success' ? <Check size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
      
      <header className="bg-slate-900 text-white p-3 flex justify-between items-center shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold hidden sm:block tracking-tight text-slate-100">Virtual Robotics Lab</h1>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <button 
            onClick={handleRun} 
            disabled={isRunning || startBlockCount === 0} 
            className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${isRunning || startBlockCount === 0 ? 'bg-slate-700/50 text-slate-600' : 'bg-green-600 text-white hover:bg-green-500'}`}
            title="הפעל תוכנית"
          >
            <Flag size={20} fill={(isRunning || startBlockCount === 0) ? "none" : "currentColor"} />
          </button>
          
          <button 
            onClick={handleReset} 
            className="flex items-center justify-center w-11 h-11 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-md active:shadow-none"
            title="איפוס"
          >
            <RotateCcw size={22} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          
          <button 
            onClick={() => setIsRulerActive(!isRulerActive)} 
            className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${isRulerActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            title="כלי מדידה"
          >
            <Ruler size={20} />
          </button>
          
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          
          <button 
            onClick={() => setProjectModal({ isOpen: true, mode: 'save' })}
            className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 hover:bg-slate-600 rounded-xl font-bold transition-all transform active:scale-95"
            title="שמור פרויקט"
          >
            <Save size={20} />
          </button>

          <button 
            onClick={() => setProjectModal({ isOpen: true, mode: 'load' })}
            className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 hover:bg-slate-600 rounded-xl font-bold transition-all transform active:scale-95"
            title="פתח פרויקט"
          >
            <FolderOpen size={20} />
          </button>
          
          <div className="w-px h-6 bg-slate-700 mx-1"></div>

          <button 
            onClick={openPythonView}
            className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 hover:bg-slate-600 rounded-xl font-bold transition-all transform active:scale-95"
            title="קוד פייתון"
          >
            <Terminal size={20} />
          </button>
        </div>
        
        <button 
          onClick={() => setShowChallenges(true)} 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${activeChallenge ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <Trophy size={16} /> 
          {activeChallenge ? activeChallenge.title : "Challenges"}
        </button>
      </header>
      
      <main className="flex flex-1 overflow-hidden relative">
        <div className="w-1/2 relative flex flex-col bg-white text-left text-sm border-r border-slate-200">
          <div className="bg-slate-50 border-b p-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-slate-400" />
              <span className="font-bold text-slate-600 uppercase tracking-tight">Workspace</span>
            </div>
          </div>
          <div className="flex-1 relative">
            <BlocklyEditor 
              ref={blocklyEditorRef} 
              onCodeChange={useCallback((code, count) => { setGeneratedCode(code); setStartBlockCount(count); }, [])} 
              visibleVariables={visibleVariables} 
              onToggleVariable={useCallback((n) => setVisibleVariables(v => { const next = new Set(v); if (next.has(n)) next.delete(n); else next.add(n); return next; }), [])} 
              onShowNumpad={showBlocklyNumpad} 
              onShowColorPicker={showBlocklyColorPicker} 
            />
          </div>
        </div>
        
        <div className="w-1/2 relative bg-slate-900 overflow-hidden" style={{ cursor: isColorPickerActive ? DROPPER_CURSOR_URL : 'auto' }}>
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-3">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-1 flex flex-col overflow-hidden">
              <button 
                onClick={() => { setCameraMode('HOME'); }} 
                className="p-3 text-blue-600 hover:bg-slate-50 transition-all rounded-xl active:scale-95" 
                title="איפוס מצלמה"
              >
                <Home size={22} />
              </button>
              
              <div className="h-px bg-slate-100 mx-2 my-0.5" />
              
              <button 
                onClick={() => setCameraMode(prev => prev === 'TOP' ? 'HOME' : 'TOP')} 
                className={`p-3 transition-all rounded-xl active:scale-95 ${cameraMode === 'TOP' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} 
                title="מבט מלמעלה"
              >
                <Eye size={22} />
              </button>

              <button 
                onClick={() => setCameraMode(prev => prev === 'FOLLOW' ? 'HOME' : 'FOLLOW')} 
                className={`p-3 transition-all rounded-xl active:scale-95 ${cameraMode === 'FOLLOW' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} 
                title="מצלמה עוקבת"
              >
                <Target size={22} />
              </button>
              
              <div className="h-px bg-slate-100 mx-2 my-0.5" />

              <button
                onClick={() => {
                  controlsRef.current?.dollyIn(0.9); 
                  controlsRef.current?.update(); 
                }}
                className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all active:scale-95"
                title="התקרבות (זום אין)"
              >
                <ZoomIn size={22} />
              </button>

              <button
                onClick={() => {
                  controlsRef.current?.dollyOut(0.9); 
                  controlsRef.current?.update(); 
                }}
                className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all active:scale-95"
                title="התרחקות (זום אאוט)"
              >
                <ZoomOut size={22} />
              </button>

              <div className="h-px bg-slate-100 mx-2 my-0.5" />
              
              <button 
                onClick={() => setEditorTool(prev => prev === 'PAN' ? 'NONE' : 'PAN')} 
                className={`p-3 transition-all rounded-xl active:scale-95 ${editorTool === 'PAN' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} 
                title="כלי גרירה (לחצן שמאלי)"
              >
                <Hand size={22} />
              </button>
              
              <button 
                onClick={() => setEditorTool('NONE')} 
                className={`p-3 transition-all rounded-xl active:scale-95 ${editorTool === 'NONE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} 
                title="כלי סיבוב (לחצן שמאלי)"
              >
                <Move size={22} />
              </button>
              
              <button 
                onClick={() => setEditorTool(prev => prev === 'ROBOT_MOVE' ? 'NONE' : 'ROBOT_MOVE')} 
                className={`p-3 transition-all rounded-xl active:scale-95 ${editorTool === 'ROBOT_MOVE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} 
                title="הזז מיקום רובוט"
              >
                <Bot size={22} />
              </button>
            </div>
          </div>
          
          <SensorDashboard 
            distance={sensorReadings.distance} 
            isTouching={sensorReadings.isTouching} 
            gyroAngle={sensorReadings.gyro} 
            tiltAngle={sensorReadings.tilt} 
            detectedColor={sensorReadings.color} 
            lightIntensity={sensorReadings.intensity} 
            overrideColor={isColorPickerActive ? pickerHoverColor : null} 
            onColorClick={() => setIsColorPickerActive(!isColorPickerActive)} 
          />
          
          <Canvas 
            shadows 
            camera={{ position: [10, 10, 10], fov: 45 }}
          >
            <CameraLayerManager /> 
            <SimulationEnvironment 
              challengeId={activeChallenge?.id} 
              customObjects={customObjects} 
              robotState={robotState} 
              selectedObjectId={selectedObjectId} 
              onObjectSelect={setSelectedObjectId} 
              onPointerDown={isColorPickerActive ? undefined : handlePointerDown}
              onPointerMove={isColorPickerActive ? undefined : handlePointerMove}
              onPointerUp={isColorPickerActive ? undefined : handlePointerUp}
            />
            {completedDrawings.map((path) => (
                <Line key={path.id} points={path.points} color={path.color} lineWidth={4} />
            ))}
            {activeDrawing && activeDrawing.points.length > 1 && ( 
                <Line key={activeDrawing.id} points={activeDrawing.points} color={activeDrawing.color} lineWidth={4} />
            )}
            <Robot3D state={robotState} isPlacementMode={editorTool === 'ROBOT_MOVE'} />
            <OrbitControls 
              ref={controlsRef} 
              makeDefault 
              {...orbitControlsProps}
            />
            <CameraManager robotState={robotState} cameraMode={cameraMode} controlsRef={controlsRef} />
            {isRulerActive && <RulerTool />}
            {isColorPickerActive && (
              <ColorPickerTool 
                onColorHover={handlePickerHover} 
                onColorSelect={handlePickerSelect} 
                blocklyFieldRef={blocklyColorFieldRef} 
              />
            )}
          </Canvas>
        </div>
      </main>
      
      {isPythonModalOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-700">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                <FileCode className="text-blue-400" /> Python Code Output
              </h2>
              <button 
                onClick={() => setIsPythonModalOpen(false)} 
                className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 font-mono text-sm">
              <pre className="text-blue-300 whitespace-pre-wrap">
                {blocklyEditorRef.current?.getPythonCode()}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => {
                  const code = blocklyEditorRef.current?.getPythonCode();
                  if (code) navigator.clipboard.writeText(code);
                  showToast("Code copied to clipboard!", "success");
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      {projectModal.isOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border-2 border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {projectModal.mode === 'save' ? <Save size={20} className="text-blue-600"/> : <FolderOpen size={20} className="text-orange-600"/>}
                {projectModal.mode === 'save' ? 'שמירת פרויקט' : 'טעינת פרויקט'}
              </h2>
              <button onClick={() => setProjectModal({...projectModal, isOpen: false})} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              {projectModal.mode === 'save' ? (
                <>
                  <p className="text-slate-500 text-sm">הורד את סביבת העבודה שלך כקובץ `.{'roby'}` לשמירת ההתקדמות שלך מקומית.</p>
                  <button 
                    onClick={() => {
                      const xml = blocklyEditorRef.current?.saveWorkspace();
                      if (xml) {
                        const blob = new Blob([xml], {type: 'text/xml'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'robot-project.roby';
                        a.click();
                        showToast("Project saved successfully!", "success");
                      }
                      setProjectModal({...projectModal, isOpen: false});
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                  >
                    הורד פרויקט (קובץ .roby)
                  </button>
                </>
              ) : (
                <>
                  <p className="text-slate-500 text-sm">בחר קובץ `.{'roby'}` או `.{'xml'}` מהמחשב שלך כדי לשחזר את סביבת העבודה.</p>
                  <input 
                    type="file" 
                    accept=".roby,.xml" 
                    className="hidden" 
                    id="project-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          const content = re.target?.result as string;
                          blocklyEditorRef.current?.loadWorkspace(content);
                          showToast("Project loaded successfully!", "success");
                          setProjectModal({...projectModal, isOpen: false});
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="project-upload"
                    className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold shadow-lg text-center cursor-pointer active:scale-95 transition-all"
                  >
                    בחר קובץ לטעינה
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Numpad 
        isOpen={numpadConfig.isOpen} 
        initialValue={numpadConfig.value} 
        onConfirm={numpadConfig.onConfirm} 
        onClose={() => setNumpadConfig(p => ({ ...p, isOpen: false }))} 
      />
      
      {showChallenges && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Trophy className="text-yellow-500" /> Coding Challenges
              </h2>
              <button 
                onClick={() => setShowChallenges(false)} 
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button 
                  onClick={() => { setActiveChallenge(null); setShowChallenges(false); }} 
                  className={`p-5 rounded-3xl border-4 text-left transition-all hover:scale-[1.02] flex flex-col gap-3 group relative overflow-hidden ${activeChallenge === null ? 'border-blue-500 bg-white shadow-xl' : 'border-white bg-white hover:border-blue-300 shadow-md'}`}
                >
                  <h3 className={`font-bold text-lg z-10 transition-colors ${activeChallenge === null ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>
                    נהיגה חופשית (ללא משימה)
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 z-10">סביבה פתוחה לתרגול חופשי ללא קירות או מסלולים מוגדרים מראש.</p>
                </button>

                {CHALLENGES.map((challenge) => (
                  <button 
                    key={challenge.id} 
                    onClick={() => { setActiveChallenge(challenge); setShowChallenges(false); }} 
                    className={`p-5 rounded-3xl border-4 text-left transition-all hover:scale-[1.02] flex flex-col gap-3 group relative overflow-hidden ${activeChallenge?.id === challenge.id ? 'border-yellow-500 bg-white shadow-xl' : 'border-white bg-white hover:border-blue-300 shadow-md'}`}
                  >
                    <h3 className={`font-bold text-lg z-10 transition-colors ${activeChallenge?.id === challenge.id ? 'text-yellow-600' : 'text-slate-800 group-hover:text-blue-600'}`}>
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-3 z-10">{challenge.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
