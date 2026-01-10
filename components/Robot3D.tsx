import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
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

// קומפוננטת עזר למניעת חזרתיות ובדיקת תקינות
const SafeGroup = ({ children, ...props }: any) => (
    <group {...props} layers={ROBOT_LAYER || 0}>
        {children}
    </group>
);

const LegoWheel = ({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) => {
  return (
    <SafeGroup position={position} rotation={rotation || [0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow layers={ROBOT_LAYER || 0}>
        <cylinderGeometry args={[0.6, 0.6, 0.4, 40]} />
        <meshStandardMaterial color={THEME.black} roughness={0.8} />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI/2, 0, 0]} position={[0, (i - 2) * 0.08, 0]} layers={ROBOT_LAYER || 0}>
             <torusGeometry args={[0.6, 0.02, 16, 48]} />
             <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </SafeGroup>
  );
};

const CasterWheel = ({ position }: { position: [number, number, number] }) => (
    <SafeGroup position={position}>
      <mesh castShadow layers={ROBOT_LAYER || 0}><sphereGeometry args={[0.2, 32, 32]} /><meshStandardMaterial color="#D0D0D0" metalness={0.9} roughness={0.1} /></mesh>
    </SafeGroup>
);

const RobotPen = ({ position, isDown, color }: { position: [number, number, number], isDown?: boolean, color?: string }) => {
    const groupRef = useRef<Group>(null);
    useFrame(() => { 
      if (groupRef.current && groupRef.current.position) { 
        const targetY = isDown ? -0.4 : 0.2; 
        groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.1; 
      } 
    });
    return (
        <group position={position}>
            <group ref={groupRef}>
                <mesh layers={ROBOT_LAYER || 0}><cylinderGeometry args={[0.08, 0.08, 1, 16]} /><meshStandardMaterial color={THEME.lightGrey} /></mesh>
            </group>
        </group>
    );
};

const Robot3D: React.FC<Robot3DProps> = ({ state, isPlacementMode }) => {
  const groupRef = useRef<Group>(null);
  
  useFrame(() => {
    // הגנה משולשת: בודקים שהרף קיים, שיש לו פוזיציה, ושהסטייט תקין
    if (groupRef.current && groupRef.current.position && state) {
      const x = Number.isFinite(state.x) ? state.x : 0;
      const y = Number.isFinite(state.y) ? state.y : 0;
      const z = Number.isFinite(state.z) ? state.z : 0;
      
      const rot = ((state.rotation || 0) * Math.PI) / 180;

      groupRef.current.position.set(x, y + 0.6, z);
      groupRef.current.rotation.y = rot;
    }
  });

  if (!state) return null;

  return (
    <group ref={groupRef}>
        <mesh castShadow layers={ROBOT_LAYER || 0}>
            <boxGeometry args={[1.45, 0.6, 2.15]} />
            <meshStandardMaterial color={THEME.yellow} />
        </mesh>
        <LegoWheel position={[-0.95, 0, 0]} />
        <LegoWheel position={[0.95, 0, 0]} />
        <CasterWheel position={[0, -0.4, -0.8]} />
        <RobotPen position={[0, 0.1, -0.6]} isDown={state.penDown} color={state.penColor} />
    </group>
  );
};

export default Robot3D;
