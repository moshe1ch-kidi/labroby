import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RobotState, ROBOT_LAYER } from '../types';

interface Robot3DProps {
  state: RobotState;
  isPlacementMode?: boolean;
}

const THEME = {
  yellow: '#FACC15',
  white: '#FFFFFF',
  cyan: '#22D3EE',
  magenta: '#D946EF',
  black: '#171717',
  darkGrey: '#374151',
  lightGrey: '#9CA3AF'
};

// קומפוננטת גלגל פשוטה ובטוחה
const SimpleWheel = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} rotation={[0, 0, Math.PI / 2]} layers={ROBOT_LAYER}>
    <cylinderGeometry args={[0.6, 0.6, 0.4, 32]} />
    <meshStandardMaterial color={THEME.black} />
  </mesh>
);

const Robot3D: React.FC<Robot3DProps> = ({ state, isPlacementMode }) => {
  const mainGroupRef = useRef<THREE.Group>(null);
  const penRef = useRef<THREE.Group>(null);

  useFrame(() => {
    // בדיקה מחמירה שהאובייקטים קיימים לפני עדכון
    if (!mainGroupRef.current || !state) return;

    // הגנה מפני ערכי NaN או undefined
    const x = state.x ?? 0;
    const y = state.y ?? 0;
    const z = state.z ?? 0;
    const rotY = ((state.rotation ?? 0) * Math.PI) / 180;

    // עדכון מיקום וסיבוב
    mainGroupRef.current.position.set(x, y + 0.05, z);
    mainGroupRef.current.rotation.set(0, rotY, 0);

    // עדכון אנימציית העט בנפרד עם בדיקה
    if (penRef.current) {
      const targetY = state.penDown ? -0.4 : 0.2;
      penRef.current.position.y += (targetY - penRef.current.position.y) * 0.1;
    }
  });

  // מניעת רינדור אם אין state
  if (!state) return null;

  return (
    <group ref={mainGroupRef}>
      {/* גוף הרובוט */}
      <group position={[0, 0.5, 0]}>
        {/* שכבת בסיס */}
        <mesh castShadow receiveShadow layers={ROBOT_LAYER}>
          <boxGeometry args={[1.5, 0.6, 2.15]} />
          <meshStandardMaterial color={THEME.yellow} />
        </mesh>

        {/* פלטה עליונה */}
        <mesh position={[0, 0.4, 0]} layers={ROBOT_LAYER}>
          <boxGeometry args={[1.5, 0.1, 2.2]} />
          <meshStandardMaterial color={THEME.white} />
        </mesh>

        {/* פלטה תחתונה */}
        <mesh position={[0, -0.4, 0]} layers={ROBOT_LAYER}>
          <boxGeometry args={[1.5, 0.1, 2.2]} />
          <meshStandardMaterial color={THEME.white} />
        </mesh>
      </group>

      {/* גלגלים */}
      <SimpleWheel position={[-0.9, 0.5, 0]} />
      <SimpleWheel position={[0.9, 0.5, 0]} />

      {/* עט */}
      <group position={[0, 0.5, -0.6]}>
         <group ref={penRef}>
            <mesh layers={ROBOT_LAYER}>
              <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
              <meshStandardMaterial color={state.penColor || THEME.black} />
            </mesh>
         </group>
      </group>

      {/* מצב הצבה - עיגול זוהר מתחת לרובוט */}
      {isPlacementMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[1.5, 1.6, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default Robot3D;
