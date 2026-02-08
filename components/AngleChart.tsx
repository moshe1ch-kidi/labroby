
import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface AngleChartProps {
    isOpen: boolean;
    robotPos: { x: number, z: number };
}

const AngleChart: React.FC<AngleChartProps> = ({ isOpen, robotPos }) => {
    if (!isOpen) return null;

    // Compass directions: 0 North (-Z), 90 East (+X), 180 South (+Z), 270 West (-X)
    const labels = [
        { angle: 0, text: '0°', color: '#ff3b3b', sub: 'N' },
        { angle: 90, text: '90°', color: '#3b82f6', sub: 'E' },
        { angle: 180, text: '180°', color: '#3b82f6', sub: 'S' },
        { angle: 270, text: '270°', color: '#3b82f6', sub: 'W' }
    ];

    const ticks = useMemo(() => {
        const t = [];
        for (let i = 0; i < 360; i += 15) {
            if (i % 90 === 0) continue;
            t.push(i);
        }
        return t;
    }, []);

    return (
        <group position={[robotPos.x, 0.05, robotPos.z]}>
            {/* Primary Compass Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.45, 3.55, 64]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
            </mesh>
            
            {/* Secondary Outer Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.8, 3.82, 64]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} />
            </mesh>

            {/* Labels for 0, 90, 180, 270 */}
            {labels.map((label) => {
                const rad = (label.angle * Math.PI) / 180;
                const lx = Math.sin(rad) * 4.4;
                const lz = -Math.cos(rad) * 4.4;
                
                return (
                    <group key={label.angle} position={[lx, 0, lz]}>
                        <Text
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={0.6}
                            color={label.color}
                            anchorX="center"
                            anchorY="middle"
                            depthOffset={-2}
                        >
                            {label.text}
                        </Text>
                        {/* FIX: Replaced 'opacity' and 'transparent' props with 'fillOpacity' which is supported by the Text component */}
                        <Text
                            position={[0, 0, 0.5]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={0.3}
                            color={label.color}
                            fillOpacity={0.6}
                            anchorX="center"
                            anchorY="middle"
                            depthOffset={-2}
                        >
                            {label.sub}
                        </Text>
                    </group>
                );
            })}

            {/* Small Degree Ticks */}
            {ticks.map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const lx = Math.sin(rad) * 3.5;
                const lz = -Math.cos(rad) * 3.5;
                return (
                    <mesh 
                        key={angle} 
                        position={[lx, 0, lz]} 
                        rotation={[0, -rad, 0]}
                    >
                        <boxGeometry args={[0.02, 0.01, 0.4]} />
                        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
                    </mesh>
                );
            })}

            {/* Red North Pointer to 0 degrees */}
            <mesh position={[0, 0, -2.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.2, 0.8, 4]} />
                <meshBasicMaterial color="#ff3b3b" />
            </mesh>

            {/* Subtle Crosshair center lines */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.02, 6.8]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <planeGeometry args={[0.02, 6.8]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
            </mesh>
        </group>
    );
};

export default AngleChart;
