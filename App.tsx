import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { RotateCcw, Code2, Ruler, Trophy, X, Flag, Save, FolderOpen, Check, AlertCircle, Info, Terminal, Home, Eye, Move, Hand, Bot, Target, FileCode, ZoomIn, ZoomOut, Navigation, HelpCircle } from 'lucide-react';
import * as THREE from 'three';
import BlocklyEditor, { BlocklyEditorHandle } from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState, CustomObject, ContinuousDrawing, SimulationHistory, CameraMode, EditorTool, PathShape } from './types';
import Numpad from './components/Numpad';
import SensorDashboard from './components/SensorDashboard';
import RulerTool from './components/RulerTool';
import CameraManager from './components/CameraManager';
import HelpCenter from './components/HelpCenter.tsx';
import AngleChart from './components/AngleChart';
import { CHALLENGES, Challenge } from './data/challenges';
import { ThreeEvent } from '@react-three/fiber';

const TICK_RATE = 16; 
const BASE_VELOCITY = 0.165;
const BASE_TURN_SPEED = 3.9;
const TURN_TOLERANCE = 0.5;

type PlainDOMRect = { top: number, bottom: number, left: number, right: number, width: number, height: number };

const CANONICAL_COLOR_MAP: Record<string, string> = {
    'red': '#EF4444',
    'green': '#22C55E',
    'blue': '#3B82F6',
    'yellow': '#EAB308',
    'orange': '#F97316',
    'purple': '#A855F7',
    'cyan': '#06B6D4',
    'magenta': '#EC4899',
    'black': '#000000',
    'white': '#FFFFFF',
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
        return Math.sqrt((c1.r - c2.r)**2 + (c1.g - c2.g)**2 + (c1.b - c2.b)**2) < threshold;
    } catch { return false; }
};

const getLocalCoords = (px: number, pz: number, objX: number, objZ: number, rotation: number) => {
    const dx = px - objX;
    const dz = pz - objZ;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
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
        else if (obj.type === 'RAMP') { complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: parseInt((obj.color || '#334155').replace('#', '0x'), 16), type: obj.type }); }
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
                const section = obj.length / 3; 
                const uphillEnd = -hL + section; 
                const downhillStart = hL - section;
                let currentY = 0;
                if (lz < uphillEnd) currentY = ((lz - (-hL)) / section) * h;
                else if (lz < downhillStart) currentY = h;
                else currentY = h - (((lz - downhillStart) / section) * h);
                maxHeight = Math.max(maxHeight, currentY);
            }
        }
    }
    return maxHeight;
};

interface SvgConfig { width: number; height: number; pixelData: Uint8ClampedArray; worldWidth: number; worldHeight: number; }

const calculateSensorReadings = (x: number, z: number, rotation: number, challengeId?: string, customObjects: CustomObject[] = [], svgConfig?: SvgConfig) => {
    const rad = (rotation * Math.PI) / 180; 
    const sin = Math.sin(rad); 
    const cos = Math.cos(rad);
    const gyro = Math.round(normalizeAngle(rotation));
    
    const getPointWorldPos = (lx: number, lz: number) => ({ 
        wx: x + lx * cos + lz * sin, 
        wz: z + lx * sin - lz * cos 
    });

    const wheelOffsetX = 0.95; const wheelOffsetZ = 0.5; const casterOffsetZ = -0.8;
    const hLeft = getSurfaceHeightAt(getPointWorldPos(-wheelOffsetX, wheelOffsetZ).wx, getPointWorldPos(-wheelOffsetX, wheelOffsetZ).wz, challengeId, customObjects);
    const hRight = getSurfaceHeightAt(getPointWorldPos(wheelOffsetX, wheelOffsetZ).wx, getPointWorldPos(wheelOffsetX, wheelOffsetZ).wz, challengeId, customObjects);
    const hBack = getSurfaceHeightAt(getPointWorldPos(0, casterOffsetZ).wx, getPointWorldPos(0, casterOffsetZ).wz, challengeId, customObjects);
    
    const y = (hLeft + hRight + hBack) / 3; 
    const tilt = Math.atan2((hLeft + hRight) / 2 - hBack, 1.3) * (180 / Math.PI);
    const roll = Math.atan2(hLeft - hRight, wheelOffsetX * 2) * (180 / Math.PI);

    const cx = x + sin * 0.9; const cz = z - cos * 0.9;
    let color = "white"; let intensity = 100;

    if (svgConfig) {
        const halfW = svgConfig.worldWidth / 2; const halfH = svgConfig.worldHeight / 2;
        if (cx >= -halfW && cx <= halfW && cz >= -halfH && cz <= halfH) {
             const px = Math.floor(((cx + halfW) / svgConfig.worldWidth) * svgConfig.width);
             const py = Math.floor(((cz + halfH) / svgConfig.worldHeight) * svgConfig.height);
             const i = (py * svgConfig.width + px) * 4;
             if (i >= 0 && i < svgConfig.pixelData.length && svgConfig.pixelData[i+3] > 50) {
                 const hex = "#" + ((1 << 24) + (svgConfig.pixelData[i] << 16) + (svgConfig.pixelData[i+1] << 8) + svgConfig.pixelData[i+2]).toString(16).slice(1).toUpperCase();
                 color = hex;
                 for (const name in CANONICAL_COLOR_MAP) if (isColorClose(hex, CANONICAL_COLOR_MAP[name])) { color = name; break; }
             }
        }
    } else {
        const env = getEnvironmentConfig(challengeId, customObjects);
        for (const z of env.complexZones) {
            const dx = cx - z.x; const dz = cz - z.z;
            const cR = Math.cos(-z.rotation); const sR = Math.sin(-z.rotation);
            const lX = dx * cR - dz * sR; const lZ = dx * sR + dz * cR;
            if (Math.abs(lX) <= (z.width/2 + 0.1) && Math.abs(lZ) <= (z.length/2 + 0.1)) {
                color = "#" + z.color.toString(16).padStart(6, '0').toUpperCase();
                for (const name in CANONICAL_COLOR_MAP) if (isColorClose(color, CANONICAL_COLOR_MAP[name])) { color = name; break; }
                break;
            }
        }
    }

    const env = getEnvironmentConfig(challengeId, customObjects);
    const checkHit = (px: number, pz: number) => {
        for (const w of env.walls) if (px >= w.minX && px <= w.maxX && pz >= w.minZ && pz <= w.maxZ) return true;
        for (const obj of customObjects) if (obj.type === 'WALL') {
            const { lx, lz } = getLocalCoords(px, pz, obj.x, obj.z, obj.rotation || 0);
            if (Math.abs(lx) <= obj.width/2 && Math.abs(lz) <= obj.length/2) return true;
        }
        return false;
    };

    const physicalHit = checkHit(getPointWorldPos(0, 1.45).wx, getPointWorldPos(0, 1.45).wz);
    let dist = 255;
    for (let d = 0; d < 30.0; d += 0.1) {
        const ray = getPointWorldPos(0, 1.5 + d);
        if (checkHit(ray.wx, ray.wz)) { dist = Math.round(d * 10); break; }
    }
    return { gyro, tilt, roll, y, isTouching: physicalHit, physicalHit, distance: dist, color, intensity, sensorX: cx, sensorZ: cz };
};

const App: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [startBlockCount, setStartBlockCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [showAngleChart, setShowAngleChart] = useState(false);
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [cameraMode, setCameraMode] = useState<CameraMode>('HOME');
  const [editorTool, setEditorTool] = useState<EditorTool>('NONE');
  const [showChallenges, setShowChallenges] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null); 
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [projectModal, setProjectModal] = useState<{isOpen: boolean, mode: 'save' | 'load'}>({isOpen: false, mode: 'save'});
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [monitoredValues, setMonitoredValues] = useState<Record<string, any>>({});
  const [visibleVariables, setVisibleVariables] = useState<Set<string>>(new Set());
  const blocklyEditorRef = useRef<BlocklyEditorHandle>(null);
  const controlsRef = useRef<any>(null);
  const historyRef = useRef<SimulationHistory>({ maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 });
  const executionId = useRef(0);
  const [numpadConfig, setNumpadConfig] = useState<{isOpen: boolean, value: number, onConfirm: (val: number) => void, position: PlainDOMRect | null}>({ isOpen: false, value: 0, onConfirm: () => {}, position: null });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [svgConfig, setSvgConfig] = useState<SvgConfig | undefined>(undefined);
  const [completedDrawings, setCompletedDrawings] = useState<ContinuousDrawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<ContinuousDrawing | null>(null);
  const activeDrawingRef = useRef<ContinuousDrawing | null>(null);

  // Default rotation to 0 (North)
  const robotRef = useRef<RobotState>({ x: 0, y: 0, z: 0, rotation: 0, tilt: 0, roll: 0, speed: 100, motorLeftSpeed: 0, motorRightSpeed: 0, ledLeftColor: 'black', ledRightColor: 'black', isMoving: false, isTouching: false, penDown: false, penColor: '#000000' });
  const [robotState, setRobotState] = useState<RobotState>(robotRef.current);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listenersRef = useRef<{ messages: Record<string, (() => Promise<void>)[]>, colors: { color: string, cb: () => Promise<void>, lastMatch: boolean }[], obstacles: { cb: () => Promise<void>, lastMatch: boolean }[], distances: { threshold: number, cb: () => Promise<void>, lastMatch: boolean }[], variables: Record<string, any> }>({ messages: {}, colors: [], obstacles: [], distances: [], variables: {} });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); }, []);

  useEffect(() => {
    if (activeChallenge?.svgMap) {
        const { svgString, worldWidth, worldHeight } = activeChallenge.svgMap;
        const img = new Image(); const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, 960, 720);
                setSvgConfig({ width: 960, height: 720, pixelData: ctx.getImageData(0,0,960,720).data, worldWidth, worldHeight });
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    } else setSvgConfig(undefined);
  }, [activeChallenge]);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    executionId.current++; const env = activeChallenge?.environmentObjects || []; setCustomObjects(env);
    const sX = activeChallenge?.startPosition?.x ?? 0; const sZ = activeChallenge?.startPosition?.z ?? 0; 
    // Default to 0 degrees if not specified
    const sR = activeChallenge?.startRotation ?? 0;
    const sd = calculateSensorReadings(sX, sZ, sR, activeChallenge?.id, env, svgConfig);
    const d = { ...robotRef.current, x: sX, y: sd.y, z: sZ, rotation: sR, motorLeftSpeed: 0, motorRightSpeed: 0, ledLeftColor: 'black', ledRightColor: 'black', tilt: sd.tilt, roll: sd.roll, penDown: false, isTouching: false };
    robotRef.current = d; setRobotState(d); setIsRunning(false); setChallengeSuccess(false); setMonitoredValues({}); setCompletedDrawings([]); setActiveDrawing(null); activeDrawingRef.current = null;
    historyRef.current = { maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 }; 
    listenersRef.current = { messages: {}, colors: [], obstacles: [], distances: [], variables: {} };
    setCameraMode('HOME');
  }, [activeChallenge, svgConfig]);

  useEffect(() => { handleReset(); }, [activeChallenge, handleReset]);

  const handleRun = useCallback(async () => {
    if (isRunning) return; setIsRunning(true); setChallengeSuccess(false);
    const curId = ++executionId.current; const ctrl = new AbortController(); abortControllerRef.current = ctrl;
    const check = () => { if (ctrl.signal.aborted || executionId.current !== curId) throw new Error("Simulation aborted"); };
    const robotApi = {
      move: async (dist: number) => {
        check(); const sX = robotRef.current.x; const sZ = robotRef.current.z; const tD = Math.abs(dist) * 0.1; const dir = dist > 0 ? 1 : -1;
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 100 * dir, motorRightSpeed: 100 * dir };
        while (true) { check(); if (Math.sqrt((robotRef.current.x - sX)**2 + (robotRef.current.z - sZ)**2) >= tD || robotRef.current.isTouching) break; await new Promise(r => setTimeout(r, TICK_RATE)); }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 };
      },
      turn: async (angle: number) => {
        check(); const sR = normalizeAngle(robotRef.current.rotation); const tR = normalizeAngle(sR + angle); const dir = angle > 0 ? 1 : -1;
        robotRef.current = { ...robotRef.current, motorLeftSpeed: -50 * dir, motorRightSpeed: 50 * dir };
        while (true) { check(); const diff = getAngleDifference(tR, robotRef.current.rotation); if ((dir > 0 && diff <= TURN_TOLERANCE) || (dir < 0 && diff >= -TURN_TOLERANCE)) break; await new Promise(r => setTimeout(r, TICK_RATE)); }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0, rotation: tR }; setRobotState({ ...robotRef.current });
      },
      setHeading: async (tA: number) => { check(); await robotApi.turn(getAngleDifference(normalizeAngle(tA), normalizeAngle(robotRef.current.rotation))); },
      wait: (ms: number) => new Promise((res, rej) => { const t = setTimeout(res, ms); ctrl.signal.addEventListener('abort', () => { clearTimeout(t); rej(new Error("Simulation aborted")); }); }),
      setMotorPower: async (l: number, r: number) => { check(); robotRef.current = { ...robotRef.current, motorLeftSpeed: l, motorRightSpeed: r }; },
      setLeftMotorPower: async (p: number) => { check(); robotRef.current.motorLeftSpeed = p; },
      setRightMotorPower: async (p: number) => { check(); robotRef.current.motorRightSpeed = p; },
      setSpeed: async (s: number) => { check(); robotRef.current.speed = s; },
      stop: async () => { check(); robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 }; },
      setPen: async (d: boolean) => { check(); robotRef.current.penDown = d; setRobotState(p => ({ ...p, penDown: d })); },
      setPenColor: async (c: string) => { check(); robotRef.current.penColor = c; },
      getDistance: async () => calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects, svgConfig).distance,
      getTouch: async () => calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects, svgConfig).isTouching,
      getGyro: async (m: 'ANGLE' | 'TILT') => { const sd = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects, svgConfig); return m === 'TILT' ? sd.tilt : sd.gyro; },
      getColor: async () => calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects, svgConfig).color,
      isTouchingColor: async (h: string) => isColorClose(calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects, svgConfig).color, h),
      setLed: (s: 'left' | 'right' | 'both', c: string) => { check(); if (s === 'left' || s === 'both') robotRef.current.ledLeftColor = c; if (s === 'right' || s === 'both') robotRef.current.ledRightColor = c; setRobotState({ ...robotRef.current }); },
      onMessage: (m: string, cb: () => Promise<void>) => { if (!listenersRef.current.messages[m]) listenersRef.current.messages[m] = []; listenersRef.current.messages[m].push(cb); },
      sendMessage: async (m: string) => { if (listenersRef.current.messages[m]) await Promise.all(listenersRef.current.messages[m].map(cb => cb())); },
      onColor: (c: string, cb: () => Promise<void>) => listenersRef.current.colors.push({ color: c, cb, lastMatch: false }),
      onObstacle: (cb: () => Promise<void>) => listenersRef.current.obstacles.push({ cb, lastMatch: false }),
      onDistance: (t: number, cb: () => Promise<void>) => listenersRef.current.distances.push({ threshold: t, cb, lastMatch: false }),
      updateVariable: (n: string, v: any) => setMonitoredValues(p => ({ ...p, [n]: v })),
      stopProgram: async () => { ctrl.abort(); setIsRunning(false); }
    };
    try { const AsyncF = Object.getPrototypeOf(async function(){}).constructor; await new AsyncF('robot', generatedCode)(robotApi); } catch (e: any) { if (e.message !== "Simulation aborted") setIsRunning(false); }
  }, [isRunning, generatedCode, activeChallenge, customObjects, svgConfig]);

  useEffect(() => {
    let int: any; if (isRunning) { 
      int = setInterval(() => { 
        const cur = robotRef.current; const f = cur.speed / 100.0; const pL = cur.motorLeftSpeed / 100.0; const pR = cur.motorRightSpeed / 100.0;
        let fV = ((pL + pR) / 2.0) * BASE_VELOCITY * f; 
        const rV = (pR - pL) * BASE_TURN_SPEED * f; 
        const sd_c = calculateSensorReadings(cur.x, cur.z, cur.rotation, activeChallenge?.id, customObjects, svgConfig);
        if (Math.abs(sd_c.tilt) > 3) fV *= Math.max(0.2, 1 - (Math.min(Math.abs(sd_c.tilt)/25, 1)) * 0.8);
        const nR = cur.rotation + rV; 
        const nX = cur.x + Math.sin(nR * Math.PI/180) * fV; 
        const nZ = cur.z - Math.cos(nR * Math.PI/180) * fV; 
        const sd_p = calculateSensorReadings(nX, nZ, nR, activeChallenge?.id, customObjects, svgConfig);
        const fX = sd_p.physicalHit ? cur.x : nX; const fZ = sd_p.physicalHit ? cur.z : nZ;
        const sd_f = calculateSensorReadings(fX, fZ, nR, activeChallenge?.id, customObjects, svgConfig);
        const next = { ...cur, x: fX, z: fZ, y: cur.y + (sd_f.y - cur.y)*0.3, tilt: cur.tilt + (sd_f.tilt - cur.tilt)*0.3, roll: cur.roll + (sd_f.roll - cur.roll)*0.3, rotation: nR, isTouching: sd_f.isTouching, isMoving: Math.abs(fV) > 0.001 || Math.abs(rV) > 0.001, sensorX: sd_f.sensorX, sensorZ: sd_f.sensorZ }; 
        robotRef.current = next; setRobotState(next); 
        listenersRef.current.colors.forEach(l => { const m = isColorClose(sd_f.color, l.color); if (m && !l.lastMatch) l.cb(); l.lastMatch = m; });
        listenersRef.current.obstacles.forEach(l => { if (sd_f.isTouching && !l.lastMatch) l.cb(); l.lastMatch = sd_f.isTouching; });
        listenersRef.current.distances.forEach(l => { const m = sd_f.distance < l.threshold; if (m && !l.lastMatch) l.cb(); l.lastMatch = m; });
        if (sd_f.isTouching) historyRef.current.touchedWall = true; 
        historyRef.current.maxDistanceMoved = Math.max(historyRef.current.maxDistanceMoved, Math.sqrt((next.x - (activeChallenge?.startPosition?.x || 0))**2 + (next.z - (activeChallenge?.startPosition?.z || 0))**2) * 10);
        if (!historyRef.current.detectedColors.includes(sd_f.color)) historyRef.current.detectedColors.push(sd_f.color);
        historyRef.current.totalRotation = robotRef.current.rotation - (activeChallenge?.startRotation ?? 0);
        if (next.penDown) { 
          const p: [number, number, number] = [next.x, next.y + 0.02, next.z]; 
          setActiveDrawing(d => {
              if (!d || d.color !== next.penColor) {
                  if (d) setCompletedDrawings(old => [...old, d]);
                  const newD = { id: `p-${Date.now()}`, points: [p], color: next.penColor }; activeDrawingRef.current = newD; return newD;
              } else { const upd = { ...d, points: [...d.points, p] }; activeDrawingRef.current = upd; return upd; }
          });
        } else if (activeDrawingRef.current) { setCompletedDrawings(o => [...o, activeDrawingRef.current!]); setActiveDrawing(null); activeDrawingRef.current = null; }
        if (activeChallenge && activeChallenge.check(cur, next, historyRef.current) && !challengeSuccess) { setChallengeSuccess(true); showToast("Mission Accomplished!", "success"); } 
      }, TICK_RATE); 
    } return () => clearInterval(int);
  }, [isRunning, customObjects, activeChallenge, challengeSuccess, showToast, svgConfig]);

  const sensorReadings = useMemo(() => calculateSensorReadings(robotState.x, robotState.z, robotState.rotation, activeChallenge?.id, customObjects, svgConfig), [robotState.x, robotState.z, robotState.rotation, activeChallenge, customObjects, svgConfig]);

  const showBlocklyNumpad = useCallback((i: any, onC: any, pos: any) => setNumpadConfig({ isOpen: true, value: parseFloat(i.toString()), onConfirm: onC, position: { top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, width: pos.width, height: pos.height } }), []);

  const openPythonView = () => {
    if (blocklyEditorRef.current) {
      setIsPythonModalOpen(true);
    }
  };

  const orbitControlsProps = useMemo(() => {
    let props: any = {
      enablePan: true,
      enableRotate: true,
      mouseButtons: { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN },
      minDistance: 1.2,
      maxDistance: 60,
    };
    if (editorTool === 'PAN' || cameraMode === 'TOP') {
        props.enableRotate = false;
        props.mouseButtons.LEFT = THREE.MOUSE.PAN;
    }
    if (cameraMode === 'FOLLOW') {
        props.enablePan = false;
        props.enableRotate = false;
    }
    return props;
  }, [editorTool, cameraMode]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50" dir="ltr">
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[500000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in border-2 ${toast.type === 'success' ? 'bg-green-600 border-green-400 text-white' : toast.type === 'error' ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
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
          <button onClick={handleRun} disabled={isRunning || startBlockCount === 0} className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${isRunning || startBlockCount === 0 ? 'bg-slate-700/50 text-slate-600' : 'bg-green-600 text-white hover:bg-green-500'}`} title="Run Program"><Flag size={20} fill={(isRunning || startBlockCount === 0) ? "none" : "currentColor"} /></button>
          <button onClick={handleReset} className="flex items-center justify-center w-11 h-11 bg-red-600 hover:bg-red-50 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-md active:shadow-none" title="Reset"><RotateCcw size={22} strokeWidth={2.5} /></button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={() => setIsRulerActive(!isRulerActive)} className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${isRulerActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} title="Ruler Tool"><Ruler size={20} /></button>
          <button onClick={() => setShowAngleChart(!showAngleChart)} className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all transform active:scale-95 ${showAngleChart ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`} title="Angle Chart"><Navigation size={20} /></button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={() => setProjectModal({ isOpen: true, mode: 'save' })} className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 hover:bg-slate-600 rounded-xl font-bold transition-all transform active:scale-95" title="Save Project"><Save size={20} /></button>
          <button onClick={() => setProjectModal({ isOpen: true, mode: 'load' })} className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 hover:bg-slate-600 rounded-xl font-bold transition-all transform active:scale-95" title="Open Project"><FolderOpen size={20} /></button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={openPythonView} className="flex items-center justify-center w-11 h-11 bg-slate-700 text-slate-400 hover:bg-slate-600 rounded-xl font-bold transition-all transform active:scale-95" title="Python Code"><Terminal size={20} /></button>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95" title="Help"><HelpCircle size={16} />Help</button>
          <button onClick={() => setShowChallenges(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${activeChallenge ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Trophy size={16} /> {activeChallenge ? activeChallenge.title : "Challenges"}</button>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden relative">
        <div className="w-1/2 relative flex flex-col bg-white text-left text-sm border-r border-slate-200">
          <div className="bg-slate-50 border-b p-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2"><Code2 size={18} className="text-slate-400" /><span className="font-bold text-slate-600 uppercase tracking-tight">Workspace</span></div>
          </div>
          <div className="flex-1 relative">
            <BlocklyEditor ref={blocklyEditorRef} onCodeChange={useCallback((c, n) => { setGeneratedCode(c); setStartBlockCount(n); }, [])} visibleVariables={visibleVariables} onToggleVariable={useCallback((n) => setVisibleVariables(v => { const x = new Set(v); if (x.has(n)) x.delete(n); else x.add(n); return x; }), [])} onShowNumpad={showBlocklyNumpad} />
          </div>
        </div>
        
        <div className="w-1/2 relative bg-slate-900 overflow-hidden">
          <div className="absolute top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {Array.from(visibleVariables).map((v) => (
              <div key={v} className="bg-[#FF8C1A] text-white rounded-lg px-3 py-1 flex items-center gap-3 text-sm font-bold shadow-lg border-2 border-white/20 pointer-events-auto">
                <span>{v}</span>
                <span className="bg-white/30 rounded px-2 py-0.5 min-w-[4rem] text-center font-mono">{typeof monitoredValues[v] === 'number' ? monitoredValues[v].toFixed(2) : String(monitoredValues[v] ?? 0)}</span>
              </div>
            ))}
          </div>

          <div className="absolute top-4 right-4 z-[100] flex flex-col gap-3">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-1 flex flex-col overflow-hidden">
              <button onClick={() => setCameraMode('HOME')} className={`p-3 transition-all rounded-xl ${cameraMode === 'HOME' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} title="Reset Camera"><Home size={22} /></button>
              <div className="h-px bg-slate-100 mx-2 my-0.5" />
              <button onClick={() => setCameraMode(p => p === 'TOP' ? 'HOME' : 'TOP')} className={`p-3 transition-all rounded-xl ${cameraMode === 'TOP' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} title="Top View"><Eye size={22} /></button>
              <button onClick={() => setCameraMode(p => p === 'FOLLOW' ? 'HOME' : 'FOLLOW')} className={`p-3 transition-all rounded-xl ${cameraMode === 'FOLLOW' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} title="Follow Camera"><Target size={22} /></button>
              <div className="h-px bg-slate-100 mx-2 my-0.5" />
              
              <button 
                onClick={() => { 
                  controlsRef.current?.dollyOut(1.2); 
                  controlsRef.current?.update(); 
                }}
                className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all active:scale-95" 
                title="Zoom In (+)"
              >
                <ZoomIn size={22} />
              </button>
              <button 
                onClick={() => { 
                  controlsRef.current?.dollyIn(1.2); 
                  controlsRef.current?.update(); 
                }}
                className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all active:scale-95" 
                title="Zoom Out (-)"
              >
                <ZoomOut size={22} />
              </button>

              <div className="h-px bg-slate-100 mx-2 my-0.5" />
              <button onClick={() => setEditorTool(p => p === 'PAN' ? 'NONE' : 'PAN')} className={`p-3 rounded-xl transition-all ${editorTool === 'PAN' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} title="Pan Tool"><Hand size={22} /></button>
              <button onClick={() => setEditorTool('NONE')} className={`p-3 transition-all rounded-xl ${editorTool === 'NONE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} title="Rotate Tool"><Move size={22} /></button>
              <button onClick={() => setEditorTool(p => p === 'ROBOT_MOVE' ? 'NONE' : 'ROBOT_MOVE')} className={`p-3 transition-all rounded-xl ${editorTool === 'ROBOT_MOVE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`} title="Move Robot Position"><Bot size={22} /></button>
            </div>
          </div>
          
          <SensorDashboard distance={sensorReadings.distance} isTouching={sensorReadings.isTouching} gyroAngle={sensorReadings.gyro} tiltAngle={sensorReadings.tilt} detectedColor={sensorReadings.color} lightIntensity={sensorReadings.intensity} />
          
          <Canvas shadows camera={{ position: [10, 10, 10], fov: 45 }}>
            <SimulationEnvironment challengeId={activeChallenge?.id} customObjects={customObjects} robotState={robotState} svgMap={activeChallenge?.svgMap} />
            {completedDrawings.map((p) => <Line key={p.id} points={p.points} color={p.color} lineWidth={4} />)}
            {activeDrawing && activeDrawing.points.length > 1 && <Line key={activeDrawing.id} points={activeDrawing.points} color={activeDrawing.color} lineWidth={4} />}
            <Robot3D state={robotState} isPlacementMode={editorTool === 'ROBOT_MOVE'} />
            <OrbitControls ref={controlsRef} makeDefault {...orbitControlsProps} />
            <CameraManager robotState={robotState} cameraMode={cameraMode} controlsRef={controlsRef} />
            {isRulerActive && <RulerTool />}
            <AngleChart isOpen={showAngleChart} robotPos={{ x: robotState.x, z: robotState.z }} />
          </Canvas>
        </div>
      </main>
      
      {isPythonModalOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-700">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3"><FileCode className="text-blue-400" /> Python Code Output</h2>
              <button onClick={() => setIsPythonModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 font-mono text-sm"><pre className="text-blue-300 whitespace-pre-wrap">{blocklyEditorRef.current?.getPythonCode()}</pre></div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => { const c = blocklyEditorRef.current?.getPythonCode(); if (c) navigator.clipboard.writeText(c); showToast("Code copied to clipboard!", "success"); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">Copy Code</button>
            </div>
          </div>
        </div>
      )}

      {projectModal.isOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border-2 border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{projectModal.mode === 'save' ? <Save size={20} className="text-blue-600"/> : <FolderOpen size={20} className="text-orange-600"/>}{projectModal.mode === 'save' ? 'Save Project' : 'Load Project'}</h2>
              <button onClick={() => setProjectModal({...projectModal, isOpen: false})} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24}/></button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              {projectModal.mode === 'save' ? (
                <>
                  <p className="text-slate-500 text-sm">Download your workspace as a `.roby` file to save your progress locally.</p>
                  <button onClick={() => { const xml = blocklyEditorRef.current?.saveWorkspace(); if (xml) { const blob = new Blob([xml], {type: 'text/xml'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'robot-project.roby'; a.click(); showToast("Project saved successfully!", "success"); } setProjectModal({...projectModal, isOpen: false}); }} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">Download Project (.roby file)</button>
                </>
              ) : (
                <>
                  <p className="text-slate-500 text-sm">Choose a `.roby` or `.xml` file from your computer to restore a workspace.</p>
                  <input type="file" accept=".roby,.xml" className="hidden" id="project-upload" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (re) => { blocklyEditorRef.current?.loadWorkspace(re.target?.result as string); showToast("Project loaded successfully!", "success"); setProjectModal({...projectModal, isOpen: false}); }; r.readAsText(f); } }} />
                  <label htmlFor="project-upload" className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold shadow-lg text-center cursor-pointer active:scale-95 transition-all">Select File to Load</label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Numpad isOpen={numpadConfig.isOpen} initialValue={numpadConfig.value} onConfirm={(val) => { numpadConfig.onConfirm(val); setNumpadConfig(p => ({ ...p, isOpen: false })); }} onClose={() => setNumpadConfig(p => ({ ...p, isOpen: false }))} position={numpadConfig.position} />
      {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
      
      {showChallenges && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Trophy className="text-yellow-500" /> Coding Challenges</h2>
              <button onClick={() => setShowChallenges(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={() => { setActiveChallenge(null); setShowChallenges(false); }} className={`p-5 rounded-3xl border-4 text-left transition-all hover:scale-[1.02] flex flex-col gap-3 group relative overflow-hidden ${activeChallenge === null ? 'border-blue-500 bg-white shadow-xl' : 'border-white bg-white hover:border-blue-300 shadow-md'}`}>
                  <h3 className={`font-bold text-lg z-10 transition-colors ${activeChallenge === null ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>Free Drive (No Mission)</h3>
                  <p className="text-sm text-slate-500 line-clamp-3 z-10">An open environment for free practice without predefined walls or tracks.</p>
                </button>
                {CHALLENGES.map((c) => (
                  <button key={c.id} onClick={() => { setActiveChallenge(c); setShowChallenges(false); }} className={`p-5 rounded-3xl border-4 text-left transition-all hover:scale-[1.02] flex flex-col gap-3 group relative overflow-hidden ${activeChallenge?.id === c.id ? 'border-yellow-500 bg-white shadow-xl' : 'border-white bg-white hover:border-blue-300 shadow-md'}`}>
                    <h3 className={`font-bold text-lg z-10 transition-colors ${activeChallenge?.id === c.id ? 'text-yellow-600' : 'text-slate-800 group-hover:text-blue-600'}`}>{c.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 z-10">{c.description}</p>
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
