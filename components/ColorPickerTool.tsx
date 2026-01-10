 
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { Vector3, Mesh, Color, Layers, Group, MeshBasicMaterial, MeshStandardMaterial } from 'three'; // Import Layers and Group
import { useThree, useFrame } from '@react-three/fiber';
import { ROBOT_LAYER } from '../types'; // Import ROBOT_LAYER

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    // Modified to receive the Blockly FieldColour instance directly
    onColorSelect: (hexColor: string, field: any) => void; 
    blocklyFieldRef: React.MutableRefObject<any | null>; // Ref to the Blockly FieldColour instance
}

// Helper function to safely extract a hex color from a material
const getHexFromMaterial = (material: any): string | null => {
    if (!material) return null;

    const materials = Array.isArray(material) ? material : [material];

    for (const mat of materials) {
        if (mat && mat.color instanceof Color && mat.opacity > 0) {
            return "#" + mat.color.getHexString().toUpperCase();
        }
        // Handle MeshBasicMaterial or MeshStandardMaterial having 'color' property
        if (mat && (mat as MeshBasicMaterial | MeshStandardMaterial).color instanceof Color && mat.opacity > 0) {
            return "#" + (mat as MeshBasicMaterial | MeshStandardMaterial).color.getHexString().toUpperCase();
        }
    }
    return null;
};

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
            // Fallback for when core Three.js elements are not ready
            return { color: "#FFFFFF", point: new Vector3(0, 0, 0) }; 
        }
        
        let pickedColor: string | null = null;
        let pickedPoint: Vector3 | null = null;
        let groundPlaneColor: string | null = null;
        let groundPlanePoint: Vector3 | null = null;

        // --- Phase 1: Try to hit ROBOT_LAYER first (higher priority) ---
        raycaster.setFromCamera(mouse, camera);
        raycaster.layers = robotLayers; // Only check ROBOT_LAYER
        let intersects = raycaster.intersectObjects(scene.children, true);

        for (const hit of intersects) {
            if (!hit || !hit.object || !hit.point) continue;

            const object = hit.object;
            // Skip picker's own interaction plane or visual indicator
            if (object.name === 'picker-interaction-plane' || object.name === 'picker-visual-indicator') {
                continue;
            }

            if (object instanceof Mesh) {
                const hex = getHexFromMaterial(object.material);
                if (hex) {
                    pickedColor = hex;
                    pickedPoint = hit.point;
                    return { color: pickedColor, point: pickedPoint }; // Immediately return if robot part is found
                }
            }
        }
        
        // --- Phase 2: If no robot parts, try to hit other objects (e.g., ground, custom objects) ---
        raycaster.layers = environmentLayers; // Check environment layers (default layer 0)
        intersects = raycaster.intersectObjects(scene.children, true);

        for (const hit of intersects) {
            if (!hit || !hit.object || !hit.point) continue;

            const object = hit.object;
            if (object.name === 'picker-interaction-plane' || object.name === 'picker-visual-indicator' || object.name === 'grid-helper') {
                continue;
            }
            
            if (object.name === 'ground-plane') {
                if (object instanceof Mesh) {
                    const hex = getHexFromMaterial(object.material);
                    if (hex) {
                        groundPlaneColor = hex;
                        groundPlanePoint = hit.point;
                    }
                }
                continue; // Continue searching for other objects on top of the ground
            }

            if (object instanceof Mesh) {
                const hex = getHexFromMaterial(object.material);
                if (hex) { 
                    pickedColor = hex;
                    pickedPoint = hit.point;
                    return { color: pickedColor, point: pickedPoint }; // Immediately return if custom object is found
                }
            }
        }

        // Fallback: If no distinct object found, use ground plane color or default white
        if (groundPlaneColor && groundPlanePoint) {
            return { color: groundPlaneColor, point: groundPlanePoint };
        }
        
        // Final default if nothing is hit (should be rare with a ground plane)
        return { color: "#FFFFFF", point: new Vector3(0, 0, 0) }; 
    }, [raycaster, scene, camera, mouse, robotLayers, environmentLayers]);


    const handlePointerMove = useCallback((e: any) => {
        e.stopPropagation();
        const { color: hex, point } = sampleColorUnderMouse();
        
        if (point) { // Always update cursor position if a point is returned
            setCursorPos(point);
        }

        if (hex !== null) {
            onColorHover(hex);
            setIsHoveringObject(true); 
        } else {
            onColorHover("#FFFFFF"); // Default hover color if no valid color found
            setIsHoveringObject(false); // No valid color/object hit
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
