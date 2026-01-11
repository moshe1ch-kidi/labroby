 import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// ... שאר ה-imports של ה-icons נשארים זהים
import * as THREE from 'three';
import BlocklyEditor, { BlocklyEditorHandle } from './components/BlocklyEditor';
import Robot3D from './components/Robot3D';
import SimulationEnvironment from './components/Environment';
import { RobotState, CustomObject, ContinuousDrawing, SimulationHistory, CameraMode, EditorTool } from './types';
import RulerTool from './components/RulerTool';
import ColorPickerTool from './components/ColorPickerTool'; 
import CameraManager from './components/CameraManager';
import { ThreeEvent } from '@react-three/fiber';

// --- קבועים ולוגיקה עזרית (נשארים ללא שינוי) ---
const TICK_RATE = 16; 
const CANONICAL_COLOR_MAP: Record<string, string> = {
    'red': '#EF4444', 'green': '#22C55E', 'blue': '#3B82F6',
    'yellow': '#EAB308', 'orange': '#F97316', 'purple': '#A855F7',
    'cyan': '#06B6D4', 'magenta': '#EC4899', 'black': '#000000', 'white': '#FFFFFF',
};

// ... פונקציות עזר כמו normalizeAngle, getSurfaceHeightAt וכו' נשארות כפי שהיו בקוד שלך

const App: React.FC = () => {
  // --- States ---
  const [isRunning, setIsRunning] = useState(false);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [editorTool, setEditorTool] = useState<EditorTool>('NONE');
  const [customObjects, setCustomObjects] = useState<CustomObject[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  
  // Ref לניהול הרובוט
  const robotRef = useRef<RobotState>({ 
    x: 0, y: 0, z: 0, rotation: 180, tilt: 0, roll: 0, 
    speed: 100, motorLeftSpeed: 0, motorRightSpeed: 0, 
    ledLeftColor: 'black', ledRightColor: 'black', 
    isMoving: false, isTouching: false, penDown: false, penColor: '#000000' 
  });
  const [robotState, setRobotState] = useState<RobotState>(robotRef.current);
  const isPlacingRobot = useRef(false);

  // --- תיקון 1: ניהול אירועי עכבר ב-Canvas ---
  // הוספת מנגנון שמוודא שאירועים לא ייחסמו כשהדוגם פעיל
  const handlePointerDown = useCallback((e: ThreeEvent<MouseEvent>) => {
    // אם הדוגם פעיל - אל תעצור את האירוע ואל תזיז את הרובוט!
    if (isColorPickerActive) return;

    e.stopPropagation(); 
    if (editorTool === 'ROBOT_MOVE') {
      isPlacingRobot.current = true;
      const point = e.point;
      // לוגיקה קיימת של עדכון מיקום הרובוט...
    }
  }, [editorTool, isColorPickerActive]);

  const handlePointerMove = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (isColorPickerActive) return; // חשוב למנוע הפרעה לדוגם

    if (isPlacingRobot.current && editorTool === 'ROBOT_MOVE') {
      e.stopPropagation();
      // לוגיקה קיימת של גרירת הרובוט...
    }
  }, [editorTool, isColorPickerActive]);

  const handlePointerUp = useCallback(() => {
    isPlacingRobot.current = false;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden">
      {/* UI Overlay - כפתורים וכו' */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         <button 
           onClick={() => setIsColorPickerActive(!isColorPickerActive)}
           className={`p-2 rounded ${isColorPickerActive ? 'bg-pink-600' : 'bg-slate-700'}`}
         >
           דוגם צבע
         </button>
      </div>

      {/* אזור ה-3D */}
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

          {/* תיקון 2: הוספת ה-ColorPickerTool כרכיב לוגי בלבד */}
          <ColorPickerTool 
            isActive={isColorPickerActive} 
            onColorSelect={(hex) => {
              console.log("Selected Color:", hex);
              // כאן אפשר לעדכן את Blockly או משתנה אחר
              setIsColorPickerActive(false);
            }} 
          />

          <OrbitControls 
            makeDefault 
            // השבתת המצלמה כשהרובוט נגרר
            enabled={!isPlacingRobot.current && !isColorPickerActive} 
          />
        </Canvas>
      </div>

      {/* עורך Blockly */}
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
