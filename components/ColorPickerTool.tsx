import React, { useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { Vector3, Mesh, Color } from 'three';
import { useThree } from '@react-three/fiber';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);
    const { raycaster, scene, camera, mouse } = useThree();

    const sampleColorUnderMouse = useCallback(() => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            
            if (
                object.name === 'picker-interaction-plane' || 
                object.name === 'picker-visual-indicator' || 
                object.name === 'grid-helper' ||
                object.userData?.isRobotPart
            ) {
                continue;
            }

            if (object.name === 'ground-plane') {
                if (object instanceof Mesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const mat of materials) {
                        if (mat.color && mat.color instanceof Color) {
                            groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point };
                            break;
                        }
                    }
                }
                continue;
            }

            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                for (const mat of materials) {
                    if (mat.color && mat.color instanceof Color && mat.opacity > 0) {
                        const hex = "#" + mat.color.getHexString().toUpperCase();
                        
                        if (hex !== '#FFFFFF' && hex !== '#000000' && mat.opacity > 0.1) {
                            setCursorPos(hit.point);
                            return hex;
                        } else {
                            continue;
                        }
                    }
                }
            }
        }

        if (groundPlaneHit) {
            setCursorPos(groundPlaneHit.point);
            return groundPlaneHit.color;
        }
        
        return "#FFFFFF";
    }, [raycaster, scene, camera, mouse]);

    const handlePointerMove = (e: any) => {
        e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex) onColorHover(hex);
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex) onColorSelect(hex);
    };

    const handlePointerOut = () => {
        setCursorPos(null);
    };

    return (
        <group>
            <mesh 
                name="picker-interaction-plane"
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.05, 0]} 
                onPointerMove={handlePointerMove}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {cursorPos && (
                <group position={[cursorPos.x, cursorPos.y, cursorPos.z]}>
                    <mesh name="picker-visual-indicator" rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} toneMapped={false} />
                    </mesh>

                    <Html position={[0, 0.4, 0]} center>
                         <div 
                            className="bg-pink-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-2xl border-2 border-white/50 animate-pulse" 
                            dir="rtl"
                            style={{ pointerEvents: 'none' }}
                         >
                            לחץ לדגימת צבע מהמסלול
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;
