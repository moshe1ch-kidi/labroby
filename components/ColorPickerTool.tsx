
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
                // Safely access position.toArray()
                position: mesh?.position ? mesh.position.toArray() : 'N/A',
                // Safely access material type, accounting for single or array materials
                material: (() => {
                    const mat = mesh?.material;
                    if (!mat) return 'NoMaterial';
                    if (Array.isArray(mat)) {
                        return `MultiMaterial (${mat.length} materials)`;
                    }
                    return mat.type;
                })(),
                userData: mesh?.userData
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
            
            // Skip ONLY specific helper objects (not robot parts anymore)
            if (
                object.name === 'picker-interaction-plane' || 
                object.name === 'picker-visual-indicator' || 
                object.name === 'grid-helper'
            ) {
                console.log(`ColorPickerTool: Skipping helper: ${object.name || object.type}`);
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

            // For all other relevant meshes (including robot parts), try to get their color
            // FIX: Removed `object.userData?.isRobotPart` from this skip logic.
            // FIX: Also removed `hex !== '#FFFFFF'` to allow picking white objects directly.
            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                for (const mat of materials) {
                    // Ensure material and its color property exist
                    if (mat && mat.color instanceof Color) { 
                        const hex = "#" + mat.color.getHexString().toUpperCase();
                        
                        // FIX: If we find any valid color (even white) from a non-helper object, return it immediately.
                        // This prioritizes closest non-helper objects.
                        if (mat.opacity > 0) { // Still respect opacity
                            console.log(`ColorPickerTool: Detected primary object: ${object.name || object.type} with color ${hex}, material type: ${mat.type}`);
                            // FIX: Add check for hit.point before setting cursorPos
                            if (hit.point) {
                                setCursorPos(hit.point);
                            } else {
                                console.warn(`ColorPickerTool: Intersection found for ${object.name || object.type}, but hit.point is undefined.`);
                            }
                            return hex; // Found the color, return it immediately
                        } else {
                            console.log(`ColorPickerTool: Skipping transparent object: ${object.name || object.type}, material type: ${mat.type}, looking for something more specific.`);
                        }
                    } else {
                        console.log(`ColorPickerTool: Material of object ${object.name || object.type} has no valid color. Skipping.`);
                    }
                }
            } else {
                console.log(`ColorPickerTool: Object ${object.name || object.type} is not a Mesh or has no material. Skipping.`);
            }
        }

        // If we reached here, no distinct non-helper object was found or all were transparent.
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
    }, [raycaster, scene, camera, mouse]); // onColorHover is passed as a prop, not directly used in the useCallback dependencies.

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
