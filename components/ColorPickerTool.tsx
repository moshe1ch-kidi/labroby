import React, { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorPickerToolProps {
  onColorSelect: (color: string) => void;
  isActive: boolean;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorSelect, isActive }) => {
  const { gl, scene, camera, raycaster } = useThree();

  // בדיקה ראשונית אם הכלי בכלל מופעל
  useEffect(() => {
    console.log("ColorPickerTool status: ", isActive ? "ACTIVE" : "INACTIVE");
  }, [isActive]);

  const handleAction = useCallback((event: MouseEvent) => {
    // אם הכלי לא פעיל, אל תעשה כלום
    if (!isActive) return;

    // חישוב המיקום יחסית לקנבס של ה-Three.js
    const rect = gl.domElement.getBoundingClientRect();
    
    // בדיקה אם הלחיצה בכלל הייתה בתוך אזור התצוגה התלת-ממדית
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) return;

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const mouseVector = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouseVector, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // זה חייב להופיע בקונסול אם לחצת בתוך אזור התלת-ממד!
    console.log(`PICKER CLICKED! Hits: ${intersects.length}`);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        const obj = hit.object;
        if (obj.name.includes('helper') || obj.name.includes('picker')) continue;

        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
          if (mat && (mat.color || mat.emissive)) {
            const targetColor = mat.color || mat.emissive;
            const hex = `#${targetColor.getHexString().toUpperCase()}`;
            console.log("FOUND COLOR:", hex);
            onColorSelect(hex);
            return; 
          }
        }
      }
    }
  }, [isActive, camera, gl, raycaster, scene, onColorSelect]);

  useEffect(() => {
    if (!isActive) return;

    // הצמדה ל-window כדי לעקוף חסימות של אלמנטים אחרים ב-DOM
    window.addEventListener('pointerdown', handleAction, true);
    document.body.style.cursor = 'crosshair';

    return () => {
      window.removeEventListener('pointerdown', handleAction, true);
      document.body.style.cursor = 'default';
    };
  }, [isActive, handleAction]);

  return null;
};

export default ColorPickerTool;
