import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Vector3, Mesh, Color, Object3D } from 'three';
import { useThree } from '@react-three/fiber';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const { raycaster, scene, camera, mouse } = useThree();
    const [pickableMeshes, setPickableMeshes] = useState<Mesh[]>([]);

    // Build pickable meshes list once when component mounts or scene changes
    useEffect(() => {
        const pickable: Mesh[] = [];
        scene.traverse((obj: Object3D) => {
            if (obj instanceof Mesh) {
                // Exclude known non-pickable objects
                if (
                    obj.name === 'picker-interaction-plane' ||
                    obj.name === 'grid-helper' ||
                    obj.userData?.isRobotPart
                ) {
                    return;
                }
                pickable.push(obj);
            }
        });
        setPickableMeshes(pickable);
    }, [scene]);

    // Sample color under mouse - now with stable dependencies
    const sampleColorUnderMouse = useCallback(() => {
        raycaster.setFromCamera(mouse, camera);

        // Use the pre-built pickable meshes list
        const intersects = raycaster.intersectObjects(pickableMeshes, false);

        let groundPlaneHit: { color: string; point: Vector3 } | null = null;

        for (const hit of intersects) {
            const object = hit.object;

            if (object.name === 'ground-plane') {
                if (object.material) {
                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];
                    for (const mat of materials) {
                        if (mat.color && mat.color instanceof Color) {
                            groundPlaneHit = {
                                color: "#" + mat.color.getHexString().toUpperCase(),
                                point: hit.point
                            };
                            break;
                        }
                    }
                }
                continue;
            }

            // For all other relevant meshes, try to get their color
            if (object.material) {
                const materials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];

                for (const mat of materials) {
                    if (mat.color && mat.color instanceof Color) {
                        const hex = "#" + mat.color.getHexString().toUpperCase();

                        // Prioritize non-white, non-transparent colors
                        if (hex !== '#FFFFFF' && mat.opacity > 0) {
                            return hex;
                        }
                    }
                }
            }
        }

        if (groundPlaneHit) {
            return groundPlaneHit.color;
        }

        return "#FFFFFF";
    }, [raycaster, camera, mouse, pickableMeshes]);

    const handlePointerMove = useCallback((e: any) => {
        e.stopPropagation();
        try {
            const hex = sampleColorUnderMouse();
            if (hex) {
                onColorHover(hex);
            }
        } catch (err) {
            console.error("Error in color picker hover:", err);
        }
    }, [sampleColorUnderMouse, onColorHover]);

    const handleClick = useCallback((e: any) => {
        e.stopPropagation();
        try {
            const hex = sampleColorUnderMouse();
            if (hex) {
                onColorSelect(hex);
            }
        } catch (err) {
            console.error("Error in color picker click:", err);
        }
    }, [sampleColorUnderMouse, onColorSelect]);

    const handlePointerOut = useCallback(() => {
        // Reset to white when mouse leaves
        onColorHover("#FFFFFF");
    }, [onColorHover]);

    return (
        <group>
            {/* Invisible interaction plane that captures mouse events */}
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
        </group>
    );
};

export default ColorPickerTool;
