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
        // עדכון ה-Raycaster לפי מיקום העכבר הנוכחי
        raycaster.setFromCamera(mouse, camera);
        
        // סינון אובייקטים - אנחנו רוצים רק מה שניתן לדגום ממנו צבע
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length === 0) return "#FFFFFF";

        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            
            // הגנה בסיסית: וודא שהאובייקט והמיקום קיימים
            if (!object || !hit.point) continue;

            // התעלמות מאובייקטים טכניים או חלקי הרובוט
            if (
                object.name === 'picker-interaction-plane' || 
                object.name === 'picker-visual-indicator' || 
                object.name === 'grid-helper' ||
                object.userData?.isRobotPart
            ) {
                continue;
            }

            // לוגיקה עבור רצפת הסימולטור
            if (object.name === 'ground-plane') {
                if (object instanceof Mesh && object.material) {
                    const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                    // בדיקה בטוחה שהחומר מכיל צבע
                    if (mat && 'color' in mat && mat.color instanceof Color) {
                        groundPlaneHit = { 
                            color: "#" + mat.color.getHexString().toUpperCase(), 
                            point: hit.point.clone() 
                        };
                    }
                }
                continue; 
            }

            // לוגיקה עבור אובייקטים אחרים (קוביות, מכשולים וכו')
            if (object instanceof Mesh && object.material) {
                const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                
                if (mat && 'color' in mat && mat.color instanceof Color) {
                    const hex = "#" + mat.color.getHexString().toUpperCase();
                    
                    // בדיקת שקיפות כדי לא לדגום אובייקטים בלתי נראים
                    const opacity = (mat as any).opacity !== undefined ? (mat as any).opacity : 1;

                    // אם מצאנו צבע שאינו לבן טהור (בד"כ רקע) והאובייקט נראה לעין
                    if (hex !== '#FFFFFF' && opacity > 0) {
                        setCursorPos(hit.point.clone());
                        return hex; 
                    }
                }
            }
        }

        // אם לא מצאנו אובייקט ספציפי אבל פגענו ברצפה
        if (groundPlaneHit) {
            setCursorPos(groundPlaneHit.point);
            return groundPlaneHit.color;
        }
        
        return "#FFFFFF";
    }, [raycaster, scene, camera, mouse]);

    const handlePointerMove = (e: any) => {
        // מניעת בעבוע האירוע כדי לא להפריע למצלמה
        if (e.stopPropagation) e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex) onColorHover(hex);
    };

    const handleClick = (e: any) => {
        if (e.stopPropagation) e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex) onColorSelect(hex);
    };

    const handlePointerOut = () => {
        setCursorPos(null);
    };

    return (
        <group>
            {/* משטח שקוף ענק שתופס את כל הלחיצות כשהכלי פעיל */}
            <mesh 
                name="picker-interaction-plane"
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.05, 0]} 
                onPointerMove={handlePointerMove}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                <planeGeometry args={[500, 500]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* הסמן הויזואלי (הטבעת הוורודה והטקסט) */}
            {cursorPos && (
                <group position={[cursorPos.x, 0.07, cursorPos.z]}>
                    <mesh name="picker-visual-indicator" rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.9} toneMapped={false} />
                    </mesh>

                    <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
                         <div className="bg-pink-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-2xl border-2 border-white/50 select-none" dir="rtl">
                            לחץ לדגימת צבע
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;
