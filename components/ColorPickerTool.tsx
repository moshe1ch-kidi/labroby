
import React, { useState, useCallback, useMemo } from 'react';
import { Vector3, Mesh, Color, Raycaster, Object3D } from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);
    const { scene, camera, mouse } = useThree();
    
    const pickerRaycaster = useMemo(() => new Raycaster(), []);

    const sampleColorUnderMouse = useCallback(() => {
        if (!mouse || !camera || !scene) return null;
        
        // מעדכנים את הקרן לפי מיקום העכבר
        pickerRaycaster.setFromCamera(mouse, camera);
        
        // אוספים את כל האובייקטים בסצנה שהם חלק מהסביבה וניתנים לדגימה
        const pickableObjects: Object3D[] = [];
        scene.traverse((obj) => {
            if (obj instanceof Mesh && obj.userData.isEnvironment === true) {
                pickableObjects.push(obj);
            }
        });

        // מבצעים בדיקת פגיעה רק מול האובייקטים שסיננו
        const intersects = pickerRaycaster.intersectObjects(pickableObjects, false);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            const object = hit.object as Mesh;
            const mat = Array.isArray(object.material) ? object.material[0] : object.material;
            
            if (mat && 'color' in mat) {
                const hex = "#" + (mat.color as Color).getHexString().toUpperCase();
                setCursorPos(hit.point.clone());
                return hex;
            }
        }

        return null;
    }, [pickerRaycaster, scene, camera, mouse]);

    return (
        <group>
            {/* משטח שקוף ענק שתופס את תנועות העכבר בלבד */}
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
                <planeGeometry args={[500, 500]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {cursorPos && (
                <group position={cursorPos}>
                    {/* סימון ויזואלי של נקודת הדגימה */}
                    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
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
