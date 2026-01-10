import React, { useRef } from 'react';
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

const LegoWheel = ({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) => {
  return (
    <group position={position} rotation={rotation || [0, 0, Math.PI / 2]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
      <mesh castShadow receiveShadow layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
        <cylinderGeometry args={[0.6, 0.6, 0.4, 40]} />
        <meshStandardMaterial color={THEME.black} roughness={0.8} />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI/2, 0, 0]} position={[0, (i - 2) * 0.08, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
             <torusGeometry args={[0.6, 0.02, 16, 48]} />
             <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <group position={[0, 0, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
         <mesh layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
            <cylinderGeometry args={[0.35, 0.35, 0.42, 32]} />
            <meshStandardMaterial color={THEME.cyan} roughness={0.3} />
         </mesh>
         {[1, -1].map((side) => (
            <group key={side} position={[0, side * 0.211, 0]} rotation={[side === 1 ? 0 : Math.PI, 0, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
                <mesh rotation={[Math.PI/2, 0, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><ringGeometry args={[0.25, 0.35, 32]} /><meshStandardMaterial color={THEME.cyan} /></mesh>
                <mesh rotation={[Math.PI/2, 0, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.6, 0.1, 0.01]} /><meshStandardMaterial color={THEME.cyan} /></mesh>
                <mesh rotation={[Math.PI/2, 0, Math.PI/2]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.6, 0.1, 0.01]} /><meshStandardMaterial color={THEME.cyan} /></mesh>
                <mesh position={[0, 0.001, 0]} rotation={[Math.PI/2, 0, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><circleGeometry args={[0.06, 16]} /><meshStandardMaterial color="#111" /></mesh>
            </group>
         ))}
      </group>
    </group>
  );
};

const CasterWheel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
      <mesh castShadow layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><sphereGeometry args={[0.2, 32, 32]} /><meshStandardMaterial color="#D0D0D0" metalness={0.9} roughness={0.1} /></mesh>
      <group position={[0, 0.1, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
        <mesh position={[0, 0.05, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><cylinderGeometry args={[0.22, 0.22, 0.2, 32]} /><meshStandardMaterial color={THEME.cyan} roughness={0.5} /></mesh>
        <mesh position={[0, 0.3, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.25, 0.4, 0.35]} /><meshStandardMaterial color={THEME.cyan} roughness={0.5} /></mesh>
      </group>
    </group>
  );
};

const LegoLight = ({ position, color }: { position: [number, number, number], color?: string }) => {
  const c = (color || '#000000').toLowerCase();
  const isOff = c === 'black' || c === '#000000' || c === '#000';
  const displayColor = isOff ? '#333' : c;
  const intensity = isOff ? 0 : 3;
  return (
    <group position={position} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
      <mesh position={[0, 0.25, 0]} castShadow layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.25, 0.3, 0.25]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} metalness={0.1} /></mesh>
      <mesh position={[0, 0.25, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.18, 0.22, 0.18]} /><meshStandardMaterial color={displayColor} emissive={displayColor} emissiveIntensity={intensity} toneMapped={false} /></mesh>
      {!isOff && <pointLight position={[0, 0.3, 0]} color={displayColor} intensity={1.5} distance={3} decay={2} />}
    </group>
  );
};

const RobotPen = ({ position, isDown, color }: { position: [number, number, number], isDown?: boolean, color?: string }) => {
    const groupRef = useRef<Group>(null);
    useFrame(() => { 
      if (groupRef.current) { 
        const targetY = isDown ? -0.4 : 0.2; 
        groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.1; 
      } 
    });
    return (
        <group position={position} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
             <mesh position={[0, 0.2, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.3, 0.4, 0.3]} /><meshStandardMaterial color={THEME.darkGrey} /></mesh>
            <group ref={groupRef} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
                <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} castShadow layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><cylinderGeometry args={[0.08, 0.08, 1, 16]} /><meshStandardMaterial color={THEME.lightGrey} /></mesh>
                <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><coneGeometry args={[0.08, 0.2, 16]} /><meshStandardMaterial color={color || '#000'} /></mesh>
                <mesh position={[0, 0.3, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><cylinderGeometry args={[0.1, 0.1, 0.4, 16]} /><meshStandardMaterial color={color || '#000'} /></mesh>
            </group>
        </group>
    );
};

const TouchSensor = ({ position, pressed }: { position: [number, number, number], pressed?: boolean }) => {
    const plungerPos = pressed ? -0.1 : 0.2;
    return (
        <group position={position} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
            <mesh position={[0, 0.2, -0.2]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.4, 0.1, 0.4]} /><meshStandardMaterial color={THEME.magenta} /></mesh>
            <group position={[0, -0.1, 0]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}>
                <mesh castShadow layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry args={[0.45, 0.4, 0.4]} /><meshStandardMaterial color={THEME.white} roughness={0.2} /></mesh>
                <mesh position={[0, 0.15, -0.15]} layers={ROBOT_LAYER} userData={{ isRobotPart: true }}><boxGeometry
