import React, { useState, useCallback, useRef } from 'react';
import { Html } from '@react-three/drei';
import { Vector3, Mesh, Color, Group } from 'three';
import { useThree } from '@react-three/fiber';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    // שינוי 1: שמירת המיקום כערכים פשוטים ולא כאובייקט Vector3
    const [indicatorPos, setIndicatorPos] = useState<{x: number, y: number, z: number} | null>(null);
    const { raycaster, scene, camera, mouse } = useThree();
    const groupRef = useRef<Group>(null);

    const sampleColorUnderMouse = useCallback(() => {
        if (!camera || !mouse) return "#FFFFFF";

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length === 0) return "#FFFFFF";

        let groundPlaneHit: { color: string, x: number, y: number, z: number } | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            if (!object || !hit.point) continue;

            // התעלמות מאובייקטים טכניים
            if (
                object.name.includes('picker') || 
                object.name.includes('helper') ||
                object.userData?.isRobotPart
            ) continue;

            // דגימה מהרצפה
            if (object.name === 'ground-plane' && object instanceof Mesh) {
                const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                if (mat && 'color' in mat) {
                    groundPlaneHit = { 
                        color: "#" + (mat.color as Color).getHexString().toUpperCase(), 
                        x: hit.point.x, y: hit.point.y, z: hit.point.z
                    };
                }
                continue; 
            }

            // דגימה מאובייקטים
            if (object instanceof Mesh && object.material) {
                const mat = Array.isArray(object.material) ? object.material[0] : object.material;
                if (mat && 'color' in mat) {
                    const hex = "#" + (mat.color as Color).getHexString().toUpperCase();
                    const opacity = (mat as any).opacity ?? 1;

                    if (hex !== '#FFFFFF' && opacity > 0) {
                        setIndicatorPos({ x: hit.point.x, y: hit.point.y, z: hit.point.z });
                        return hex; 
                    }
                }
            }
        }

        if (groundPlaneHit) {
            setIndicatorPos({ x: groundPlaneHit.x, y: groundPlaneHit.y, z: groundPlaneHit.z });
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

    return (
        <group ref={groupRef}>
            {/* המשטח שקולט את העכבר */}
            <mesh 
                name="picker-interaction-plane"
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, 0.05, 0]} 
                onPointerMove={handlePointerMove}
                onPointerOut={() => setIndicatorPos(null)}
                onClick={handleClick}
            >
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* האינדיקטור הויזואלי - מרונדר רק אם יש מיקום תקין */}
            {indicatorPos && (
                <group position={[indicatorPos.x, indicatorPos.y + 0.02, indicatorPos.z]}>
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.15, 0.22, 32]} />
                        <meshBasicMaterial color="#ec4899" transparent opacity={0.8} depthTest={false} />
                    </mesh>
                    <Html center style={{ pointerEvents: 'none', userSelect: 'none' }}>
                         <div className="bg-pink-600 text-white text-[10px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-xl border-2 border-white/50">
                            לחץ לדגימה
                        </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

export default ColorPickerTool;
