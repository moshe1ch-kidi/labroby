
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorPickerToolProps {
    isActive: boolean;
    onColorSelect: (hex: string) => void;
    onColorHover: (hex: string) => void; 
}

const CANONICAL_COLOR_MAP: Record<string, string> = {
    'red': '#EF4444',
    'green': '#22C55E',
    'blue': '#3B82F6',
    'yellow': '#EAB308',
    'orange': '#F97316',
    'purple': '#A855F7',
    'cyan': '#06B6D4',
    'magenta': '#EC4899',
    'black': '#000000',
    'white': '#FFFFFF',
};

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ isActive, onColorSelect, onColorHover }) => {
    const { gl, scene, camera } = useThree();
    
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2()); // Stores normalized device coordinates (NDC)
    
    // Store raw screen coordinates from global events
    const mouseScreenCoordsRef = useRef<{clientX: number, clientY: number} | null>(null);
    const isPointerDownRef = useRef(false);
    
    // State to hold the last picked color for consistent UI updates
    const [lastPickedColor, setLastPickedColor] = useState<string>("#FFFFFF");
    const lastPickedPointRef = useRef(new THREE.Vector3(0,0,0)); // Store the last valid point

    // Ref for the visual indicator mesh
    const indicatorMeshRef = useRef<THREE.Mesh | null>(null);

    // --- Core Raycasting Logic (now defensive and safe) ---
    const sampleColor = useCallback((clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -(((clientY - rect.top) / rect.height) * 2 - 1);

        raycaster.current.setFromCamera(mouse.current, camera);
        
        const intersects = raycaster.current.intersectObjects(scene.children, true);

        let groundPlaneHit: { color: string, point: THREE.Vector3 } | null = null;
        let pickedHex: string | null = null;
        let pickedPoint: THREE.Vector3 | null = null;

        for (const hit of intersects) {
            const object = hit.object;
            
            // Critical check: ensure object is not null/undefined
            if (!object) {
                continue;
            }

            // Skip helper objects and robot parts that should not be picked
            if (
                object.name === 'picker-visual-indicator-ring' || // Self-exclusion
                object.name.includes('helper') || // Generic helper objects like GridHelper
                object.name === 'start-marker' || 
                object.userData?.isRobotPart || // Robot components (identified via userData)
                object.name === 'custom-wall-wireframe' || // Ruler tool's wireframe
                object.name === 'ruler-tool-plane' // The transparent plane of RulerTool
            ) {
                continue;
            }

            // If it's the ground plane, store it as a potential fallback
            if (object.name === 'ground-plane') {
                if (object instanceof THREE.Mesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const mat of materials) {
                        if (mat && (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial)) {
                            if (mat.color instanceof THREE.Color) {
                                groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point.clone() }; // Clone point to be safe
                                break; 
                            }
                        }
                    }
                }
                continue; // Continue searching for other objects on top of the ground
            }

            // For all other relevant meshes, try to get their color
            if (object instanceof THREE.Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                for (const mat of materials) {
                    if (!mat || (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshBasicMaterial))) {
                        continue; // Skip non-standard/basic materials
                    }

                    let potentialColor: THREE.Color | undefined;
                    if (mat.color instanceof THREE.Color) {
                        potentialColor = mat.color;
                    } 
                    if (!potentialColor && (mat as THREE.MeshStandardMaterial).emissive instanceof THREE.Color) {
                        potentialColor = (mat as THREE.MeshStandardMaterial).emissive;
                    }

                    if (potentialColor) {
                        const hex = "#" + potentialColor.getHexString().toUpperCase();
                        const opacity = mat.opacity !== undefined ? mat.opacity : 1;
                        if (hex !== '#FFFFFF' && opacity > 0.1) {
                            pickedHex = hex;
                            pickedPoint = hit.point.clone(); // Clone point to be safe
                            break; 
                        }
                    }
                }
            }
            if (pickedHex) break; 
        }

        if (pickedHex && pickedPoint) {
            return { color: pickedHex, point: pickedPoint };
        } else if (groundPlaneHit) {
            return { color: groundPlaneHit.color, point: groundPlaneHit.point };
        }
        
        // Fallback: If no object is hit, return white at the origin (or robot's base for context)
        return { color: "#FFFFFF", point: new THREE.Vector3(0, 0, 0) }; 
    }, [gl, camera, scene]);

    // --- useFrame for Raycasting and Indicator Updates ---
    useFrame(() => {
        if (!isActive || !mouseScreenCoordsRef.current) {
            // No need to raycast if not active or no mouse movement since last frame
            return;
        }

        const { clientX, clientY } = mouseScreenCoordsRef.current;
        const { color, point } = sampleColor(clientX, clientY);

        // Update indicator's position and color.
        if (indicatorMeshRef.current) {
            indicatorMeshRef.current.position.set(point.x, point.y + 0.05, point.z);
            // Optionally, update the indicator's color to reflect the picked color
            if (Array.isArray(indicatorMeshRef.current.material)) {
                indicatorMeshRef.current.material.forEach(mat => {
                    if (mat instanceof THREE.MeshBasicMaterial) {
                        mat.color.set(color);
                    }
                });
            } else if (indicatorMeshRef.current.material instanceof THREE.MeshBasicMaterial) {
                indicatorMeshRef.current.material.color.set(color);
            }
        }
        
        // Update state for SensorDashboard preview (if needed for the hover effect)
        onColorHover(color);
        setLastPickedColor(color); // Keep track of the last picked color for click action
        lastPickedPointRef.current.copy(point); // Keep track of the last picked point

        // If pointerdown happened, trigger select and reset
        if (isPointerDownRef.current) {
            onColorSelect(color);
            isPointerDownRef.current = false; // Reset the flag
            // Do not clear mouseScreenCoordsRef.current here; it would stop subsequent hover updates until next move.
        }
    });

    // --- Global Pointer Event Handlers ---
    const handleWindowPointerMove = useCallback((event: PointerEvent) => {
        if (isActive) {
            event.stopPropagation();
            event.preventDefault();
            mouseScreenCoordsRef.current = { clientX: event.clientX, clientY: event.clientY };
        }
    }, [isActive]);

    const handleWindowPointerDown = useCallback((event: PointerEvent) => {
        if (isActive) {
            event.stopPropagation();
            event.preventDefault();
            isPointerDownRef.current = true;
            mouseScreenCoordsRef.current = { clientX: event.clientX, clientY: event.clientY }; // Capture position for immediate click
        }
    }, [isActive]);

    const handleWindowPointerUp = useCallback(() => {
        if (isActive) {
            isPointerDownRef.current = false; // Release click state
        }
    }, [isActive]);


    // --- useEffect for global listeners and cursor management ---
    useEffect(() => {
        if (isActive) {
            document.body.style.cursor = 'crosshair';
            window.addEventListener('pointermove', handleWindowPointerMove, { capture: true });
            window.addEventListener('pointerdown', handleWindowPointerDown, { capture: true });
            window.addEventListener('pointerup', handleWindowPointerUp, { capture: true }); // Listen for pointerup
        } else {
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handleWindowPointerMove, { capture: true });
            window.removeEventListener('pointerdown', handleWindowPointerDown, { capture: true });
            window.removeEventListener('pointerup', handleWindowPointerUp, { capture: true }); // Clean up pointerup
            
            // Reset refs when deactivating
            mouseScreenCoordsRef.current = null;
            isPointerDownRef.current = false;
        }

        return () => { // Cleanup on unmount or isActive change
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handleWindowPointerMove, { capture: true });
            window.removeEventListener('pointerdown', handleWindowPointerDown, { capture: true });
            window.removeEventListener('pointerup', handleWindowPointerUp, { capture: true });
        };
    }, [isActive, handleWindowPointerMove, handleWindowPointerDown, handleWindowPointerUp]);

    // Render the visual indicator as an R3F component, only when active
    return isActive ? (
        <mesh 
            ref={indicatorMeshRef} 
            rotation-x={-Math.PI / 2} 
            position={lastPickedPointRef.current.toArray()} // Use the last picked point for initial position
            name="picker-visual-indicator-ring"
        >
            <ringGeometry args={[0.15, 0.22, 32]} />
            <meshBasicMaterial 
                color={new THREE.Color(lastPickedColor)} // Initial color from state
                transparent 
                opacity={0.9} 
                depthWrite={false} 
                toneMapped={false} 
            />
        </mesh>
    ) : null;
};

export default ColorPickerTool;
