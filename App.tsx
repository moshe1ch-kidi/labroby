
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
import ColorPickerTool from './components/ColorPickerTool';
import CameraManager from './components/CameraManager';
import { CHALLENGES, Challenge } from './data/challenges';

const TICK_RATE = 16; 
const BASE_VELOCITY = 0.165; 
const BASE_TURN_SPEED = 3.9; 
const TURN_TOLERANCE = 0.5; 

const DROPPER_CURSOR_URL = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwNC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlYzQ4OTkiIHN0cm9rZS13aWR0aD0iMiIgc3RyY2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtdW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMC41NCA4LjQ2YTUgNSAwIDEgMC03LjA3IDcuMDdsMS40MSAxLjQxYTIgMiAwIDAgMCAyLjgzIDBsMi44My0yLjgzYTIgMiAwIDAgMCAwLTIuODNsLTEuNDEtMS40MXoiLz48cGF0aCBkPSJNOSAxOWw1LTUgbS03LTlsNS01Ii8+PHBhdGggZD0iTTkuNSAxNC41TDUgMTAiLz48cGF0aCBkPSJNMTggNmwzLTMiLz48cGF0aCBkPSJNMjAuOSA3LjFhMiAyIDAgMSAwLTIuOC0yLjhsLTEuNCAxLjQgMi44IDIuOCAxLjQtMS40eiIvPjwvc3ZnPg==') 0 24, crosshair`;

const CANONICAL_COLOR_MAP: Record<string, string> = {
    'red': '#EF4444', 'green': '#22C55E', 'blue': '#3B82F6', 'yellow': '#EAB308',
    'orange': '#F97316', 'purple': '#A855F7', 'cyan': '#06B6D4', 'magenta': '#EC4899',
    'black': '#000000', 'white': '#FFFFFF',
};

const normalizeAngle = (angle: number) => (angle % 360 + 360) % 360;
const getAngleDifference = (angle1: number, angle2: number) => {
    let diff = normalizeAngle(angle1 - angle2);
    if (diff > 180) diff -= 360;
    return diff;
};

const isColorClose = (hex1: string, hex2: string, threshold = 0.2) => {
    try {
        if (!hex1 || !hex2) return false;
        const h1 = hex1.toLowerCase();
        const h2 = hex2.toLowerCase();
        if (h1 === h2) return true;
        const finalH1 = CANONICAL_COLOR_MAP[h1] || (h1.startsWith('#') ? h1 : '#' + h1);
        const finalH2 = CANONICAL_COLOR_MAP[h2] || (h2.startsWith('#') ? h2 : '#' + h2);
        const c1 = new THREE.Color(finalH1);
        const c2 = new THREE.Color(finalH2);
        return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2)) < threshold;
    } catch { return false; }
};

const getLocalCoords = (px: number, pz: number, objX: number, objZ: number, rotation: number) => {
    const dx = px - objX; const dz = pz - objZ;
    const cos = Math.cos(-rotation); const sin = Math.sin(-rotation);
    return { lx: dx * cos - dz * sin, lz: dx * sin + dz * cos };
};

const getEnvironmentConfig = (challengeId?: string, customObjects: CustomObject[] = []) => {
    let walls: {minX: number, maxX: number, minZ: number, maxZ: number}[] = [];
    let complexZones: {x: number, z: number, width: number, length: number, rotation: number, color: number, shape?: PathShape, type: EditorTool}[] = [];
    if (['c10', 'c16', 'c19', 'c20'].includes(challengeId || '')) walls.push({ minX: -3, maxX: 3, minZ: -10.25, maxZ: -9.75 });
    customObjects.forEach(obj => {
        if (obj.type === 'WALL') { const hW = obj.width / 2; const hL = obj.length / 2; walls.push({ minX: obj.x - hW, maxX: obj.x + hW, minZ: obj.z - hL, maxZ: obj.z + hL }); }
        else if (obj.type === 'PATH') { const lineHex = obj.color || '#FFFF00'; const colorVal = parseInt(lineHex.replace('#', '0x'), 16); complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: colorVal, shape: obj.shape || 'STRAIGHT', type: obj.type }); } 
        else if (obj.type === 'COLOR_LINE') { const hC = obj.color || '#FF0000'; complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: parseInt(hC.replace('#', '0x'), 16), type: obj.type }); }
        else if (obj.type === 'RAMP') {
          const rampHex = obj.color || '#334155';
          complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: parseInt(rampHex.replace('#', '0x'), 16), type: obj.type });
        }
    });
    return { walls, complexZones };
};

const getSurfaceHeightAt = (qx: number, qz: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    let maxHeight = 0;
    for (const obj of customObjects) {
        if (obj.type === 'RAMP') {
            const { lx, lz } = getLocalCoords(qx, qz, obj.x, obj.z, obj.rotation || 0);
            const hW = obj.width / 2; const hL = obj.length / 2; const h = obj.height || 1.0; 
            if (Math.abs(lx) <= hW && Math.abs(lz) <= hL) {
                const section = obj.length / 3; const uphillEnd = -hL + section; const downhillStart = hL - section;
                let currentY = lz < uphillEnd ? ((lz - (-hL)) / section) * h : lz < downhillStart ? h : h - (((lz - downhillStart) / section) * h);
                maxHeight = Math.max(maxHeight, currentY);
            }
        }
    }
    if (challengeId === 'c18' && qx >= -2.1 && qx <= 2.1) {
        if (qz < -0.2 && qz > -3.7) maxHeight = Math.max(maxHeight, ((qz - (-0.2)) / -3.5) * 1.73);
        else if (qz <= -3.7 && qz >= -7.4) maxHeight = Math.max(maxHeight, 1.73);
        else if (qz < -7.4 && qz > -10.9) maxHeight = Math.max(maxHeight, 1.73 - (((qz - (-7.4)) / -3.5) * 1.73));
    }
    return maxHeight;
};

const calculateSensorReadings = (x: number, z: number, rotation: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    const rad = (rotation * Math.PI) / 180; const sin = Math.sin(rad); const cos = Math.cos(rad);
    const env = getEnvironmentConfig(challengeId, customObjects);
    const gyro = Math.round(normalizeAngle(rotation));
    const hLeft = getSurfaceHeightAt(x + (-0.95 * Math.cos(rad) + 0.5 * Math.sin(rad)), z + (0.95 * Math.sin(rad) + 0.5 * Math.cos(rad)), challengeId, customObjects);
    const hRight = getSurfaceHeightAt(x + (0.95 * Math.cos(rad) + 0.5 * Math.sin(rad)), z + (-0.95 * Math.sin(rad) + 0.5 * Math.cos(rad)), challengeId, customObjects);
    const hBack = getSurfaceHeightAt(x + (-0.8 * Math.sin(rad)), z + (-0.8 * Math.cos(rad)), challengeId, customObjects);
    const y = (hLeft + hRight + hBack) / 3; 
    const tilt = Math.atan2(((hLeft + hRight) / 2) - hBack, 1.3) * (180 / Math.PI);
    const roll = Math.atan2(hLeft - hRight, 1.9) * (180 / Math.PI);
    const cx = x + sin * 0.9; const cz = z + cos * 0.9;
    let sensorDetectedColor = "white"; let sensorRawDecimalColor = 0xFFFFFF;
    for (const zZone of env.complexZones) {
        const { lx, lz } = getLocalCoords(cx, cz, zZone.x, zZone.z, zZone.rotation);
        let onZone = false;
        if (zZone.type === 'RAMP') onZone = Math.abs(lx) <= zZone.width/2 + 0.1 && Math.abs(lz) <= zZone.length/2 + 0.1;
        else if (!zZone.shape || zZone.shape === 'STRAIGHT') onZone = Math.abs(lx) <= zZone.width/2 + 0.1 && Math.abs(lz) <= zZone.length/2 + 0.1;
        else if (zZone.shape === 'CORNER') onZone = (Math.abs(lx) <= zZone.width/2 + 0.1 && lz >= -0.1 && lz <= zZone.width/2 + 0.1) || (Math.abs(lz) <= zZone.width/2 + 0.1 && lx >= -0.1 && lx <= zZone.width/2 + 0.1);
        else if (zZone.shape === 'CURVED') {
            const r = zZone.length / 2; const dx = lx + r; const d = Math.sqrt(dx*dx + lz*lz); const a = Math.atan2(lz, dx);
            onZone = Math.abs(d - r) <= zZone.width/2 + 0.1 && a >= -0.1 && a <= Math.PI/2 + 0.1;
        }
        if (onZone) {
            sensorRawDecimalColor = zZone.color; const hex = "#" + sensorRawDecimalColor.toString(16).padStart(6, '0').toUpperCase();
            sensorDetectedColor = Object.keys(CANONICAL_COLOR_MAP).find(k => isColorClose(hex, CANONICAL_COLOR_MAP[k])) || hex;
            break;
        }
    }
    const touchTipX = x + sin * 1.7; const touchTipZ = z + cos * 1.7;
    const isTouching = env.walls.some(w => touchTipX >= w.minX && touchTipX <= w.maxX && touchTipZ >= w.minZ && touchTipZ <= w.maxZ);
    let distance = 255;
    for (let d = 0; d < 40; d += 0.2) {
        const px = x + sin * (1.7 + d); const pz = z + cos * (1.7 + d);
        if (env.walls.some(w => px >= w.minX && px <= w.maxX && pz >= w.minZ && pz <= w.maxZ)) { distance = Math.round(d * 10); break; }
    }
    return { gyro, tilt, roll, y, isTouching, distance, color: sensorDetectedColor, rawDecimalColor: sensorRawDecimalColor, sensorX: cx, sensorZ: cz };
};

const App: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState('');
  const [startBlockCount, setStartBlockCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [cameraMode, setCameraMode] = useState<CameraMode>('HOME');
  const [editorTool, setEditorTool] = useState<EditorTool>('NONE');
  const [pickerHoverColor, setPickerHoverColor] = useState<string | null>(null);
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null); 
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [projectModal, setProjectModal] = useState<{isOpen: boolean, mode: 'save' | 'load'}>({isOpen: false, mode: 'save'});
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [visibleVariables, setVisibleVariables] = useState<Set<string>>(new Set());
  const blocklyEditorRef = useRef<BlocklyEditorHandle>(null);
  const controlsRef = useRef<any>(null);
  const pickableGroupRef = useRef<THREE.Group>(null); 
  const historyRef = useRef<SimulationHistory>({ maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 });
  const executionId = useRef(0);
  const pathCounter = useRef(0);
  const lastDrawingPos = useRef<[number, number, number] | null>(null);
  const [numpadConfig, setNumpadConfig] = useState({ isOpen: false, value: 0, onConfirm: (val: number) => {} });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [activeDrawing, setActiveDrawing] = useState<ContinuousDrawing | null>(null);
  const [completedDrawings, setCompletedDrawings] = useState<ContinuousDrawing[]>([]);
  const activeDrawingRef = useRef<ContinuousDrawing | null>(null);
  const robotRef = useRef<RobotState>({ x: 0, y: 0, z: 0, rotation: 180, tilt: 0, roll: 0, speed: 100, motorLeftSpeed: 0, motorRightSpeed: 0, ledLeftColor: 'black', ledRightColor: 'black', isMoving: false, isTouching: false, penDown: false, penColor: '#000000' });
  const [robotState, setRobotState] = useState<RobotState>(robotRef.current);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listenersRef = useRef<{ messages: Record<string, (() => Promise<void>)[]>, colors: { color: string, cb: () => Promise<void>, lastMatch: boolean }[], obstacles: { cb: () => Promise<void>, lastMatch: boolean }[], distances: { threshold: number, cb: () => Promise<void>, lastMatch: boolean }[], variables: Record<string, any> }>({ messages: {}, colors: [], obstacles: [], distances: [], variables: {} });
  const [blocklyColorPickCallback, setBlocklyColorPickCallback] = useState<((newColor: string) => void) | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); }, []);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    executionId.current++; 
    const envObjs = activeChallenge?.environmentObjects || [];
    setCustomObjects(envObjs);
    const startX = activeChallenge?.startPosition?.x ?? 0; const startZ = activeChallenge?.startPosition?.z ?? 0; const startRot = activeChallenge?.startRotation ?? 180;
    const sd = calculateSensorReadings(startX, startZ, startRot, activeChallenge?.id, envObjs); 
    const d = { ...robotRef.current, x: startX, y: sd.y, z: startZ, rotation: startRot, motorLeftSpeed: 0, motorRightSpeed: 0, ledLeftColor: 'black', ledRightColor: 'black', tilt: sd.tilt, roll: sd.roll, penDown: false, isTouching: false };
    robotRef.current = d; setRobotState(d); setIsRunning(false); setChallengeSuccess(false); setCompletedDrawings([]); setActiveDrawing(null); activeDrawingRef.current = null;
    lastDrawingPos.current = null;
    historyRef.current = { maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 }; 
    listenersRef.current = { messages: {}, colors: [], obstacles: [], distances: [], variables: {} };
    if (controlsRef.current) { controlsRef.current.reset(); setCameraMode('HOME'); }
  }, [activeChallenge]);

  useEffect(() => { handleReset(); }, [activeChallenge, handleReset]);

  const handleRun = useCallback(async () => {
    if (isRunning) return; 
    setIsRunning(true); setChallengeSuccess(false); 
    const currentRunId = ++executionId.current; 
    const controller = new AbortController(); abortControllerRef.current = controller;
    const robotApi = {
      move: async (dist: number) => {
        const startX = robotRef.current.x; const startZ = robotRef.current.z; const targetDist = Math.abs(dist) * 0.1; const power = 100 * (dist > 0 ? 1 : -1);
        robotRef.current = { ...robotRef.current, motorLeftSpeed: power, motorRightSpeed: power };
        while (Math.sqrt(Math.pow(robotRef.current.x - startX, 2) + Math.pow(robotRef.current.z - startZ, 2)) < targetDist) {
          if (controller.signal.aborted) throw new Error("Simulation aborted");
          await new Promise(r => setTimeout(r, TICK_RATE));
          if (calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).isTouching) break;
        }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 };
      },
      turn: async (angle: number) => {
        const target = normalizeAngle(robotRef.current.rotation + angle); const dir = angle > 0 ? 1 : -1;
        robotRef.current = { ...robotRef.current, motorLeftSpeed: -50 * dir, motorRightSpeed: 50 * dir };
        while (Math.abs(getAngleDifference(target, robotRef.current.rotation)) > TURN_TOLERANCE) {
          if (controller.signal.aborted) throw new Error("Simulation aborted");
          await new Promise(r => setTimeout(r, TICK_RATE));
        }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0, rotation: target };
        setRobotState({ ...robotRef.current });
      },
      setHeading: async (a: number) => { await robotApi.turn(getAngleDifference(normalizeAngle(a), normalizeAngle(robotRef.current.rotation))); },
      wait: (ms: number) => new Promise((resolve, reject) => { const t = setTimeout(resolve, ms); controller.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error("Simulation aborted")); }, { once: true }); }),
      setMotorPower: async (l: number, r: number) => { robotRef.current = { ...robotRef.current, motorLeftSpeed: l, motorRightSpeed: r }; },
      setSpeed: async (s: number) => { robotRef.current.speed = s; },
      stop: async () => { robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 }; },
      setPen: async (down: boolean) => { 
        robotRef.current.penDown = down; setRobotState(prev => ({ ...prev, penDown: down }));
        if (!down && activeDrawingRef.current) {
            if (activeDrawingRef.current.points.length > 1) setCompletedDrawings(prev => [...prev, activeDrawingRef.current!]);
            setActiveDrawing(null); activeDrawingRef.current = null;
            lastDrawingPos.current = null;
        }
      },
      setPenColor: async (c: string) => { robotRef.current.penColor = c; setRobotState(prev => ({ ...prev, penColor: c })); },
      clearPen: async () => { setCompletedDrawings([]); setActiveDrawing(null); activeDrawingRef.current = null; lastDrawingPos.current = null; },
      getDistance: async () => calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).distance,
      getTouch: async () => calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).isTouching,
      getGyro: async (m: 'ANGLE'|'TILT') => { const sd = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects); return m === 'TILT' ? sd.tilt : sd.gyro; },
      getColor: async () => calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).color,
      isTouchingColor: async (h: string) => isColorClose(calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).color, h),
      setLed: (s: any, c: string) => { if (s === 'left' || s === 'both') robotRef.current.ledLeftColor = c; if (s === 'right' || s === 'both') robotRef.current.ledRightColor = c; setRobotState({ ...robotRef.current }); },
      onMessage: (m: string, cb: any) => { if (!listenersRef.current.messages[m]) listenersRef.current.messages[m] = []; listenersRef.current.messages[m].push(cb); },
      sendMessage: async (m: string) => { if (listenersRef.current.messages[m]) await Promise.all(listenersRef.current.messages[m].map(cb => cb())); },
      onColor: (c: string, cb: any) => { listenersRef.current.colors.push({ color: c, cb, lastMatch: false }); },
      onObstacle: (cb: any) => { listenersRef.current.obstacles.push({ cb, lastMatch: false }); },
      onDistance: (t: number, cb: any) => { listenersRef.current.distances.push({ threshold: t, cb, lastMatch: false }); },
      updateVariable: (n: string, v: any) => {},
      stopProgram: async () => { controller.abort(); setIsRunning(false); }
    };
    try { await new (Object.getPrototypeOf(async function(){}).constructor)('robot', generatedCode)(robotApi); } 
    catch (e: any) { if (e.message !== "Simulation aborted") { console.error(e); setIsRunning(false); } }
  }, [isRunning, generatedCode, activeChallenge, customObjects]);

  useEffect(() => {
    let interval: any; 
    if (isRunning) { 
      interval = setInterval(() => { 
        const current = robotRef.current; const f = current.speed / 100.0; const pL = current.motorLeftSpeed / 100.0; const pR = current.motorRightSpeed / 100.0;
        let fV = ((pL + pR) / 2.0) * BASE_VELOCITY * f; const rV = (pR - pL) * BASE_TURN_SPEED * f;
        const sd_tilt = calculateSensorReadings(current.x, current.z, current.rotation, activeChallenge?.id, customObjects);
        if (Math.abs(sd_tilt.tilt) > 3 && ((fV > 0 && sd_tilt.tilt > 0) || (fV < 0 && sd_tilt.tilt < 0))) fV *= Math.max(0.2, 1 - (Math.min(Math.abs(sd_tilt.tilt) / 25, 1)) * 0.8);
        const nr = current.rotation + rV; const nx = current.x + Math.sin(nr * Math.PI / 180) * fV; const nz = current.z + Math.cos(nr * Math.PI / 180) * fV; 
        const sd = calculateSensorReadings(nx, nz, nr, activeChallenge?.id, customObjects);
        const next = { ...current, x: sd.isTouching ? current.x : nx, z: sd.isTouching ? current.z : nz, y: current.y + (sd.y - current.y) * 0.3, tilt: current.tilt + (sd.tilt - current.tilt) * 0.3, roll: current.roll + (sd.roll - current.roll) * 0.3, rotation: nr, isTouching: sd.isTouching, isMoving: Math.abs(fV) > 0.001 || Math.abs(rV) > 0.001, sensorX: sd.sensorX, sensorZ: sd.sensorZ }; 
        robotRef.current = next; setRobotState(next); 
        listenersRef.current.colors.forEach(l => { const m = isColorClose(sd.color, l.color); if (m && !l.lastMatch) l.cb(); l.lastMatch = m; });
        listenersRef.current.obstacles.forEach(l => { if (sd.isTouching && !l.lastMatch) l.cb(); l.lastMatch = sd.isTouching; });
        listenersRef.current.distances.forEach(l => { const m = sd.distance < l.threshold; if (m && !l.lastMatch) l.cb(); l.lastMatch = m; });
        if (sd.isTouching) historyRef.current.touchedWall = true; 
        const dMoved = Math.sqrt(Math.pow(next.x - (activeChallenge?.startPosition?.x || 0), 2) + Math.pow(next.z - (activeChallenge?.startPosition?.z || 0), 2));
        historyRef.current.maxDistanceMoved = Math.max(historyRef.current.maxDistanceMoved, dMoved * 10);
        if (!historyRef.current.detectedColors.includes(sd.color)) historyRef.current.detectedColors.push(sd.color);
        historyRef.current.totalRotation = robotRef.current.rotation - (activeChallenge?.startRotation ?? 180);
        
        if (next.penDown && !isNaN(next.x) && !isNaN(next.y) && !isNaN(next.z)) { 
          const currPos: [number, number, number] = [next.x, next.y + 0.02, next.z]; 
          
          // Optimization: only update the drawing if the robot has moved enough (0.05 units)
          const hasMovedEnough = !lastDrawingPos.current || 
              Math.pow(currPos[0]-lastDrawingPos.current[0], 2) + 
              Math.pow(currPos[2]-lastDrawingPos.current[2], 2) > 0.0025; // 0.05 squared

          if (hasMovedEnough) {
              lastDrawingPos.current = currPos;
              setActiveDrawing(prev => {
                  if (!prev || prev.color !== next.penColor) {
                      if (prev && prev.points.length > 1) setCompletedDrawings(old => [...old, prev]);
                      const d = { id: `path-${pathCounter.current++}`, points: [currPos], color: next.penColor };
                      activeDrawingRef.current = d; return d;
                  } else {
                      const d = { ...prev, points: [...prev.points, currPos] };
                      activeDrawingRef.current = d; return d;
                  }
              });
          }
        } else if (activeDrawingRef.current) {
            if (activeDrawingRef.current.points.length > 1) setCompletedDrawings(old => [...old, activeDrawingRef.current!]);
            setActiveDrawing(null); activeDrawingRef.current = null;
            lastDrawingPos.current = null;
        }
        if (activeChallenge && activeChallenge.check(robotRef.current, robotRef.current, historyRef.current) && !challengeSuccess) { setChallengeSuccess(true); showToast("Mission Accomplished!", "success"); } 
      }, TICK_RATE); 
    } 
    return () => {
      clearInterval(interval);
      if (activeDrawingRef.current && activeDrawingRef.current.points.length > 1) setCompletedDrawings(old => [...old, activeDrawingRef.current!]);
      setActiveDrawing(null); activeDrawingRef.current = null;
    };
  }, [isRunning, customObjects, activeChallenge, challengeSuccess, showToast]);

  const sensorReadings = useMemo(() => calculateSensorReadings(robotState.x, robotState.z, robotState.rotation, activeChallenge?.id, customObjects), [robotState.x, robotState.z, robotState.rotation, activeChallenge, customObjects]);
  const orbitProps = useMemo(() => {
    let p: any = { enablePan: true, enableRotate: true, minPolarAngle: 0, maxPolarAngle: Math.PI, minDistance: 1.2, maxDistance: 60 };
    if (editorTool === 'PAN') p.enableRotate = false;
    else if (editorTool === 'ROBOT_MOVE') { p.enablePan = false; p.enableRotate = false; }
    if (isColorPickerActive) { p.enablePan = false; p.enableRotate = false; p.enableZoom = false; }
    if (cameraMode === 'TOP') { p.enableRotate = false; p.minPolarAngle = 0; p.maxPolarAngle = 0; }
    else if (cameraMode === 'FOLLOW') { p.enableRotate = false; p.enablePan = false; p.minPolarAngle = Math.PI/6; p.maxPolarAngle = Math.PI/2 - 0.1; }
    return p;
  }, [editorTool, cameraMode, isColorPickerActive]);

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
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner"><Code2 className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-bold hidden sm:block tracking-tight text-slate-100">Virtual Robotics Lab</h1>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <button onClick={handleRun} disabled={isRunning || startBlockCount === 0} className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${isRunning || startBlockCount === 0 ? 'bg-slate-700/50 text-slate-600' : 'bg-green-600 text-white hover:bg-green-500'}`} title="Run"><Flag size={20} fill={isRunning ? "none" : "currentColor"} /></button>
          <button onClick={handleReset} className="flex items-center justify-center w-11 h-11 bg-red-600 hover:bg-red-50 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-md" title="Reset"><RotateCcw size={22} strokeWidth={2.5} /></button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={() => setIsRulerActive(!isRulerActive)} className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${isRulerActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`} title="Ruler"><Ruler size={20} /></button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={() => setProjectModal({ isOpen: true, mode: 'save' })} className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 rounded-xl" title="Save"><Save size={20} /></button>
          <button onClick={() => setProjectModal({ isOpen: true, mode: 'load' })} className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 rounded-xl" title="Load"><FolderOpen size={20} /></button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={() => setIsPythonModalOpen(true)} className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 rounded-xl" title="Python"><Terminal size={20} /></button>
        </div>
        <button onClick={() => setShowChallenges(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${activeChallenge ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-slate-300'}`}><Trophy size={16} /> {activeChallenge ? activeChallenge.title : "Challenges"}</button>
      </header>
      <main className="flex flex-1 overflow-hidden relative">
        <div className="w-1/2 relative flex flex-col bg-white border-r border-slate-200">
          <BlocklyEditor onCodeChange={useCallback((c, n) => { setGeneratedCode(c); setStartBlockCount(n); }, [])} visibleVariables={visibleVariables} onToggleVariable={useCallback((n) => setVisibleVariables(v => { const next = new Set(v); if (next.has(n)) next.delete(n); else next.add(n); return next; }), [])} onShowNumpad={useCallback((v, c) => setNumpadConfig({isOpen:true, value:parseFloat(String(v)), onConfirm:c}), [])} onShowColorPicker={useCallback((p) => {setIsColorPickerActive(true); setBlocklyColorPickCallback(() => p);}, [])} />
        </div>
        <div className="w-1/2 relative bg-slate-900 overflow-hidden" style={{ cursor: isColorPickerActive ? DROPPER_CURSOR_URL : 'auto' }}>
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-3">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-1 flex flex-col overflow-hidden">
              <button onClick={() => setCameraMode('HOME')} className="p-3 text-blue-600 hover:bg-slate-50 transition-all rounded-xl"><Home size={22} /></button>
              <button onClick={() => setCameraMode(p => p === 'TOP' ? 'HOME' : 'TOP')} className={`p-3 transition-all rounded-xl ${cameraMode === 'TOP' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Eye size={22} /></button>
              <button onClick={() => setCameraMode(p => p === 'FOLLOW' ? 'HOME' : 'FOLLOW')} className={`p-3 transition-all rounded-xl ${cameraMode === 'FOLLOW' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Target size={22} /></button>
              <div className="h-px bg-slate-100 mx-2 my-0.5" />
              <button onClick={() => setEditorTool(p => p === 'PAN' ? 'NONE' : 'PAN')} className={`p-3 transition-all rounded-xl ${editorTool === 'PAN' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Hand size={22} /></button>
              <button onClick={() => setEditorTool('NONE')} className={`p-3 transition-all rounded-xl ${editorTool === 'NONE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Move size={22} /></button>
              <button onClick={() => setEditorTool(p => p === 'ROBOT_MOVE' ? 'NONE' : 'ROBOT_MOVE')} className={`p-3 transition-all rounded-xl ${editorTool === 'ROBOT_MOVE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}><Bot size={22} /></button>
            </div>
          </div>
          <SensorDashboard distance={sensorReadings.distance} isTouching={sensorReadings.isTouching} gyroAngle={sensorReadings.gyro} tiltAngle={sensorReadings.tilt} detectedColor={sensorReadings.color} overrideColor={isColorPickerActive ? pickerHoverColor : null} onColorClick={() => setIsColorPickerActive(!isColorPickerActive)} />
          <Canvas shadows camera={{ position: [10, 10, 10], fov: 45 }}>
            <SimulationEnvironment pickableRef={pickableGroupRef} challengeId={activeChallenge?.id} customObjects={customObjects} robotState={robotState} onPointerDown={(e) => { if (!isColorPickerActive && editorTool === 'ROBOT_MOVE') { const p = e.point; const sd = calculateSensorReadings(p.x, p.z, robotRef.current.rotation, activeChallenge?.id, customObjects); robotRef.current = { ...robotRef.current, x: p.x, z: p.z, y: sd.y, tilt: sd.tilt, roll: sd.roll }; setRobotState(robotRef.current); } }} />
            {completedDrawings.map((p) => (
                <Line key={p.id} points={p.points} color={p.color} lineWidth={4} raycast={() => null} layers={0} />
            ))}
            {activeDrawing && activeDrawing.points.length > 1 && (
                <Line key={activeDrawing.id} points={activeDrawing.points} color={activeDrawing.color} lineWidth={4} raycast={() => null} layers={0} />
            )}
            <Robot3D state={robotState} isPlacementMode={editorTool === 'ROBOT_MOVE'} />
            <OrbitControls ref={controlsRef} makeDefault {...orbitProps} />
            <CameraManager robotState={robotState} cameraMode={cameraMode} controlsRef={controlsRef} />
            {isRulerActive && <RulerTool />}
            {isColorPickerActive && <ColorPickerTool envGroupRef={pickableGroupRef} onColorHover={setPickerHoverColor} onColorSelect={(h) => { if (blocklyColorPickCallback) blocklyColorPickCallback(h); setIsColorPickerActive(false); setPickerHoverColor(null); setBlocklyColorPickCallback(null); }} />}
          </Canvas>
        </div>
      </main>
      {isPythonModalOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-700">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3"><FileCode className="text-blue-400" /> Python Code Output</h2>
              <button onClick={() => setIsPythonModalOpen(false)} className="p-2 text-slate-500"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 font-mono text-sm text-blue-300 whitespace-pre-wrap">{blocklyEditorRef.current?.getPythonCode()}</div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => { const c = blocklyEditorRef.current?.getPythonCode(); if (c) navigator.clipboard.writeText(c); showToast("Copied!", "success"); }} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Copy Code</button>
            </div>
          </div>
        </div>
      )}
      {projectModal.isOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 border-2">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{projectModal.mode === 'save' ? 'Save' : 'Load'} Project</h2><button onClick={() => setProjectModal({...projectModal, isOpen: false})}><X /></button></div>
            {projectModal.mode === 'save' ? (
                <button onClick={() => { const x = blocklyEditorRef.current?.saveWorkspace(); if (x) { const b = new Blob([x], {type: 'text/xml'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'robot.roby'; a.click(); showToast("Saved!", "success"); } setProjectModal({...projectModal, isOpen: false}); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Download (.roby)</button>
            ) : (
                <input type="file" accept=".roby,.xml" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (re) => { blocklyEditorRef.current?.loadWorkspace(re.target?.result as string); showToast("Loaded!", "success"); setProjectModal({...projectModal, isOpen: false}); }; r.readAsText(f); } }} />
            )}
          </div>
        </div>
      )}
      <Numpad isOpen={numpadConfig.isOpen} initialValue={numpadConfig.value} onConfirm={numpadConfig.onConfirm} onClose={() => setNumpadConfig(p => ({ ...p, isOpen: false }))} />
      {showChallenges && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Trophy className="text-yellow-500" /> Challenges</h2><button onClick={() => setShowChallenges(false)} className="p-2 text-slate-400"><X size={28} /></button></div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={() => { setActiveChallenge(null); setShowChallenges(false); }} className={`p-5 rounded-3xl border-4 text-left transition-all ${activeChallenge === null ? 'border-blue-500 bg-white' : 'border-white bg-white shadow-md'}`}><h3 className={`font-bold text-lg ${activeChallenge === null ? 'text-blue-600' : 'text-slate-800'}`}>Free Drive</h3><p className="text-sm text-slate-500">Open playground.</p></button>
                {CHALLENGES.map(c => (
                  <button key={c.id} onClick={() => { setActiveChallenge(c); setShowChallenges(false); }} className={`p-5 rounded-3xl border-4 text-left transition-all ${activeChallenge?.id === c.id ? 'border-yellow-500 bg-white' : 'border-white bg-white shadow-md'}`}><h3 className={`font-bold text-lg ${activeChallenge?.id === c.id ? 'text-yellow-600' : 'text-slate-800'}`}>{c.title}</h3><p className="text-sm text-slate-500 line-clamp-2">{c.description}</p></button>
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
