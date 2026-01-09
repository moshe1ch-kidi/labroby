
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
        // Add defensive checks for raycaster setup
        if (!raycaster || !camera || !mouse) {
            console.warn("ColorPickerTool: Raycaster or camera/mouse not ready for picking.");
            return null;
        }

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        // Enhanced logging for debugging
        console.log("ColorPickerTool: Intersects found:", intersects.length, intersects.map(i => { 
            const mesh = i.object as Mesh; // Cast once for convenience
            return {
                name: mesh?.name, 
                type: mesh?.type, 
                position: mesh?.position?.toArray(),
                // FIX: Safely access material type, accounting for single or array materials
                material: (() => {
                    const mat = mesh?.material;
                    if (!mat) return 'NoMaterial';
                    if (Array.isArray(mat)) {
                        return `MultiMaterial (${mat.length} materials)`;
                    }
                    return mat.type;
                })()
            };
        }));
        
        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            // Ensure hit and hit.object are valid
            if (!hit || !hit.object) {
                console.log("ColorPickerTool: Skipping invalid intersection hit (no object).");
                continue;
            }

            const object = hit.object;
            
            // Skip helper objects and robot parts immediately
            if (
                object.name === 'picker-interaction-plane' || 
                object.name === 'picker-visual-indicator' || 
                object.name === 'grid-helper' ||
                object.userData?.isRobotPart
            ) {
                console.log(`ColorPickerTool: Skipping helper/robot part: ${object.name || object.type}`);
                continue;
            }

            // If it's the ground plane, store it as a potential fallback, but continue searching for other objects
            if (object.name === 'ground-plane') {
                // Ensure object is a Mesh and has material before proceeding
                if (object instanceof Mesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const mat of materials) {
                        // Ensure material and its color property exist
                        if (mat && mat.color instanceof Color) { 
                            groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point };
                            console.log("ColorPickerTool: Storing ground-plane as fallback.");
                            break; // Only need one color from ground
                        }
                    }
                } else {
                    console.log(`ColorPickerTool: Ground-plane object ${object.name || object.type} is not a Mesh or has no material. Skipping.`);
                }
                continue; // Always continue after processing ground-plane, look for objects *on* it
            }

            // For all other relevant meshes, try to get their color
            // Ensure object is a Mesh and has material before proceeding
            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                for (const mat of materials) {
                    // Ensure material and its color property exist
                    if (mat && mat.color instanceof Color) { 
                        const hex = "#" + mat.color.getHexString().toUpperCase();
                        
                        // If we find a non-white, non-transparent color, this is the best hit.
                        // Prioritize this immediately.
                        // We also check for mat.opacity to avoid picking invisible objects if they exist in the scene graph.
                        if (hex !== '#FFFFFF' && mat.opacity > 0) {
                            console.log(`ColorPickerTool: Detected primary colored object: ${object.name || object.type} with color ${hex}, material type: ${mat.type}`);
                            setCursorPos(hit.point);
                            return hex; // Found the color, return it immediately
                        } else {
                            // If it's a white or transparent object, keep searching for something else.
                            console.log(`ColorPickerTool: Skipping white or transparent object: ${object.name || object.type}, material type: ${mat.type}, looking for something more specific.`);
                            continue;
                        }
                    } else {
                        console.log(`ColorPickerTool: Material of object ${object.name || object.type} has no valid color. Skipping.`);
                    }
                }
            } else {
                console.log(`ColorPickerTool: Object ${object.name || object.type} is not a Mesh or has no material. Skipping.`);
            }
        }

        // If we reached here, no distinct non-white object was found.
        // Fallback to the ground plane's color if it was hit.
        if (groundPlaneHit) {
            console.log(`ColorPickerTool: Falling back to ground-plane color: ${groundPlaneHit.color}`);
            setCursorPos(groundPlaneHit.point);
            return groundPlaneHit.color;
        }
        
        // If nothing else, return default white
        console.log("ColorPickerTool: No colored object or ground-plane detected, returning default white.");
        setCursorPos(null); // Clear cursor position if no object found
        return "#FFFFFF";
    }, [raycaster, scene, camera, mouse]); // Add onColorHover to dependencies if it's used inside useCallback
                                                        // It is used indirectly via the return, but it's good practice.

    const handlePointerMove = (e: any) => {
        e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex !== null) onColorHover(hex); // Only call if a color (or default white) is determined
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex !== null) onColorSelect(hex); // Only call if a color (or default white) is determined
    };

    const handlePointerOut = () => {
        setCursorPos(null);
        onColorHover(""); // Clear hover color when mouse leaves
    };

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

            {cursorPos && (
                <group position={cursorPos}>
                    {/* עיגול ויזואלי סביב העכבר */}
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
