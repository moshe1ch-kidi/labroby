
import React, { useState, useCallback } from 'react';
import { Vector3, Mesh, Color } from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);
    const { raycaster, scene, camera, mouse } = useThree();

    const sampleColorUnderMouse = useCallback(() => {
        raycaster.setFromCamera(mouse, camera);
        // We filter for objects that standard meshes to avoid picking line segments or helper objects
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            
            // Critical Safety: Skip any object that isn't a standard mesh or is a robot part/helper
            if (
                !(object instanceof Mesh) ||
                object.name === 'picker-interaction-plane' || 
                object.name === 'picker-visual-indicator' || 
                object.name === 'grid-helper' ||
                object.userData?.isRobotPart ||
                object.userData?.skipPicker
            ) {
                continue;
            }

            if (object.name === 'ground-plane') {
                const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                if (mat && 'color' in mat) {
                    groundPlaneHit = { color: "#" + (mat.color as Color).getHexString().toUpperCase(), point: hit.point };
                }
                continue;
            }

            // Standard object hit (Walls, Paths, etc)
            const mat = Array.isArray(object.material) ? object.material[0] : object.material;
            if (mat && 'color' in mat && 'opacity' in mat) {
                const hex = "#" + (mat.color as Color).getHexString().toUpperCase();
                // Prioritize non-white, non-transparent objects
                if (hex !== '#FFFFFF' && (mat.opacity as number) > 0) {
                    setCursorPos(hit.point);
                    return hex;
                }
            }
        }

        if (groundPlaneHit) {
            setCursorPos(groundPlaneHit.point);
            return groundPlaneHit.color;
        }
        
        return "#FFFFFF";
    }, [raycaster, scene, camera, mouse]);

    return (
        <group>
            <mesh 
                name="picker-interaction-plane"
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.05, 0]} 
                onPointerMove={(e) => { e.stopPropagation(); const h = sampleColorUnderMouse(); if (h) onColorHover(h); }}
                onPointerOut={() => setCursorPos(null)}
                onClick={(e) => { e.stopPropagation(); const h = sampleColorUnderMouse(); if (h) onColorSelect(h); }}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {cursorPos && (
                <group position={cursorPos}>
                    <mesh name="picker-visual-indicator" rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} toneMapped={false} />
                    </mesh>
                    <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
                         <div className="bg-pink-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-2xl border-2 border-white/50 animate-pulse" dir="rtl">
                            לחץ לדגימת צבע מהמסלול
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;
