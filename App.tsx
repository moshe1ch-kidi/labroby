 import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { RotateCcw, Code2, Ruler, Trophy, X, Flag, Save, FolderOpen, Check, AlertCircle, Info, Terminal, Star, Home, Eye, Move, Hand, Bot, Target, FileCode, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';
import BlocklyEditor, { BlocklyEditorHandle } from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState, CustomObject, ContinuousDrawing, SimulationHistory, CameraMode, EditorTool, PathShape } from './types';
import Numpad from './components/Numpad';
import SensorDashboard from './components/SensorDashboard';
import RulerTool from './components/RulerTool';
import ColorPickerTool from './components/ColorPickerTool'; // Import the new ColorPickerTool
import CameraManager from './components/CameraManager'; // ייבוא CameraManager
import { CHALLENGES, Challenge } from './data/challenges';
import { ThreeEvent } from '@react-three/fiber'; // Import ThreeEvent here

const TICK_RATE = 16; 
const BASE_VELOCITY = 0.165; // Retained at 3x original for normal forward movement
const BASE_TURN_SPEED = 3.9; // Increased to 30x original (0.13 * 30) for much faster turning
const TURN_TOLERANCE = 0.5; // degrees - for turn precision

// Fixed SVG URL to prevent ERR_INVALID_URL
const DROPPER_CURSOR_URL = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlYzQ4OTkiIHN0cm9rZS13aWR0aD0iMiIgc3RyY2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTAuNSAxMC41bDEwLTEwIi8+PHBhdGggZD0iTTggMTNsLTIgMm0tMiAySDRsLTItMiAyLTJtMi0ybDItMiIvPjwvc3ZnPg==') 0 24, crosshair`;

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
        if (obj.type === 'WALL') { const hW = obj.width / 2; const hL = obj.length / 2; walls.push({ minX: obj.x - hW, maxX: obj.x + hW, minZ: obj.z - hL, maxZ: obj.z + hL }); }
        else if (obj.type === 'PATH') { const lineHex = obj.color || '#FFFF00'; const colorVal = parseInt(lineHex.replace('#', '0x'), 16); complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: colorVal, shape: obj.shape || 'STRAIGHT', type: obj.type }); } 
        else if (obj.type === 'COLOR_LINE') { const hC = obj.color || '#FF0000'; complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: parseInt(hC.replace('#', '0x'), 16), type: obj.type }); }
        else if (obj.type === 'RAMP') { // Ramps can also have colors
          const rampHex = obj.color || '#334155';
          const colorVal = parseInt(rampHex.replace('#', '0x'), 16);
          complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: colorVal, type: obj.type });
        }
    });
    return { walls, complexZones };
};

const getSurfaceHeightAt = (qx: number, qz: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    let maxHeight = 0;
    for (const obj of customObjects) {
        if (obj.type === 'RAMP') {
            const { lx, lz } = getLocalCoords(qx, qz, obj.x, obj.z, obj.rotation || 0);
            const hW = obj.width / 2; 
            const hL = obj.length / 2; 
            const h = obj.height || 1.0; 
            if (Math.abs(lx) <= hW && Math.abs(lz) <= hL) {
                const section = obj.length / 3; 
                const uphillEnd = -hL + section; 
                const downhillStart = hL - section;
                let currentY = 0;
                if (lz < uphillEnd) {
                    const t = (lz - (-hL)) / section;
                    currentY = t * h;
                } else if (lz < downhillStart) {
                    currentY = h;
                } else {
                    const t = (lz - downhillStart) / section;
                    currentY = h - (t * h);
                }
                maxHeight = Math.max(maxHeight, currentY);
            }
        }
    }
    if (challengeId === 'c18') {
        if (qx >= -2.1 && qx <= 2.1) {
            if (qz < -0.2 && qz > -3.7) maxHeight = Math.max(maxHeight, ((qz - (-0.2)) / -3.5) * 1.73);
            else if (qz <= -3.7 && qz >= -7.4) maxHeight = Math.max(maxHeight, 1.73);
            else if (qz < -7.4 && qz > -10.9) maxHeight = Math.max(maxHeight, 1.73 - (((qz - (-7.4)) / -3.5) * 1.73));
        }
    }
    return maxHeight;
};

const checkTouchSensorHit = (x: number, z: number, rotation: number, walls: {minX: number, maxX: number, minZ: number, maxZ: number}[]) => {
    const rad = (rotation * Math.PI) / 180; 
    const sin = Math.sin(rad); 
    const cos = Math.cos(rad);
    const sensorTipX = x + sin * 1.7; 
    const sensorTipZ = z + cos * 1.7;
    for (const w of walls) { 
        if (sensorTipX >= w.minX && sensorTipX <= w.maxX && sensorTipZ >= w.minZ && sensorTipZ <= w.maxZ) return true; 
    }
    return false;
};

const checkPhysicsHit = (px: number, pz: number, walls: {minX: number, maxX: number, minZ: number, maxZ: number}[]) => {
    for (const w of walls) { 
        if (px >= w.minX && px <= w.maxX && pz >= w.minZ && pz <= w.maxZ) return true; 
    }
    return false;
};

const calculateSensorReadings = (x: number, z: number, rotation: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    const rad = (rotation * Math.PI) / 180; 
    const sin = Math.sin(rad); 
    const cos = Math.cos(rad);
    const env = getEnvironmentConfig(challengeId, customObjects);
    const gyro = Math.round(normalizeAngle(rotation)); 
    
    const getPointWorldPos = (lx: number, lz: number) => ({
        wx: x + (lx * Math.cos(rad) + lz * Math.sin(rad)),
        wz: z + (-lx * Math.sin(rad) + lz * Math.cos(rad))
    });

    const wheelOffsetZ = 0.5; 
    const wheelOffsetX = 0.95; 
    const casterOffsetZ = -0.8; 
    const frontSensorPos = getPointWorldPos(0, 1.1); 

    const leftWheelPos = getPointWorldPos(-wheelOffsetX, wheelOffsetZ);
    const rightWheelPos = getPointWorldPos(wheelOffsetX, wheelOffsetZ);
    const backCasterPos = getPointWorldPos(0, casterOffsetZ);

    const hLeft = getSurfaceHeightAt(leftWheelPos.wx, leftWheelPos.wz, challengeId, customObjects);
    const hRight = getSurfaceHeightAt(rightWheelPos.wx, rightWheelPos.wz, challengeId, customObjects);
    const hBack = getSurfaceHeightAt(backCasterPos.wx, backCasterPos.wz, challengeId, customObjects);
    const hFront = getSurfaceHeightAt(frontSensorPos.wx, frontSensorPos.wz, challengeId, customObjects);

    const y = (hLeft + hRight + hBack) / 3; 
    const frontAvg = (hLeft + hRight) / 2;
    const tilt = Math.atan2(frontAvg - hBack, 1.3) * (180 / Math.PI); 
    const roll = Math.atan2(hLeft - hRight, wheelOffsetX * 2) * (180 / Math.PI); 

    const cx = x + sin * 0.9; 
    const cz = z + cos * 0.9;
    let sensorDetectedColor = "white"; 
    let sensorIntensity = 100; 
    let sensorRawDecimalColor = 0xFFFFFF;

    for (const zZone of env.complexZones) {
        const dx = cx - zZone.x; 
        const dz = cz - zZone.z;
        const cR = Math.cos(-zZone.rotation); 
        const sR = Math.sin(-zZone.rotation);
        const lX = dx * cR - dz * sR; 
        const lZ = dx * sR + dz * cR;
        let onZone = false; 
        
        const xTolerance = zZone.width / 2 + 0.1; 
        const zTolerance = zZone.length / 2 + 0.1; 

        if (zZone.type === 'RAMP') {
          const hW_ramp = zZone.width / 2;
          const hL_ramp = zZone.length / 2;
          if (Math.abs(lX) <= (hW_ramp + 0.1) && Math.abs(lZ) <= (hL_ramp + 0.1)) onZone = true;
        }
        else if (zZone.shape === 'STRAIGHT' || !zZone.shape) {
            if (Math.abs(lX) <= xTolerance && Math.abs(lZ) <= zTolerance) onZone = true;
        } else if (zZone.shape === 'CORNER') {
            const halfCornerWidth = zZone.width / 2;
            if ((Math.abs(lX) <= (xTolerance) && lZ >= -0.1 && lZ <= (halfCornerWidth + 0.1)) || (Math.abs(lZ) <= (zTolerance) && lX >= -0.1 && lX <= (halfCornerWidth + 0.1))) onZone = true;
        } else if (zZone.shape === 'CURVED') {
            const midRadius = zZone.length / 2;
            const shiftedLX = lX + midRadius;
            const distFromArcCenter = Math.sqrt(Math.pow(shiftedLX, 2) + Math.pow(lZ, 2)); 
            const angle = Math.atan2(lZ, shiftedLX); 
            const halfPathWidth = zZone.width / 2;
            if (Math.abs(distFromArcCenter - midRadius) <= (halfPathWidth + 0.1) && angle >= -0.1 && angle <= Math.PI/2 + 0.1) onZone = true;
        }

        if (onZone) {
            sensorRawDecimalColor = zZone.color; 
            const hexStr = "#" + sensorRawDecimalColor.toString(16).padStart(6, '0').toUpperCase();
            if (isColorClose(hexStr, CANONICAL_COLOR_MAP['red'])) sensorDetectedColor = "red";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['blue'])) sensorDetectedColor = "blue";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['green'])) sensorDetectedColor = "green";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['yellow'])) sensorDetectedColor = "yellow";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['orange'])) sensorDetectedColor = "orange";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['purple'])) sensorDetectedColor = "purple";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['cyan'])) sensorDetectedColor = "cyan";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['magenta'])) sensorDetectedColor = "magenta";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['black'])) sensorDetectedColor = "black";
            else if (isColorClose(hexStr, CANONICAL_COLOR_MAP['white'])) sensorDetectedColor = "white";
            else sensorDetectedColor = hexStr;
            break; 
        }
    }

    if (sensorDetectedColor === "white") {
        if (challengeId === 'c21') { 
            const dist = Math.sqrt(Math.pow(cx - (-6), 2) + Math.pow(cz - 0, 2));
            if (Math.abs(dist - 6.0) <= 0.25) { sensorDetectedColor = "black"; sensorIntensity = 5; sensorRawDecimalColor = 0x000000; }
        } else if (challengeId === 'c12') { 
            const ex = cx - 0; const ez = cz - (-8);
            const normDist = Math.sqrt(Math.pow(ex/9, 2) + Math.pow(ez/6, 2));
            if (Math.abs(normDist - 1.0) <= 0.04) {
                sensorDetectedColor = "black"; sensorIntensity = 5; sensorRawDecimalColor = 0x000000;
                const angle = Math.atan2(ez, ex); 
                const deg = (angle * 180 / Math.PI + 360) % 360;
                const markerThreshold = 4.0;
                if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['red'], 0.1) || Math.abs(deg - 0) < markerThreshold || Math.abs(deg - 360) < markerThreshold) { sensorDetectedColor = "red"; sensorIntensity = 40; sensorRawDecimalColor = 0xFF0000; }
                else if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['blue'], 0.1) || Math.abs(deg - 90) < markerThreshold) { sensorDetectedColor = "blue"; sensorIntensity = 30; sensorRawDecimalColor = 0x0000FF; }
                else if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['green'], 0.1) || Math.abs(deg - 180) < markerThreshold) { sensorDetectedColor = "green"; sensorIntensity = 50; sensorRawDecimalColor = 0x22C55E; }
                else if (isColorClose(sensorDetectedColor, CANONICAL_COLOR_MAP['yellow'], 0.1) || Math.abs(deg - 270) < markerThreshold) { sensorDetectedColor = "yellow"; sensorIntensity = 80; sensorRawDecimalColor = 0xFFFF00; }
            }
        } else if (challengeId === 'c10') { 
            if (Math.abs(cx) <= 1.25 && cz <= 0 && cz >= -15) { sensorDetectedColor = "#64748b"; sensorIntensity = 40; sensorRawDecimalColor = 0x64748b; }
        } else if (challengeId === 'c18') {
            if (Math.abs(cx) <= 2.1 && cz <= -17.25 && cz >= -17.75) { sensorDetectedColor = "red"; sensorIntensity = 40; sensorRawDecimalColor = 0xFF0000; }
        } else if (challengeId === 'c15' || challengeId === 'c14') {
            if (Math.abs(cx) <= 1.5 && cz <= -9.5 && cz >= -12.5) { sensorDetectedColor = "blue"; sensorIntensity = 30; sensorRawDecimalColor = 0x0000FF; }
            else if (Math.abs(cx) <= 1.5 && cz <= -3.5 && cz >= -6.5) { sensorDetectedColor = "red"; sensorIntensity = 40; sensorRawDecimalColor = 0xFF0000; }
        }
    }

    const touchSensorPressed = checkTouchSensorHit(x, z, rotation, env.walls);
    const physicalHitForMovement = checkPhysicsHit(x + sin * 1.5, z + cos * 1.5, env.walls);
    let distance = 255; 
    for (let d = 0; d < 40.0; d += 0.2) { 
        if (checkPhysicsHit(x + sin * (1.7 + d), z + cos * (1.7 + d), env.walls)) { distance = Math.round(d * 10); break; } 
    }
    
    return { gyro, tilt, roll, y, isTouching: touchSensorPressed, physicalHit: physicalHitForMovement, distance, color: sensorDetectedColor, intensity: sensorIntensity, rawDecimalColor: sensorRawDecimalColor, sensorX: cx, sensorZ: cz };
};

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [editorTool, setEditorTool] = useState<EditorTool>('NONE');
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [robotState, setRobotState] = useState<RobotState>({ x: 0, y: 0, z: 0, rotation: 180, tilt: 0, roll: 0, speed: 100, motorLeftSpeed: 0, motorRightSpeed: 0, ledLeftColor: 'black', ledRightColor: 'black', isMoving: false, isTouching: false, penDown: false, penColor: '#000000' });
  const robotRef = useRef<RobotState>(robotState);
  const isPlacingRobot = useRef(false);
  const controlsRef = useRef<any>(null);

  // --- FIXED Pointer Handlers ---
  const handlePointerDown = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return; // Prevent interference with color picker
    e.stopPropagation(); 
    if (editorTool === 'ROBOT_MOVE') {
      isPlacingRobot.current = true;
      const point = e.point;
      const sd = calculateSensorReadings(point.x, point.z, robotRef.current.rotation, activeChallenge?.id, customObjects);
      const next = { ...robotRef.current, x: point.x, z: point.z, y: sd.y, tilt: sd.tilt, roll: sd.roll };
      robotRef.current = next;
      setRobotState(next);
    }
  }, [editorTool, activeChallenge, customObjects, isColorPickerActive]);

  const handlePointerMove = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return; 
    e.stopPropagation(); 
    if (isPlacingRobot.current && editorTool === 'ROBOT_MOVE') {
      const point = e.point;
      const sd = calculateSensorReadings(point.x, point.z, robotRef.current.rotation, activeChallenge?.id, customObjects);
      const next = { ...robotRef.current, x: point.x, z: point.z, y: sd.y, tilt: sd.tilt, roll: sd.roll };
      robotRef.current = next;
      setRobotState(next);
    }
  }, [editorTool, activeChallenge, customObjects, isColorPickerActive]);

  const handlePointerUp = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return;
    e.stopPropagation(); 
    isPlacingRobot.current = false;
  }, [isColorPickerActive]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden" 
         style={{ cursor: isColorPickerActive ? DROPPER_CURSOR_URL : 'default' }}>
      
      {/* UI Top Bar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         <button 
           onClick={() => setIsColorPickerActive(!isColorPickerActive)}
           className={`p-2 rounded flex items-center gap-2 transition-colors ${isColorPickerActive ? 'bg-pink-600' : 'bg-slate-700 hover:bg-slate-600'}`}
         >
           <Bot size={20} />
           {isColorPickerActive ? 'דוגם פעיל' : 'דגום צבע'}
         </button>
      </div>

      <div className="flex-1 relative border-b border-slate-700">
        <Canvas 
          shadows 
          camera={{ position: [10, 10, 10], fov: 50 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} castShadow />
          
          <SimulationEnvironment 
            challengeId={activeChallenge?.id} 
            customObjects={customObjects} 
          />
          
          <Robot3D state={robotState} />

          {/* New Color Picker Integration */}
          <ColorPickerTool 
            isActive={isColorPickerActive} 
            onColorSelect={(hex) => {
              console.log("Selected Color:", hex);
              setIsColorPickerActive(false);
            }} 
          />

          <OrbitControls 
            ref={controlsRef}
            makeDefault 
            enabled={!isPlacingRobot.current && !isColorPickerActive} 
          />
        </Canvas>
      </div>

      <div className="h-1/2">
        <BlocklyEditor 
          ref={null} 
          onCodeChange={() => {}} 
        />
      </div>
    </div>
  );
};

export default App;
