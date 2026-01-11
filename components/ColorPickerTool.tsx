
import React, { useState, useCallback, useMemo } from 'react';
import { Vector3, Mesh, Color, Object3D } from 'three';
import { useThree } from '@react-three/fiber';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const { raycaster, scene, camera, mouse } = useThree();

    // Memoize a function that gets all potentially pickable meshes in the scene.
    // This avoids rebuilding the list on every render, but will re-run if `scene` itself changes.
    // However, scene reference usually stays constant.
    const getPickableMeshes = useCallback(() => {
        // Fix: Changed `THREE.Mesh` to `Mesh` as `Mesh` is already imported directly.
        const pickable: Mesh[] = [];
        scene.traverse((obj: Object3D) => {
            if (obj instanceof Mesh) {
                // Exclude known non-pickable objects immediately
                if (
                    obj.name === 'picker-interaction-plane' ||
                    obj.name === 'grid-helper' ||
                    obj.userData?.isRobotPart
                ) {
                    return; // Skip this object and its children if traversing deeply
                }
                pickable.push(obj);
            }
        });
        return pickable;
    }, [scene]);


    const sampleColorUnderMouse = useCallback(() => {
        raycaster.setFromCamera(mouse, camera);

        // Get the pre-filtered list of pickable meshes
        const pickableMeshes = getPickableMeshes();

        // Now, raycast only against the pickable meshes, without recursive traversal (false)
        const intersects = raycaster.intersectObjects(pickableMeshes, false); 

        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            
            if (object.name === 'ground-plane') {
                if (object.material) {
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

            // For all other relevant meshes, try to get their color
            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                for (const mat of materials) {
                    if (mat.color && mat.color instanceof Color) {
                        const hex = "#" + mat.color.getHexString().toUpperCase();
                        
                        // If we find a non-white, non-transparent color, this is the best hit.
                        // Prioritize this immediately.
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
    }, [raycaster, camera, mouse, getPickableMeshes]);

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

    const handlePointerOut = () => {};

    return (
        <group>
            {/* משטח אינטראקציה בלתי נראה שתופס את העכבר */}
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
