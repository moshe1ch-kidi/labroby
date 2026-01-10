 
import React, { useState, useCallback, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Vector3, Mesh, Color, Layers } from 'three'; // Import Layers
import { useThree } from '@react-three/fiber';
import { ROBOT_LAYER } from '../types'; // Import ROBOT_LAYER

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    // Modified to receive the Blockly FieldColour instance directly
    onColorSelect: (hexColor: string, field: any) => void; 
    blocklyFieldRef: React.MutableRefObject<any | null>; // Ref to the Blockly FieldColour instance
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect, blocklyFieldRef }) => {
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);
    const { raycaster, scene, camera, mouse } = useThree();

    // Setup layers for raycaster
    const robotLayers = useCallback(() => {
      const layers = new Layers();
      layers.set(ROBOT_LAYER);
      return layers;
    }, []);

    const environmentLayers = useCallback(() => {
      const layers = new Layers();
      layers.enable(0); // Default layer
      // If we had a specific environment layer, we would enable it here.
      // layers.enable(ENVIRONMENT_LAYER);
      return layers;
    }, []);

    const sampleColorUnderMouse = useCallback(() => {
        if (!raycaster || !camera || !mouse) {
            console.warn("ColorPickerTool: Raycaster or camera/mouse not ready for picking.");
            return null;
        }

        // console.log(`ColorPickerTool: Mouse coords (normalized): x=${mouse.x.toFixed(2)}, y=${mouse.y.toFixed(2)}`);
        
        let intersects;
        let pickedColor: string | null = null;
        let pickedPoint: Vector3 | null = null;

        // --- Phase 1: Try to hit ROBOT_LAYER first (higher priority) ---
        raycaster.setFromCamera(mouse, camera);
        raycaster.layers = robotLayers(); // Only check ROBOT_LAYER
        intersects = raycaster.intersectObjects(scene.children, true);
        // console.log(`ColorPickerTool: Intersects (ROBOT_LAYER): ${intersects.length} hits`);

        for (const hit of intersects) {
            // Ensure hit, object, and point are defined before accessing properties
            if (!hit || !hit.object || !hit.point) {
                // console.warn("ColorPickerTool: Invalid hit object in ROBOT_LAYER intersection.");
                continue;
            }

            const object = hit.object;
            // Skip picker's own interaction plane or visual indicator
            if (object.name === 'picker-interaction-plane' || object.name === 'picker-visual-indicator') {
                continue;
            }

            // If it's a mesh and has a material, try to get its color
            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const mat of materials) {
                    if (mat && mat.color instanceof Color && mat.opacity > 0) {
                        pickedColor = "#" + mat.color.getHexString().toUpperCase();
                        pickedPoint = hit.point;
                        // console.log(`ColorPickerTool: Detected ROBOT part: ${object.name || object.type} with color ${pickedColor} at point ${pickedPoint.x.toFixed(2)},${pickedPoint.y.toFixed(2)},${pickedPoint.z.toFixed(2)}`);
                        setCursorPos(pickedPoint);
                        return pickedColor; // Immediately return if robot part is found
                    }
                }
            }
        }
        
        // --- Phase 2: If no robot parts, try to hit other objects (e.g., ground, custom objects) ---
        raycaster.layers = environmentLayers(); // Check environment layers (default layer 0)
        intersects = raycaster.intersectObjects(scene.children, true);
        // console.log(`ColorPickerTool: Intersects (ENVIRONMENT_LAYER): ${intersects.length} hits`);

        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            // Ensure hit, object, and point are defined before accessing properties
            if (!hit || !hit.object || !hit.point) {
                // console.warn("ColorPickerTool: Invalid hit object in ENVIRONMENT_LAYER intersection.");
                continue;
            }

            const object = hit.object;
            if (object.name === 'picker-interaction-plane' || object.name === 'picker-visual-indicator' || object.name === 'grid-helper') {
                continue;
            }
            
            // Handle ground plane as a fallback, but continue searching for other custom objects
            if (object.name === 'ground-plane') {
                if (object instanceof Mesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const mat of materials) {
                        if (mat && mat.color instanceof Color) { 
                            groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point };
                            // console.log(`ColorPickerTool: Storing ground-plane as fallback with color ${groundPlaneHit.color} at point ${groundPlaneHit.point.x.toFixed(2)},${groundPlaneHit.point.y.toFixed(2)},${groundPlaneHit.point.z.toFixed(2)}.`);
                            break; 
                        }
                    }
                }
                continue; // Always continue after processing ground-plane
            }

            // For all other relevant meshes (custom objects), try to get their color
            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const mat of materials) {
                    if (mat && mat.color instanceof Color && mat.opacity > 0) { 
                        pickedColor = "#" + mat.color.getHexString().toUpperCase();
                        pickedPoint = hit.point;
                        // console.log(`ColorPickerTool: Detected ENVIRONMENT object: ${object.name || object.type} with color ${pickedColor} at point ${pickedPoint.x.toFixed(2)},${pickedPoint.y.toFixed(2)},${pickedPoint.z.toFixed(2)}`);
                        setCursorPos(pickedPoint);
                        return pickedColor; // Immediately return if custom object is found
                    }
                }
            }
        }

        // If no distinct object found, fall back to ground plane color
        if (groundPlaneHit) {
            // console.log(`ColorPickerTool: Falling back to ground-plane color: ${groundPlaneHit.color}`);
            setCursorPos(groundPlaneHit.point);
            return groundPlaneHit.color;
        }
        
        // Default to white if nothing is hit
        // console.log("ColorPickerTool: No colored object detected, returning default white.");
        setCursorPos(null);
        return "#FFFFFF";
    }, [raycaster, scene, camera, mouse, robotLayers, environmentLayers]);


    const handlePointerMove = useCallback((e: any) => {
        // console.log("ColorPickerTool: PointerMove event received.");
        e.stopPropagation();
        const hex = sampleColorUnderMouse();
        if (hex !== null) onColorHover(hex);
    }, [onColorHover, sampleColorUnderMouse]);

    const handleClick = useCallback((e: any) => {
        // console.log("ColorPickerTool: Click event received.");
        e.stopPropagation();
        const hex = sampleColorUnderMouse();
        // MODIFIED: Pass the Blockly FieldColour instance from ref to onColorSelect
        if (hex !== null && blocklyFieldRef.current) {
            onColorSelect(hex, blocklyFieldRef.current);
        } else if (!blocklyFieldRef.current) {
            console.error("ColorPickerTool: Blockly field instance is null. Cannot set color.");
        }
    }, [onColorSelect, sampleColorUnderMouse, blocklyFieldRef]);

    const handlePointerOut = useCallback(() => {
        // console.log("ColorPickerTool: PointerOut event received.");
        setCursorPos(null);
        onColorHover("");
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

            {cursorPos && (
                <group position={cursorPos}>
                    {/* Visual circle around the mouse */}
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
