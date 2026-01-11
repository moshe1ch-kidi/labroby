
import React, { useState, useCallback, useMemo } from 'react';
import { Vector3, Mesh, Color, Raycaster, Group } from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
    envGroupRef: React.RefObject<Group>;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect, envGroupRef }) => {
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);
    const { camera, mouse } = useThree();
    
    const pickerRaycaster = useMemo(() => new Raycaster(), []);

    const sampleColorUnderMouse = useCallback(() => {
        if (!mouse || !camera || !envGroupRef.current) return null;
        
        pickerRaycaster.setFromCamera(mouse, camera);
        
        try {
            // We manually collect pickable meshes to avoid raycasting into groups 
            // that might contain problematic objects like Line2 (drei Line).
            const pickableMeshes: Mesh[] = [];
            envGroupRef.current.traverse((child) => {
                // EXTREMELY DEFENSIVE: only standard Meshes with position attributes
                if (child instanceof Mesh && 
                    child.geometry && 
                    child.geometry.attributes && 
                    child.geometry.attributes.position) {
                    pickableMeshes.push(child);
                }
            });

            // Perform intersection on the sanitized list of meshes
            const intersects = pickerRaycaster.intersectObjects(pickableMeshes, false);
            
            for (const hit of intersects) {
                const object = hit.object as Mesh;
                const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                
                // Double check material property existence
                if (mat && 'color' in mat && (mat.color instanceof Color)) {
                    const hex = "#" + mat.color.getHexString().toUpperCase();
                    setCursorPos(hit.point.clone());
                    return hex;
                }
            }
        } catch (err) {
            console.warn("Picker error bypassed safely:", err);
        }

        return null;
    }, [pickerRaycaster, camera, mouse, envGroupRef]);

    return (
        <group>
            <mesh 
                name="picker-capture-plane"
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.05, 0]} 
                onPointerMove={(e) => { 
                    e.stopPropagation(); 
                    const h = sampleColorUnderMouse(); 
                    if (h) onColorHover(h); 
                }}
                onPointerOut={() => setCursorPos(null)}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    const h = sampleColorUnderMouse(); 
                    if (h) onColorSelect(h); 
                }}
            >
                <planeGeometry args={[2000, 2000]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {cursorPos && (
                <group position={[cursorPos.x, cursorPos.y + 0.01, cursorPos.z]}>
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} toneMapped={false} />
                    </mesh>
                    
                    <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
                         <div className="bg-pink-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-2xl border-2 border-white/50 animate-pulse select-none pointer-events-none" dir="rtl">
                            לחץ לדגימת צבע מהמסלול
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;
