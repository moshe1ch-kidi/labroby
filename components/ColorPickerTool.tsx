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

        // תיקון 1: הסרתי את הגישה הישירה ל-position.toArray() שגרמה לקריסה
        if (intersects.length > 0) {
            console.log(`ColorPickerTool: Hits found: ${intersects.length}`);
        }
        
        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            
            // הגנה: וודא שהאובייקט קיים
            if (!object) continue;

            // Skip helper objects and robot parts immediately
            if (
                object.name === 'picker-interaction-plane' || 
                object.name === 'picker-visual-indicator' || 
                object.name === 'grid-helper' ||
                object.userData?.isRobotPart
            ) {
                continue;
            }

            // Ground plane logic
            if (object.name === 'ground-plane') {
                if (object instanceof Mesh && object.material) {
                    const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                    // תיקון 2: בדיקה בטוחה של צבע
                    if ('color' in mat && mat.color instanceof Color) {
                        groundPlaneHit = { 
                            color: "#" + mat.color.getHexString().toUpperCase(), 
                            point: hit.point.clone() 
                        };
                    }
                }
                continue; 
            }

            // Other meshes
            if (object instanceof Mesh && object.material) {
                const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                
                if ('color' in mat && mat.color instanceof Color) {
                    const hex = "#" + mat.color.getHexString().toUpperCase();
                    
                    // תיקון 3: הוספת בדיקת בטיחות לאופסיטי (Opacity)
                    const opacity = (mat as any).opacity !== undefined ? (mat as any).opacity : 1;

                    if (hex !== '#FFFFFF' && opacity > 0) {
                        setCursorPos(hit.point.clone());
                        return hex; 
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
                position={[0, 0.06, 0]} // הגבהתי מעט כדי למנוע התנגשות ויזואלית
                onPointerMove={handlePointerMove}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {cursorPos && (
                <group position={[cursorPos.x, 0.07, cursorPos.z]}>
                    <mesh name="picker-visual-indicator" rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} toneMapped={false} />
                    </mesh>

                    <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
                         <div className="bg-pink-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-2xl border-2 border-white/50" dir="rtl">
                            לחץ לדגימת צבע
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;
