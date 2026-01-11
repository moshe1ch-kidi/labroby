
import React, { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three'; // Import all of Three.js

interface ColorPickerToolProps {
    isActive: boolean; // Renamed from isColorPickerActive
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
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    
    // Ref for the visual indicator group
    const indicatorGroupRef = useRef<THREE.Group | null>(null);
    const indicatorMeshRef = useRef<THREE.Mesh | null>(null); // For the actual ring mesh

    // Function to create the visual indicator
    const createIndicator = useCallback(() => {
        const group = new THREE.Group();
        group.name = 'picker-visual-indicator-group'; // Give it a name for easier debugging
        
        // Create the ring mesh (similar to previous HTML indicator)
        const ringGeometry = new THREE.RingGeometry(0.15, 0.22, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color("#ec4899"), 
            transparent: true, 
            opacity: 0.9, 
            depthWrite: false // Don't write to depth buffer to avoid z-fighting with ground
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = -Math.PI / 2; // Orient it flat on the ground
        ringMesh.position.y = 0.05; // Slightly above ground
        ringMesh.name = 'picker-visual-indicator-ring';
        group.add(ringMesh);

        indicatorGroupRef.current = group;
        indicatorMeshRef.current = ringMesh;
        scene.add(group);
        // console.log("ColorPickerTool: Indicator created and added to scene.");
    }, [scene]);

    // Function to dispose the visual indicator
    const disposeIndicator = useCallback(() => {
        if (indicatorGroupRef.current) {
            scene.remove(indicatorGroupRef.current);
            indicatorGroupRef.current.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            indicatorGroupRef.current = null;
            indicatorMeshRef.current = null;
            // console.log("ColorPickerTool: Indicator removed from scene and disposed.");
        }
    }, [scene]);

    // Function to update indicator position (called by pointermove/click)
    const updateIndicatorPosition = useCallback((point: THREE.Vector3) => {
        if (indicatorGroupRef.current) {
            indicatorGroupRef.current.position.copy(point);
            // We want the ring to always be slightly above the surface where we picked
            indicatorGroupRef.current.position.y += 0.05; 
        }
    }, []);

    // --- Core Raycasting Logic (adapted from existing code) ---
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
            
            // Skip helper objects and robot parts
            if (
                object.name === 'picker-visual-indicator-group' || 
                object.name === 'picker-visual-indicator-ring' ||
                object.name === 'grid-helper' ||
                object.name === 'start-marker' || 
                object.userData?.isRobotPart
            ) {
                continue;
            }

            // If it's the ground plane, store it as a potential fallback
            if (object.name === 'ground-plane') {
                if (object instanceof THREE.Mesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const mat of materials) {
                        if (mat.color instanceof THREE.Color) {
                            groundPlaneHit = { color: "#" + mat.color.getHexString().toUpperCase(), point: hit.point };
                            break; 
                        }
                    }
                }
                continue; // Continue searching for other objects on top of the ground
            }

            // For all other relevant meshes, try to get their color
            if (object instanceof THREE.Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                for (const mat of materials) {
                    // Prioritize color over emissive, but check both
                    let potentialColor: THREE.Color | undefined;
                    if (mat.color instanceof THREE.Color) {
                        potentialColor = mat.color;
                    } else if ((mat as THREE.MeshStandardMaterial).emissive instanceof THREE.Color) {
                        potentialColor = (mat as THREE.MeshStandardMaterial).emissive;
                    }

                    if (potentialColor) {
                        const hex = "#" + potentialColor.getHexString().toUpperCase();
                        
                        // If we find a non-white, non-transparent color, this is the best hit.
                        const opacity = (mat as THREE.MeshStandardMaterial).opacity !== undefined ? (mat as THREE.MeshStandardMaterial).opacity : 1;
                        if (hex !== '#FFFFFF' && opacity > 0) {
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
        
        // Default to white if nothing specific is found. Fallback point if no intersect.
        return { color: "#FFFFFF", point: intersects[0]?.point || new THREE.Vector3(0, 0, 0) }; 
    }, [gl, camera, scene, mouse, raycaster]);

    // --- Global Pointer Event Handler ---
    const handleGlobalPointerEvent = useCallback((event: PointerEvent) => {
        if (!isActive) return;

        // Prevent events from bubbling back to R3F's canvas internal handlers
        // This is key to avoid conflicts when App.tsx also stops propagation
        event.stopPropagation();
        event.preventDefault(); // Also prevent default to avoid issues like text selection

        const { color, point } = sampleColor(event.clientX, event.clientY);
        
        // Update visual indicator position immediately
        updateIndicatorPosition(point);

        // Notify on hover (always)
        onColorHover(color);

        // If it's a click, trigger select event
        if (event.type === 'pointerdown') {
            onColorSelect(color);
            // Deactivate picker after selection. This will be handled by App.tsx setting isActive to false.
        }
    }, [isActive, sampleColor, onColorHover, onColorSelect, updateIndicatorPosition]);

    // --- useEffect for global listeners and cursor/indicator management ---
    useEffect(() => {
        if (isActive) {
            document.body.style.cursor = 'crosshair';
            window.addEventListener('pointermove', handleGlobalPointerEvent, { capture: true });
            window.addEventListener('pointerdown', handleGlobalPointerEvent, { capture: true });
            createIndicator(); // Create indicator when active
        } else {
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handleGlobalPointerEvent, { capture: true });
            window.removeEventListener('pointerdown', handleGlobalPointerEvent, { capture: true });
            disposeIndicator(); // Dispose indicator when not active
        }

        return () => { // Cleanup on unmount or isActive change
            document.body.style.cursor = 'default';
            window.removeEventListener('pointermove', handleGlobalPointerEvent, { capture: true });
            window.removeEventListener('pointerdown', handleGlobalPointerEvent, { capture: true });
            disposeIndicator();
        };
    }, [isActive, handleGlobalPointerEvent, createIndicator, disposeIndicator]);

    // This component renders nothing in the React tree, only manipulates the Three.js scene directly
    return null;
};

export default ColorPickerTool;
