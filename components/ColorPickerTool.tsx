 
import React, { useState, useCallback, useMemo } from 'react';
import { Vector3, Mesh, Color, Raycaster, Object3D, Group } from 'three';
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
            // CRITICAL: Use recursive: true to find meshes inside the nested object groups.
            // We target the specific environment group to avoid hitting problematic objects (robot, lines, grid).
            const intersects = pickerRaycaster.intersectObject(envGroupRef.current, true);
            
            // Find the first valid mesh intersection that has a color-capable material
            for (const hit of intersects) {
                const object = hit.object;
                
                // Only sample from Meshes to avoid errors with undefined geometries
                if (object instanceof Mesh) {
                    const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                    
                    // Verify material and color property existence before access
                    if (mat && 'color' in mat && (mat.color instanceof Color)) {
                        const hex = "#" + mat.color.getHexString().toUpperCase();
                        setCursorPos(hit.point.clone());
                        return hex;
                    }
                }
            }
        } catch (err) {
            // Silently catch raycasting errors to prevent app crashes if a non-standard object is encountered
            console.debug("Raycasting sample failed:", err);
        }

        return null;
    }, [pickerRaycaster, camera, mouse, envGroupRef]);

    return (
        <group>
            {/* 
               The capture plane stays slightly above ground (y=0.05) to catch all mouse events.
               It acts as a proxy for the entire stage when the picker tool is active.
            */}
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
                    {/* Visual dropper circle on the ground */}
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} toneMapped={false} />
                    </mesh>
                    
                    {/* Tooltip label above the sampling point */}
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
