
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { RotateCcw, Code2, Ruler, Trophy, X, Flag, Save, FolderOpen, ZoomIn, ZoomOut, Home, Check, AlertCircle, Copy, Info, Terminal, FileUp, Star, Hand, Move, Target, Eye, Bot } from 'lucide-react';
import { Vector3, Color, Matrix4, MOUSE } from 'three';
import BlocklyEditor, { BlocklyEditorHandle } from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState, EditorTool, CameraMode, PathShape, CustomObject, DrawingSegment, SimulationHistory } from './types';
import Numpad from './components/Numpad';
import SensorDashboard from './components/SensorDashboard';
import RulerTool from './components/RulerTool';
import { CHALLENGES, Challenge } from './data/challenges';

const TICK_RATE = 16; 
const BASE_VELOCITY = 0.055; 
const BASE_TURN_SPEED = 0.13; 

const isColorClose = (hex1: string, hex2: string, threshold = 0.4) => {
    try {
        if (!hex1 || !hex2) return false;
        const h1 = hex1.toLowerCase();
        const h2 = hex2.toLowerCase();
        if (h1 === h2) return true;
        const colorMap: Record<string, string> = {
            'red': '#FF0000', 'green': '#22C55E', 'blue': '#3B82F6', 'yellow': '#FACC15',
            'magenta': '#D946EF', 'cyan': '#06B6D4', 'black': '#000000', 'white': '#FFFFFF',
            'orange': '#F97316', 'purple': '#8B5CF6'
        };
        const finalH1 = colorMap[h1] || (h1.startsWith('#') ? h1 : '#' + h1);
        const finalH2 = colorMap[h2] || (h2.startsWith('#') ? h2 : '#' + h2);
        const c1 = new Color(finalH1);
        const c2 = new Color(finalH2);
        const distance = Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
        return distance < threshold;
    } catch (e) { return false; }
};

const isPointInObject = (px: number, pz: number, obj: CustomObject) => {
    const dx = px - obj.x; const dz = pz - obj.z;
    const cos = Math.cos(-(obj.rotation || 0)); const sin = Math.sin(-(obj.rotation || 0));
    const localX = dx * cos - dz * sin; const localZ = dx * sin + dz * cos;
    const halfW = obj.width / 2; 
    const halfL = (obj.type === 'PATH' && obj.shape === 'CORNER') ? obj.width / 2 : obj.length / 2;
    return Math.abs(localX) <= halfW && Math.abs(localZ) <= halfL;
};

const getSurfaceHeightAt = (qx: number, qz: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    let maxHeight = 0;
    customObjects.filter(o => o.type === 'RAMP').forEach(ramp => {
        const dx = qx - ramp.x; const dz = qz - ramp.z;
        const cR = Math.cos(-(ramp.rotation || 0)); const sR = Math.sin(-(ramp.rotation || 0));
        const lX = dx * cR - dz * sR; const lZ = dx * sR + dx * cR;
        const hW = ramp.width / 2; const hL = ramp.length / 2; const h = ramp.height || 1.2;
        if (Math.abs(lX) <= hW && Math.abs(lZ) <= hL) {
            const section = ramp.length / 3; const uphillEnd = -hL + section; const downhillStart = hL - section;
            let currentY = 0;
            if (lZ < uphillEnd) currentY = ((lZ - (-hL)) / section) * h;
            else if (lZ < downhillStart) currentY = h;
            else currentY = h - (((lZ - downhillStart) / section) * h);
            maxHeight = Math.max(maxHeight, currentY);
        }
    });
    return maxHeight;
};

const getEnvironmentConfig = (challengeId?: string, customObjects: CustomObject[] = []) => {
    let walls: {minX: number, maxX: number, minZ: number, maxZ: number}[] = [];
    let complexZones: {x: number, z: number, width: number, length: number, rotation: number, color: number, shape?: PathShape}[] = [];
    if (['c10', 'c16', 'c19', 'c20', 'c_maze_original'].includes(challengeId || '')) {
        if (challengeId === 'c10') walls.push({ minX: -3, maxX: 3, minZ: -10.25, maxZ: -9.75 });
    }
    customObjects.forEach(obj => {
        if (obj.type === 'PATH') { complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: parseInt((obj.color || '#FFFF00').replace('#', '0x'), 16), shape: obj.shape || 'STRAIGHT' }); } 
        else if (obj.type === 'COLOR_LINE') { complexZones.push({ x: obj.x, z: obj.z, width: obj.width, length: obj.length, rotation: obj.rotation || 0, color: parseInt((obj.color || '#FF0000').replace('#', '0x'), 16) }); }
    });
    return { walls, complexZones };
};

const calculateSensorReadings = (x: number, z: number, rotation: number, challengeId?: string, customObjects: CustomObject[] = []) => {
    const rad = (rotation * Math.PI) / 180; const sin = Math.sin(rad); const cos = Math.cos(rad);
    const env = getEnvironmentConfig(challengeId, customObjects);
    const gyro = Math.round(((rotation % 360) + 360) % 360);
    
    const checkPhysicsHit = (px: number, pz: number) => {
        for (const w of env.walls) { if (px >= w.minX && px <= w.maxX && pz >= w.minZ && pz <= w.maxZ) return true; }
        for (const obj of customObjects) { if (obj.type === 'WALL' || obj.type === 'RAMP') { if (isPointInObject(px, pz, obj)) return true; } }
        return false;
    };

    const getWheelWorldPos = (lx: number, lz: number) => ({
        wx: x + (lx * Math.cos(rad) + lz * Math.sin(rad)),
        wz: z + (-lx * Math.sin(rad) + lz * Math.cos(rad))
    });
    const leftW = getWheelWorldPos(-0.95, 0.5); const rightW = getWheelWorldPos(0.95, 0.5); const backW = getWheelWorldPos(0, -0.8);
    const hLeft = getSurfaceHeightAt(leftW.wx, leftW.wz, challengeId, customObjects);
    const hRight = getSurfaceHeightAt(rightW.wx, rightW.wz, challengeId, customObjects);
    const hBack = getSurfaceHeightAt(backW.wx, backW.wz, challengeId, customObjects);
    const y = (hLeft + hRight + hBack) / 3;
    const frontAvg = (hLeft + hRight) / 2;
    const tilt = Math.atan2(frontAvg - hBack, 1.3) * (180 / Math.PI);
    const roll = Math.atan2(hLeft - hRight, 1.9) * (180 / Math.PI);

    const sensorGroundProjectionDist = 0.9 * Math.cos(tilt * (Math.PI / 180)) - (-0.1) * Math.sin(tilt * (Math.PI / 180));
    const cx = x + sin * sensorGroundProjectionDist; const cz = z + cos * sensorGroundProjectionDist;
    let color = "white"; let rawDecimalColor = 0xFFFFFF;
    
    for (const zZone of env.complexZones) {
        const dx = cx - zZone.x; const dz = cz - zZone.z;
        const cR = Math.cos(-zZone.rotation); const sR = Math.sin(-zZone.rotation);
        const lX = dx * cR - dz * sR; const lZ = dx * sR + dz * cR;
        let onLine = false; const lineTolerance = 0.4;
        if (zZone.shape === 'STRAIGHT' || !zZone.shape) { if (Math.abs(lX) <= lineTolerance && Math.abs(lZ) <= zZone.length / 2) onLine = true; }
        else if (zZone.shape === 'CORNER') { if (Math.abs(lX) <= lineTolerance && lZ >= -zZone.width/2 && lZ <= zZone.width/2) onLine = true; if (Math.abs(lZ) <= lineTolerance && lX >= -zZone.width/2 && lX <= zZone.width/2) onLine = true; }
        else if (zZone.shape === 'CURVED') {
            const radius = zZone.length / 2; const dist = Math.sqrt(Math.pow(lX - (-radius), 2) + Math.pow(lZ - 0, 2));
            if (Math.abs(dist - radius) <= lineTolerance) { const angle = Math.atan2(lZ, lX + radius); if (angle >= 0 && angle <= Math.PI/2) onLine = true; }
        }
        if (onLine) {
            rawDecimalColor = zZone.color; const hexStr = "#" + rawDecimalColor.toString(16).padStart(6, '0').toUpperCase();
            if (isColorClose(hexStr, "#ef4444")) color = "red"; else if (isColorClose(hexStr, "#3B82F6")) color = "blue"; else if (isColorClose(hexStr, "#22C55E")) color = "green"; else if (isColorClose(hexStr, "#FACC15")) color = "yellow"; else if (isColorClose(hexStr, "#D946EF")) color = "magenta"; else if (isColorClose(hexStr, "#000000")) color = "black"; else color = hexStr;
            break; 
        }
    }

    const physicalStopDist = 1.45;
    const touchTriggerDist = 1.52;

    const checkBumperHit = (dist: number) => {
        const lateralOffset = 0.7;
        const points = [
            { lx: 0, lz: dist },
            { lx: -lateralOffset, lz: dist },
            { lx: lateralOffset, lz: dist }
        ];
        for (const p of points) {
            const wx = x + (p.lx * Math.cos(rad) + p.lz * Math.sin(rad));
            const wz = z + (-p.lx * Math.sin(rad) + p.lz * Math.cos(rad));
            if (checkPhysicsHit(wx, wz)) return true;
        }
        return false;
    };

    const physicalHit = checkBumperHit(physicalStopDist);
    let isTouching = checkBumperHit(touchTriggerDist);

    const ultrasonicStartDist = 1.5;
    let distance = 255; const scanStep = 0.05; 
    for (let d = 0; d < 40.0; d += scanStep) {
        const tx = x + sin * (ultrasonicStartDist + d); const tz = z + cos * (ultrasonicStartDist + d);
        if (checkPhysicsHit(tx, tz)) { 
            distance = Math.round(d * 10); 
            break; 
        }
    }
    
    if (physicalHit) {
        distance = 0;
        isTouching = true;
    }
    
    return { gyro, tilt, roll, y, isTouching, physicalHit, distance, color, intensity: 100, rawDecimalColor, sensorX: cx, sensorZ: cz };
};

const AppProjectModal: React.FC<{
  isOpen: boolean;
  mode: 'save' | 'load';
  onClose: () => void;
  onSaveToFile: (name: string) => void;
  onLoad: (data: string) => void;
}> = ({ isOpen, mode, onClose, onSaveToFile, onLoad }) => {
  const [name, setName] = useState('project');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border-4 border-slate-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {mode === 'save' ? <Save size={20} className="text-blue-500" /> : <FolderOpen size={20} className="text-blue-500" />}
            {mode === 'save' ? 'שמור פרויקט' : 'טען פרויקט'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          {mode === 'save' ? (
            <>
              <div>
                <label className="block text-slate-600 font-bold mb-2">שם הפרויקט:</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none" 
                  placeholder="הכנס שם..." 
                />
              </div>
              <button 
                onClick={() => onSaveToFile(name)} 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all active:scale-95 shadow-lg"
              >
                שמור קובץ למחשב
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 text-sm">בחר קובץ .robocode מהמחשב שלך.</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".robocode,.json" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        onLoad(event.target.result as string);
                        onClose();
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                <FileUp size={20} /> בחר קובץ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AppPythonCodeModal: React.FC<{
  isOpen: boolean;
  code: string;
  onClose: () => void;
  onCopy: () => void;
}> = ({ isOpen, code, onClose, onCopy }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border-4 border-blue-500 animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-3"><Terminal /> קוד פייתון שנוצר</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-black/50 p-4 rounded-2xl border border-slate-700 max-h-80 overflow-y-auto">
            <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap text-left" dir="ltr">{code}</pre>
          </div>
          <button 
            onClick={onCopy} 
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
          >
            <Copy size={20} /> העתק ללוח
          </button>
        </div>
      </div>
    </div>
  );
};

const CameraUpdater: React.FC<{
    mode: CameraMode,
    robotState: RobotState,
    controlsRef: React.RefObject<any>
    zoomFactor: number,
}> = ({ mode, robotState, controlsRef, zoomFactor }) => {
    const { camera } = useThree();

    useFrame(() => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const robotPos = new Vector3(robotState.x, robotState.y, robotState.z);

        if (mode === 'FOLLOW') {
            controls.enabled = false;
            const robotTarget = new Vector3(robotState.x, robotState.y + 0.5, robotState.z);
            const baseOffset = new Vector3(0, 4, -6);
            const offset = baseOffset.multiplyScalar(zoomFactor);
            const rotationMatrix = new Matrix4().makeRotationY(robotState.rotation * (Math.PI / 180));
            offset.applyMatrix4(rotationMatrix);

            const targetCamPos = robotTarget.clone().add(offset);
            camera.position.lerp(targetCamPos, 0.1);
            controls.target.lerp(robotTarget, 0.1);
            controls.update();
        } else if (mode === 'TOP') {
            controls.enabled = false;
            const baseHeight = 15;
            const targetCamPos = new Vector3(robotState.x, baseHeight * zoomFactor, robotState.z);
            camera.position.lerp(targetCamPos, 0.1);
            controls.target.lerp(robotPos, 0.1);
            controls.update();
        } else {
            controls.enabled = true;
        }
    });

    return null;
};


const App: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [startBlockCount, setStartBlockCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [pythonCode, setPythonCode] = useState('');
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('HOME');
  const [isPlacingRobot, setIsPlacingRobot] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [projectModal, setProjectModal] = useState<{isOpen: boolean, mode: 'save' | 'load'}>({isOpen: false, mode: 'save'});
  const [monitoredValues, setMonitoredValues] = useState<Record<string, any>>({});
  const [visibleVariables, setVisibleVariables] = useState<Set<string>>(new Set());
  const blocklyEditorRef = useRef<BlocklyEditorHandle>(null);
  const controlsRef = useRef<any>(null);
  const historyRef = useRef<SimulationHistory>({ maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 });
  const executionId = useRef(0);
  const [numpadConfig, setNumpadConfig] = useState({ isOpen: false, value: 0, onConfirm: (val: number) => {} });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [drawings, setDrawings] = useState<DrawingSegment[]>([]);
  const lastDrawingPos = useRef<[number, number, number] | null>(null);
  const robotRef = useRef<RobotState>({ x: 0, y: 0, z: 0, rotation: 180, tilt: 0, roll: 0, speed: 100, motorLeftSpeed: 0, motorRightSpeed: 0, ledLeftColor: 'black', ledRightColor: 'black', isMoving: false, isTouching: false, penDown: false, penColor: '#000000' });
  const [robotState, setRobotState] = useState<RobotState>(robotRef.current);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listenersRef = useRef<{ messages: Record<string, (() => Promise<void>)[]>, colors: { color: string, cb: () => Promise<void>, lastMatch: boolean }[], obstacles: { cb: () => Promise<void>, lastMatch: boolean }[], distances: { threshold: number, cb: () => Promise<void>, lastMatch: boolean }[], variables: Record<string, any> }>({ messages: {}, colors: [], obstacles: [], distances: [], variables: {} });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); }, []);

  const stageColors = useMemo(() => {
    const colors = new Set<string>();
    customObjects.forEach(obj => {
        if (obj.color) {
            colors.add(obj.color.toUpperCase());
        }
    });
    return Array.from(colors);
  }, [customObjects]);

  useEffect(() => {
    window.showBlocklyNumpad = (val, cb) => {
        setNumpadConfig({ isOpen: true, value: Number(val), onConfirm: cb });
    };
    window.getStageColors = () => stageColors;
  }, [stageColors]);

  useEffect(() => {
    if (controlsRef.current) {
        if (isPanning) {
            controlsRef.current.mouseButtons.LEFT = MOUSE.PAN;
            controlsRef.current.mouseButtons.RIGHT = MOUSE.ROTATE;
        } else {
            controlsRef.current.mouseButtons.LEFT = MOUSE.ROTATE;
            controlsRef.current.mouseButtons.RIGHT = MOUSE.PAN;
        }
    }
  }, [isPanning]);

  const handleTogglePan = () => {
    const nextState = !isPanning;
    setIsPanning(nextState);
    if (nextState) {
        setIsPlacingRobot(false);
    }
  };

  const handleTogglePlaceRobot = () => {
      const nextState = !isPlacingRobot;
      setIsPlacingRobot(nextState);
      if (nextState) {
          setIsPanning(false);
      }
  };

  const handleShowPython = useCallback(() => {
    const code = blocklyEditorRef.current?.getPythonCode() || '';
    setPythonCode(code);
    setIsPythonModalOpen(true);
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning) return; setIsRunning(true); setChallengeSuccess(false); 
    historyRef.current = { maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 }; 
    listenersRef.current = { messages: {}, colors: [], obstacles: [], distances: [], variables: {} };
    
    const currentRunId = ++executionId.current; const controller = new AbortController(); abortControllerRef.current = controller;
    const checkAbort = () => { if (controller.signal.aborted || executionId.current !== currentRunId) { throw new Error("Simulation aborted"); } };
    
    const robotApi = {
      move: async (dist: number) => { 
        checkAbort(); 
        const startX = robotRef.current.x; 
        const startZ = robotRef.current.z; 
        const targetDist = Math.abs(dist) * 0.1; 
        const direction = dist > 0 ? 1 : -1; 
        
        while (true) { 
          checkAbort(); 
          const currentPos = robotRef.current;
          const moved = Math.sqrt(Math.pow(currentPos.x - startX, 2) + Math.pow(currentPos.z - startZ, 2)); 
          const remaining = targetDist - moved;
          if (remaining <= 0) break; 
          
          const pGain = 120;
          const power = Math.min(100, Math.max(15, remaining * pGain)) * direction;
          robotRef.current = { ...currentPos, motorLeftSpeed: power, motorRightSpeed: power };
          
          await new Promise(r => setTimeout(r, TICK_RATE)); 
          const sd = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects); 
          if (sd.physicalHit) break; 
        } 
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 }; 
      },
      turn: async (angle: number) => { 
        checkAbort(); 
        const startRot = robotRef.current.rotation; 
        while (true) { 
          checkAbort(); 
          const currentPos = robotRef.current;
          const turned = currentPos.rotation - startRot;
          const remaining = angle - turned;
          if (Math.abs(remaining) < 0.2) break; 
          const pGain = 20;
          const speed = Math.min(100, Math.max(8, Math.abs(remaining) * pGain));
          const direction = remaining > 0 ? 1 : -1;
          robotRef.current = { ...currentPos, motorLeftSpeed: -speed * direction, motorRightSpeed: speed * direction };
          await new Promise(r => setTimeout(r, TICK_RATE)); 
        } 
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 }; 
      },
      setHeading: async (targetAngle: number) => {
        checkAbort();
        while (true) {
          checkAbort();
          const currentPos = robotRef.current;
          const currentRot = currentPos.rotation;
          let diff = targetAngle - currentRot;
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;

          if (Math.abs(diff) < 0.2) break;
          const pGain = 20;
          const speed = Math.min(100, Math.max(8, Math.abs(diff) * pGain));
          const direction = diff > 0 ? 1 : -1;
          robotRef.current = { ...currentPos, motorLeftSpeed: -speed * direction, motorRightSpeed: speed * direction };
          await new Promise(r => setTimeout(r, TICK_RATE));
        }
        robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 };
      },
      wait: (ms: number) => new Promise((resolve, reject) => { const timeout = setTimeout(resolve, ms); controller.signal.addEventListener('abort', () => { clearTimeout(timeout); reject(new Error("Simulation aborted")); }, { once: true }); }),
      setMotorPower: async (left: number, right: number) => { checkAbort(); robotRef.current = { ...robotRef.current, motorLeftSpeed: left, motorRightSpeed: right }; },
      setSpeed: async (s: number) => { checkAbort(); robotRef.current = { ...robotRef.current, speed: s }; },
      stop: async () => { checkAbort(); robotRef.current = { ...robotRef.current, motorLeftSpeed: 0, motorRightSpeed: 0 }; },
      setPen: async (down: boolean) => { checkAbort(); robotRef.current = { ...robotRef.current, penDown: down }; setRobotState(prev => ({ ...prev, penDown: down })); },
      setPenColor: async (color: string) => { checkAbort(); robotRef.current = { ...robotRef.current, penColor: color }; setRobotState(prev => ({ ...prev, penColor: color })); },
      clearPen: async () => { checkAbort(); setDrawings([]); },
      getDistance: async () => { checkAbort(); return calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).distance; },
      getTouch: async () => { 
        checkAbort(); 
        const sd = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects);
        return sd.isTouching; 
      },
      getGyro: async (mode: 'ANGLE' | 'TILT') => { checkAbort(); const sd = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects); return mode === 'TILT' ? sd.tilt : sd.gyro; },
      getColor: async () => { checkAbort(); return calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects).color; },
      isTouchingColor: async (hex: string) => { checkAbort(); const sd = calculateSensorReadings(robotRef.current.x, robotRef.current.z, robotRef.current.rotation, activeChallenge?.id, customObjects); return isColorClose("#" + sd.rawDecimalColor.toString(16).padStart(6, '0').toUpperCase(), hex); },
      getCircumference: async () => 3.77,
      setLed: (side: 'left' | 'right' | 'both', color: string) => { checkAbort(); const updates: any = {}; if (side === 'left' || side === 'both') updates.ledLeftColor = color; if (side === 'right' || side === 'both') updates.ledRightColor = color; robotRef.current = { ...robotRef.current, ...updates }; setRobotState(prev => ({ ...prev, ...updates })); },
      onMessage: (msg: string, cb: () => Promise<void>) => { if (executionId.current !== currentRunId) return; if (!listenersRef.current.messages[msg]) listenersRef.current.messages[msg] = []; listenersRef.current.messages[msg].push(cb); },
      sendMessage: async (msg: string) => { checkAbort(); if (listenersRef.current.messages[msg]) await Promise.all(listenersRef.current.messages[msg].map(cb => cb())); },
      onColor: (color: string, cb: () => Promise<void>) => { if (executionId.current !== currentRunId) return; listenersRef.current.colors.push({ color, cb, lastMatch: false }); },
      onObstacle: (cb: () => Promise<void>) => { if (executionId.current !== currentRunId) return; listenersRef.current.obstacles.push({ cb, lastMatch: false }); },
      onDistance: (threshold: number, cb: () => Promise<void>) => { if (executionId.current !== currentRunId) return; listenersRef.current.distances.push({ threshold, cb, lastMatch: false }); },
      updateVariable: (name: string, val: any) => { if (executionId.current === currentRunId) { setMonitoredValues(prev => ({ ...prev, [name]: val })); } },
      stopProgram: async () => { controller.abort(); setIsRunning(false); }
    };
    try { 
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor; 
        await new AsyncFunction('robot', generatedCode)(robotApi); 
    } catch (e: any) { 
        if (e.message !== "Simulation aborted") {
            console.error("Script error:", e); 
            setIsRunning(false);
        }
    }
  }, [isRunning, generatedCode, activeChallenge, customObjects]);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    executionId.current++; 
    
    const builtIn = CHALLENGES.find(c => c.id === activeChallenge?.id);
    if (builtIn?.environmentObjects) setCustomObjects(builtIn.environmentObjects);
    else if (activeChallenge?.environmentObjects) setCustomObjects(activeChallenge.environmentObjects); 
    else setCustomObjects([]);

    const startX = activeChallenge?.startPosition?.x ?? 0; 
    const startZ = activeChallenge?.startPosition?.z ?? 0; 
    const startRot = activeChallenge?.startRotation ?? 180;
    
    const d = { ...robotRef.current, x: startX, y: 0, z: startZ, rotation: startRot, motorLeftSpeed: 0, motorRightSpeed: 0, isMoving: false, ledLeftColor: 'black', ledRightColor: 'black', tilt: 0, roll: 0, penDown: false, isTouching: false };
    robotRef.current = d; 
    setRobotState(d); 
    setIsRunning(false); 
    setChallengeSuccess(false); 
    setMonitoredValues({}); 
    setDrawings([]); 
    lastDrawingPos.current = null; 
    historyRef.current = { maxDistanceMoved: 0, touchedWall: false, detectedColors: [], totalRotation: 0 }; 
    listenersRef.current = { messages: {}, colors: [], obstacles: [], distances: [], variables: {} };
  }, [activeChallenge]);

  useEffect(() => {
    let interval: any; 
    if (isRunning) { 
      interval = setInterval(() => { 
        const current = robotRef.current; 
        const fV = (((current.motorLeftSpeed + current.motorRightSpeed) / 200.0)) * BASE_VELOCITY * (current.speed / 100.0); 
        const rV = (current.motorRightSpeed - current.motorLeftSpeed) * BASE_TURN_SPEED * 0.5 * (current.speed / 100.0); 
        const nr = current.rotation + rV; 
        const nx = current.x + Math.sin(nr * Math.PI / 180) * fV; 
        const nz = current.z + Math.cos(nr * Math.PI / 180) * fV; 
        
        const sd_next = calculateSensorReadings(nx, nz, nr, activeChallenge?.id, customObjects); 
        
        const finalX = sd_next.physicalHit ? current.x : nx;
        const finalZ = sd_next.physicalHit ? current.z : nz;
        const sd_final = calculateSensorReadings(finalX, finalZ, nr, activeChallenge?.id, customObjects);

        const next = { 
            ...current, 
            x: finalX, 
            z: finalZ, 
            y: current.y + (sd_final.y - current.y) * 0.3, 
            tilt: current.tilt + (sd_final.tilt - current.tilt) * 0.3, 
            roll: (current.roll || 0) + (sd_final.roll - (current.roll || 0)) * 0.3, 
            rotation: nr, 
            isTouching: sd_final.isTouching, 
            isMoving: Math.abs(fV) > 0.001 || Math.abs(rV) > 0.001, 
            sensorX: sd_final.sensorX, 
            sensorZ: sd_final.sensorZ 
        }; 
        
        robotRef.current = next; 
        setRobotState(next); 
        
        const currentHex = "#" + sd_final.rawDecimalColor.toString(16).padStart(6, '0').toUpperCase();
        
        listenersRef.current.colors.forEach(listener => {
            const isMatch = isColorClose(currentHex, listener.color);
            if (isMatch && !listener.lastMatch) listener.cb();
            listener.lastMatch = isMatch;
        });

        listenersRef.current.obstacles.forEach(listener => {
            if (sd_final.isTouching && !listener.lastMatch) listener.cb();
            listener.lastMatch = sd_final.isTouching;
        });

        listenersRef.current.distances.forEach(listener => {
            const isMatch = sd_final.distance < listener.threshold;
            if (isMatch && !listener.lastMatch) listener.cb();
            listener.lastMatch = isMatch;
        });

        if (sd_final.isTouching) historyRef.current.touchedWall = true; 
        historyRef.current.maxDistanceMoved = Math.max(historyRef.current.maxDistanceMoved, Math.sqrt(Math.pow(next.x - (activeChallenge?.startPosition?.x || 0), 2) + Math.pow(next.z - (activeChallenge?.startPosition?.z || 0), 2)) * 10); 
        if (!historyRef.current.detectedColors.includes(sd_final.color)) historyRef.current.detectedColors.push(sd_final.color); 
        historyRef.current.totalRotation = next.rotation - (activeChallenge?.startRotation ?? 180);
        
        if (next.penDown) { 
          const currPos: [number, number, number] = [next.x, next.y + 0.02, next.z]; 
          if (lastDrawingPos.current) { 
            const distSq = Math.pow(currPos[0] - lastDrawingPos.current[0], 2) + Math.pow(currPos[2] - lastDrawingPos.current[2], 2); 
            if (distSq > 0.001) { 
              setDrawings(prev => [...prev, { start: lastDrawingPos.current!, end: currPos, color: next.penColor }]); 
              lastDrawingPos.current = currPos; 
            } 
          } else { 
            lastDrawingPos.current = currPos; 
          } 
        } else { 
          lastDrawingPos.current = null; 
        }

        if (activeChallenge && typeof activeChallenge.check === 'function') { 
          if (activeChallenge.check(robotRef.current, robotRef.current, historyRef.current) && !challengeSuccess) {
            setChallengeSuccess(true);
            showToast("המשימה הושלמה!", "success");
          }
        } 
      }, TICK_RATE); 
    } 
    return () => clearInterval(interval);
  }, [isRunning, customObjects, activeChallenge, challengeSuccess, showToast]);

  const sensorReadings = useMemo(() => calculateSensorReadings(robotState.x, robotState.z, robotState.rotation, activeChallenge?.id, customObjects), [robotState.x, robotState.z, robotState.rotation, activeChallenge, customObjects]);
  
  const handleSetCameraMode = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    setZoomFactor(1.0); // Reset zoom on mode change
    if (!controlsRef.current) return;
    
    const controls = controlsRef.current;
    const camera = controls.object;
    controls.enabled = true;

    if (mode === 'HOME') {
        controls.target.set(0, 1, 0);
        camera.position.set(5, 8, 8);
    } else if (mode === 'TOP') {
        controls.target.set(robotState.x, robotState.y, robotState.z);
        camera.position.set(robotState.x, 15, robotState.z);
    }
    controls.update();
  }, [robotState]);
  
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (cameraMode === 'HOME') {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const camera = controls.object;
        const scale = direction === 'out' ? 1.1 : 0.9;
        
        const offset = new Vector3().subVectors(camera.position, controls.target);
        offset.multiplyScalar(scale);
        const newPos = new Vector3().addVectors(controls.target, offset);
        
        const dist = newPos.distanceTo(controls.target);
        if (dist > controls.minDistance && dist < controls.maxDistance) {
            camera.position.copy(newPos);
            controls.update();
        }
    } else { // TOP or FOLLOW
        const scale = direction === 'out' ? 1.1 : 0.9;
        setZoomFactor(prev => Math.max(0.25, Math.min(4, prev * scale)));
    }
  }, [cameraMode]);

  const handlePointerDown = (e: any) => {
    if (isPlacingRobot) {
        e.stopPropagation();
        setIsDragging(true);
        if (controlsRef.current) {
            controlsRef.current.enabled = false;
        }
    }
  };

  const handlePointerMove = (e: any) => {
    if (isPlacingRobot && isDragging) {
        e.stopPropagation();
        const d = { ...robotRef.current, x: e.point.x, z: e.point.z };
        robotRef.current = d;
        setRobotState(d);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
        setIsDragging(false);
        if (controlsRef.current && cameraMode === 'HOME') {
            controlsRef.current.enabled = true;
        }
    }
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden" dir="ltr">
      {toast && (<div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[500000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 border-2 ${toast.type === 'success' ? 'bg-green-600 border-green-400 text-white' : toast.type === 'error' ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>{toast.type === 'success' ? <Check size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}<span className="font-bold text-sm">{toast.message}</span></div>)}
      
      <header className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3"><Code2 className="w-6 h-6 text-blue-400" /><h1 className="text-lg font-bold hidden sm:block">מעבדת רובוטיקה וירטואלית</h1></div>
        
        <div className="flex gap-2 bg-slate-700/50 p-1.5 rounded-xl border border-slate-600">
            <button onClick={handleRun} disabled={isRunning || startBlockCount === 0} className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold transition-all transform active:translate-y-[2px] ${isRunning || startBlockCount === 0 ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_2px_0_0_rgba(21,128,61,1)] active:shadow-none'}`}><Flag size={20} fill={(isRunning || startBlockCount === 0) ? "none" : "currentColor"} /></button>
            <button onClick={handleReset} className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-[0_2px_0_0_rgba(185,28,28,1)] active:shadow-none active:translate-y-[2px] transition-all transform"><RotateCcw size={20} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center"></div>
            <button onClick={() => setIsRulerActive(!isRulerActive)} className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold transition-all transform active:translate-y-[2px] ${isRulerActive ? 'bg-blue-600 text-white shadow-[0_2px_0_0_rgba(30,58,138,1)]' : 'bg-slate-600 text-slate-300 hover:bg-slate-500 active:shadow-none'}`}><Ruler size={20} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center"></div>
            <button onClick={() => setProjectModal({ isOpen: true, mode: 'save' })} className="flex items-center justify-center w-10 h-10 bg-slate-600 text-slate-300 hover:bg-slate-500 rounded-lg font-bold transition-all transform active:translate-y-[2px]"><Save size={20} /></button>
            <button onClick={() => setProjectModal({ isOpen: true, mode: 'load' })} className="flex items-center justify-center w-10 h-10 bg-slate-600 text-slate-300 hover:bg-slate-500 rounded-lg font-bold transition-all transform active:translate-y-[2px]"><FolderOpen size={20} /></button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center"></div>
            <button onClick={handleShowPython} className="flex items-center justify-center w-10 h-10 bg-slate-600 text-slate-300 hover:bg-blue-500 hover:text-white rounded-lg font-bold transition-all transform active:translate-y-[2px]"><Terminal size={20} /></button>
        </div>

        <button onClick={() => setShowChallenges(true)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all active:translate-y-[2px] ${activeChallenge ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white hover:bg-slate-500'}`}><Trophy size={16} /> {activeChallenge ? activeChallenge.title : "אתגרים"}</button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-1/2 relative flex flex-col bg-white text-left text-sm border-r">
            <div className="bg-slate-50 border-b p-2 flex justify-between items-center" dir="rtl"><div className="flex items-center gap-2"><Code2 size={18} className="text-slate-400" /><span className="font-bold text-slate-600 uppercase tracking-tight">סביבת קוד</span></div></div>
            <div className="flex-1 relative">
                <BlocklyEditor 
                    ref={blocklyEditorRef} 
                    onCodeChange={useCallback((code, count) => { setGeneratedCode(code); setStartBlockCount(count); }, [])} 
                    visibleVariables={visibleVariables} 
                    onToggleVariable={useCallback((n) => setVisibleVariables(v => { const next = new Set(v); if (next.has(n)) next.delete(n); else next.add(n); return next; }), [])} 
                />
            </div>
        </div>

        <div className="w-1/2 relative bg-gray-900" style={{ cursor: isPlacingRobot ? 'move' : isPanning ? 'grab' : 'auto' }}>
            {visibleVariables.size > 0 && (<div className="absolute top-4 right-4 z-[50] flex flex-col gap-2">{Array.from(visibleVariables).map(varName => (<div key={varName} className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-orange-200 px-4 py-2 flex items-center gap-4 min-w-[120px]" dir="rtl"><span className="text-orange-600 font-bold text-sm">{varName}:</span><span className="text-slate-800 font-mono font-bold text-lg">{monitoredValues[varName] ?? 0}</span></div>))}</div>)}
            
            <SensorDashboard distance={sensorReadings.distance} isTouching={robotState.isTouching} gyroAngle={sensorReadings.gyro} tiltAngle={sensorReadings.tilt} detectedColor={sensorReadings.color} lightIntensity={sensorReadings.intensity} />
            
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 flex flex-col gap-2">
                <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-1">
                    <button onClick={() => handleSetCameraMode('HOME')} className={`p-2 rounded-lg transition-all ${cameraMode === 'HOME' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="תצוגת בית"><Home size={20}/></button>
                    <button onClick={() => handleSetCameraMode('TOP')} className={`p-2 rounded-lg transition-all ${cameraMode === 'TOP' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="מבט על"><Target size={20}/></button>
                    <button onClick={() => handleSetCameraMode('FOLLOW')} className={`p-2 rounded-lg transition-all ${cameraMode === 'FOLLOW' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="מצלמת עקיבה"><Eye size={20}/></button>
                </div>
                 <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-1">
                    <button onClick={() => handleZoom('in')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="התקרבות"><ZoomIn size={20}/></button>
                    <button onClick={() => handleZoom('out')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="התרחקות"><ZoomOut size={20}/></button>
                </div>
                 <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-1">
                    <button onClick={handleTogglePan} className={`p-2 rounded-lg transition-all ${isPanning ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="הזזת תצוגה"><Hand size={20}/></button>
                    <button onClick={handleTogglePlaceRobot} className={`p-2 rounded-lg transition-all ${isPlacingRobot ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="הזזת הרובוט"><Bot size={20}/></button>
                </div>
            </div>
            
            <Canvas shadows camera={{ position: [5, 8, 8], fov: 45 }}>
              <CameraUpdater mode={cameraMode} robotState={robotState} controlsRef={controlsRef} zoomFactor={zoomFactor} />
              <SimulationEnvironment 
                  challengeId={activeChallenge?.id} 
                  customObjects={customObjects} 
                  selectedObjectId={selectedObjectId} 
                  robotState={robotState}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
              />
              {drawings.map((seg, i) => ( <Line key={i} points={[seg.start, seg.end]} color={seg.color} lineWidth={4} /> ))}
              <Robot3D state={robotState} isPlacementMode={isPlacingRobot} />
              <OrbitControls ref={controlsRef} makeDefault minDistance={1.2} maxDistance={60} screenSpacePanning />
              {isRulerActive && <RulerTool />}
            </Canvas>
        </div>
      </div>

      <AppProjectModal 
        isOpen={projectModal.isOpen} 
        mode={projectModal.mode} 
        onClose={() => setProjectModal(p => ({ ...p, isOpen: false }))} 
        onSaveToFile={(n) => { 
          const blocklyXml = blocklyEditorRef.current?.saveWorkspace(); 
          const blob = new Blob([JSON.stringify({ name: n, blocklyXml, customObjects, activeChallengeId: activeChallenge?.id })], { type: 'application/json' }); 
          const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${n}.robocode`; link.click(); 
          setProjectModal(p => ({ ...p, isOpen: false })); 
        }} 
        onLoad={(d) => { 
          try { 
            const data = JSON.parse(d); 
            if (data.blocklyXml) blocklyEditorRef.current?.loadWorkspace(data.blocklyXml); 
            if (data.customObjects) setCustomObjects(data.customObjects); 
            if (data.activeChallengeId) { 
              const c = CHALLENGES.find(x => x.id === data.activeChallengeId); 
              if (c) setActiveChallenge(c); 
            } 
          } catch (e) { 
            blocklyEditorRef.current?.loadWorkspace(d); 
          } 
        }} 
      />
      <AppPythonCodeModal isOpen={isPythonModalOpen} code={pythonCode} onClose={() => setIsPythonModalOpen(false)} onCopy={() => { navigator.clipboard.writeText(pythonCode).then(() => showToast("קוד פייתון הועתק!", 'success')); }} />
      <Numpad isOpen={numpadConfig.isOpen} initialValue={numpadConfig.value} onConfirm={numpadConfig.onConfirm} onClose={() => setNumpadConfig(p => ({ ...p, isOpen: false }))} />
      
      {showChallenges && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-slate-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Trophy className="text-yellow-500" /> אתגרי תכנות</h2>
                    <button onClick={() => setShowChallenges(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CHALLENGES.map((challenge) => (
                            <button 
                                key={challenge.id}
                                onClick={() => { setActiveChallenge(challenge); setShowChallenges(false); handleReset(); }}
                                className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-105 active:scale-95 flex flex-col gap-2 ${activeChallenge?.id === challenge.id ? 'border-yellow-500 bg-yellow-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-200 shadow-sm'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-600' : challenge.difficulty === 'Medium' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                        {challenge.difficulty}
                                    </span>
                                    {activeChallenge?.id === challenge.id && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                                </div>
                                <h3 className="font-bold text-slate-800">{challenge.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2">{challenge.description}</p>
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
