
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { Vector3, Mesh, Color, Layers, Group } from 'three'; // Import Layers and Group
import { useThree, useFrame } from '@react-three/fiber';
import { ROBOT_LAYER } from '../types'; // Import ROBOT_LAYER

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    // Modified to receive the Blockly FieldColour instance directly
    onColorSelect: (hexColor: string, field: any) => void; 
    blocklyFieldRef: React.MutableRefObject<any | null>; // Ref to the Blockly FieldColour instance
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect, blocklyFieldRef }) => {
    // cursorPos now always a Vector3, its visibility controlled via groupRef
    const [cursorPos, setCursorPos] = useState<Vector3>(new Vector3());
    const [isHoveringObject, setIsHoveringObject] = useState(false); // To track if raycaster actually hit something
    const { raycaster, scene, camera, mouse } = useThree();
    const indicatorGroupRef = useRef<Group>(null); // Ref for the visual indicator group

    // Setup layers for raycaster
    const robotLayers = useMemo(() => {
      const layers = new Layers();
      layers.set(ROBOT_LAYER);
      return layers;
    }, []);

    const environmentLayers = useMemo(() => {
      const layers = new Layers();
      layers.enable(0); // Default layer
      return layers;
    }, []);

    const sampleColorUnderMouse = useCallback(() => {
        if (!raycaster || !camera || !mouse) {
            console.warn("ColorPickerTool: Raycaster or camera/mouse not ready for picking.");
            return { color: null, point: null };
        }
        
        let intersects;
        let pickedColor: string | null = null;
        let pickedPoint: Vector3 | null = null;

        // --- Phase 1: Try to hit ROBOT_LAYER first (higher priority) ---
        raycaster.setFromCamera(mouse, camera);
        raycaster.layers = robotLayers; // Only check ROBOT_LAYER
        intersects = raycaster.intersectObjects(scene.children, true);

        for (const hit of intersects) {
            if (!hit || !hit.object || !hit.point) continue;

            const object = hit.object;
            // Skip picker's own interaction plane or visual indicator
            if (object.name === 'picker-interaction-plane' || object.name === 'picker-visual-indicator') {
                continue;
            }

            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const mat of materials) {
                    if (mat && mat.color instanceof Color && mat.opacity > 0) {
                        pickedColor = "#" + mat.color.getHexString().toUpperCase();
                        pickedPoint = hit.point;
                        return { color: pickedColor, point: pickedPoint }; // Immediately return if robot part is found
                    }
                }
            }
        }
        
        // --- Phase 2: If no robot parts, try to hit other objects (e.g., ground, custom objects) ---
        raycaster.layers = environmentLayers; // Check environment layers (default layer 0)
        intersects = raycaster.intersectObjects(scene.children, true);

        let groundPlaneHit: { color: string, point: Vector3 } | null = null;

        for (const hit of intersects) {
            if (!hit || !hit.object || !hit.point) continue;

            const object = hit.object;
            if (object.name === 'picker-interaction-plane' || object.name === 'picker-visual-indicator' || object.name === 'grid-helper') {
                continue;
            }
            
            if (object.name === 'ground-plane') {
                if (object instanceof Mesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const mat of materials) {
                        if (mat && mat.color instanceof Color) { 
                            groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point };
                            break; 
                        }
                    }
                }
                continue; 
            }

            if (object instanceof Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const mat of materials) {
                    if (mat && mat.color instanceof Color && mat.opacity > 0) { 
                        pickedColor = "#" + mat.color.getHexString().toUpperCase();
                        pickedPoint = hit.point;
                        return { color: pickedColor, point: pickedPoint }; // Immediately return if custom object is found
                    }
                }
            }
        }

        // If no distinct object found, fall back to ground plane color
        if (groundPlaneHit) {
            return { color: groundPlaneHit.color, point: groundPlaneHit.point };
        }
        
        // Default to white with a safe fallback point if nothing is hit
        return { color: "#FFFFFF", point: new Vector3(0, 0, 0) }; 
    }, [raycaster, scene, camera, mouse, robotLayers, environmentLayers]);


    const handlePointerMove = useCallback((e: any) => {
        e.stopPropagation();
        const { color: hex, point } = sampleColorUnderMouse();
        
        if (hex !== null && point !== null) {
            setCursorPos(point);
            onColorHover(hex);
            setIsHoveringObject(true); // Raycaster hit something
        } else {
            // No object hit, perhaps show a default color or nothing
            // Use the fallback point from sampleColorUnderMouse if no valid point is returned
            setCursorPos(sampleColorUnderMouse().point as Vector3); 
            onColorHover("#FFFFFF"); // Default hover color
            setIsHoveringObject(false);
        }
    }, [onColorHover, sampleColorUnderMouse]);

    const handleClick = useCallback((e: any) => {
        e.stopPropagation();
        const { color: hex } = sampleColorUnderMouse();
        
        if (hex !== null && blocklyFieldRef.current) {
            onColorSelect(hex, blocklyFieldRef.current);
        } else if (!blocklyFieldRef.current) {
            console.error("ColorPickerTool: Blockly field instance is null. Cannot set color.");
        }
    }, [onColorSelect, sampleColorUnderMouse, blocklyFieldRef]);

    const handlePointerOut = useCallback(() => {
        setIsHoveringObject(false); // No longer hovering over any object
        onColorHover(""); // Clear hover color
    }, [onColorHover]);

    // Use useFrame to update the position and visibility of the indicator group
    useFrame(() => {
        if (indicatorGroupRef.current) {
            // Update position only if hovering over an object
            indicatorGroupRef.current.position.set(cursorPos.x, cursorPos.y, cursorPos.z);
            indicatorGroupRef.current.visible = isHoveringObject; // Only show indicator if hovering over a valid object
        }
    });

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

            {/* Visual indicator group, now always mounted, visibility controlled by useFrame */}
            <group ref={indicatorGroupRef}>
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
        </group>
    );
};

export default ColorPickerTool;
