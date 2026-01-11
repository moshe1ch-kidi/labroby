 import React, { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorPickerToolProps {
    onColorHover: (hexColor: string) => void;
    onColorSelect: (hexColor: string) => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorHover, onColorSelect }) => {
    const { raycaster, scene, camera, mouse, gl } = useThree();
    
    // רפרנסים פנימיים - לא מנוהלים ע"י React State כדי למנוע קריסות
    const indicatorRef = useRef<THREE.Group | null>(null);

    useEffect(() => {
        // יצירת האינדיקטור ידנית בתוך ה-Scene
        const group = new THREE.Group();
        const ringGeo = new THREE.RingGeometry(0.15, 0.22, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0xec4899, 
            transparent: true, 
            opacity: 0.8,
            depthTest: false 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);
        
        group.visible = false;
        scene.add(group);
        indicatorRef.current = group;

        return () => {
            scene.remove(group);
            ringGeo.dispose();
            ringMat.dispose();
        };
    }, [scene]);

    const performRaycast = useCallback(() => {
        if (!camera || !mouse) return null;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const hit of intersects) {
            const obj = hit.object;
            // התעלמות מעצמי עזר
            if (obj.name.includes('picker') || obj.name.includes('helper') || obj.userData?.isRobotPart) continue;

            if (obj instanceof THREE.Mesh && obj.material) {
                const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
                if (mat && 'color' in mat) {
                    return {
                        hex: "#" + (mat.color as THREE.Color).getHexString().toUpperCase(),
                        point: hit.point
                    };
                }
            }
        }
        return null;
    }, [camera, mouse, raycaster, scene.children]);

    // ניהול אירועים ישירות על ה-Canvas
    useEffect(() => {
        const handleMove = () => {
            const result = performRaycast();
            if (result && indicatorRef.current) {
                indicatorRef.current.position.copy(result.point);
                indicatorRef.current.position.y += 0.05;
                indicatorRef.current.visible = true;
                onColorHover(result.hex);
            } else if (indicatorRef.current) {
                indicatorRef.current.visible = false;
            }
        };

        const handleClick = () => {
            const result = performRaycast();
            if (result) onColorSelect(result.hex);
        };

        gl.domElement.addEventListener('pointermove', handleMove);
        gl.domElement.addEventListener('click', handleClick);

        return () => {
            gl.domElement.removeEventListener('pointermove', handleMove);
            gl.domElement.removeEventListener('click', handleClick);
            if (indicatorRef.current) indicatorRef.current.visible = false;
        };
    }, [gl.domElement, performRaycast, onColorHover, onColorSelect]);

    return null; // הקומפוננטה לא מרנדרת שום JSX של React Three Fiber
};

export default ColorPickerTool;
