
import React, { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three'; // Import all of Three.js

interface ColorPickerToolProps {
    isActive: boolean;
    onColorSelect: (hex: string) => void;
    onColorHover: (hex: string) => void; 
}

// Canonical map for consistent color names (copy from App.tsx/SensorDashboard)
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
    
    // Refs for raycasting
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    
    // Ref for the visual indicator mesh (now managed by R3F)
    const indicatorMeshRef = useRef<THREE.Mesh | null>(null);

    // Function to update indicator position (called by pointermove/click)
    const updateIndicatorPosition = useCallback((point: THREE.Vector3) => {
        if (indicatorMeshRef.current) {
            // Use set() for robustness, applying the y offset
            indicatorMeshRef.current.position.set(point.x, point.y + 0.05, point.z);
        }
    }, []);

    // --- Core Raycasting Logic ---
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
            
            // Skip helper objects and robot parts that should not be picked
            if (
                object.name === 'picker-visual-indicator-ring' || // Self-exclusion
                object.name.includes('helper') || // Generic helper objects like GridHelper
                object.name === 'start-marker' || 
                object.userData?.isRobotPart || // Robot components
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
                        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                            if (mat.color instanceof THREE.Color) {
                                groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point };
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
                    if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial)) {
                        continue; // Skip non-standard/basic materials
                    }

                    // Prioritize color over emissive, but check both
                    let potentialColor: THREE.Color | undefined;
                    if (mat.color instanceof THREE.Color) {
                        potentialColor = mat.color;
                    } 
                    if (!potentialColor && (mat as THREE.MeshStandardMaterial).emissive instanceof THREE.Color) {
                        potentialColor = (mat as THREE.MeshStandardMaterial).emissive;
                    }

                    if (potentialColor) {
                        const hex = "#" + potentialColor.getHexString().toUpperCase();
                        
                        // If we find a non-white, non-transparent color, this is the best hit.
                        const opacity = mat.opacity !== undefined ? mat.opacity : 1;
                        if (hex !== '#FFFFFF' && opacity > 0.1) { // Consider nearly transparent objects as no color
                            pickedHex = hex;
                            pickedPoint = hit.point;
                            break; // Found a good color, stop searching materials for this object
                        }
                    }
                }
            }
            if (pickedHex) break; // Found a good color from an object, stop searching intersects
        }

        // Final determination
        if (pickedHex && pickedPoint) {
            return { color: pickedHex, point: pickedPoint };
        } else if (groundPlaneHit) {
            return { color: groundPlaneHit.color, point: groundPlaneHit.point };
        }
        
        // Fallback to white at a default point if no intersect found
        // Use camera.position.clone() for a default point if no intersections at all
        return { color: "#FFFFFF", point: intersects[0]?.point || camera.position.clone() }; 
    }, [gl, camera, scene, mouse, raycaster]);

    // --- Global Pointer Event Handler ---
    const handleGlobalPointerEvent = useCallback((event: PointerEvent) => {
        if (!isActive) return;

        // Prevent events from bubbling back to R3F's canvas internal handlers
        // This is key to avoid conflicts when App.tsx also stops propagation
        event.stopPropagation();
        event.preventDefault(); // Also prevent default to avoid issues like text selection

        const { color, point } = sampleColor(event.clientX, event.clientY);
        
        // Only update indicator if it exists (i.e., isActive is true and it's rendered)
        if (indicatorMeshRef.current) {
            updateIndicatorPosition(point);
        }

        // Notify on hover (always)
        onColorHover(color);

        // If it's a click, trigger select event
        if (event.type === 'pointerdown') {
            onColorSelect(color);
            // Deactivate picker after selection is handled by App.tsx setting isActive to false.
        }
    }, [isActive, sampleColor, onColorHover, onColorSelect, updateIndicatorPosition]);

    // --- useEffect for global listeners and cursor management ---
    useEffect(() => {
        if (isActive) {
            document.body.style.cursor = 'crosshair';
            window.addEventListener('pointermove', handleGlobalPointerEvent, { capture: true });
            window.addEventListener('pointerdown', handleGlobalPointerEvent, { capture: true });
        } else {
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handleGlobalPointerEvent, { capture: true });
            window.removeEventListener('pointerdown', handleGlobalPointerEvent, { capture: true });
        }

        return () => { // Cleanup on unmount or isActive change
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handleGlobalPointerEvent, { capture: true });
            window.removeEventListener('pointerdown', handleGlobalPointerEvent, { capture: true });
        };
    }, [isActive, handleGlobalPointerEvent]);

    // Render the visual indicator as an R3F component, only when active
    return isActive ? (
        <mesh 
            ref={indicatorMeshRef} 
            rotation-x={-Math.PI / 2} 
            position-y={0.05} // Initial Y, will be updated by updateIndicatorPosition
            name="picker-visual-indicator-ring"
        >
            <ringGeometry args={[0.15, 0.22, 32]} />
            <meshBasicMaterial 
                color={new THREE.Color("#ec4899")} 
                transparent 
                opacity={0.9} 
                depthWrite={false} // Don't write to depth buffer to avoid z-fighting with ground
                toneMapped={false} // Prevent color mapping for UI elements
            />
        </mesh>
    ) : null;
};

export default ColorPickerTool;
