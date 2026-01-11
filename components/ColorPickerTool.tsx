 import React, { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorPickerToolProps {
  onColorSelect: (color: string) => void;
  isActive: boolean;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorSelect, isActive }) => {
  const { gl, scene, camera, raycaster, mouse } = useThree();

  const handleAction = useCallback(() => {
    if (!isActive) return;

    // עדכון ה-Raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // בדיקה מול כל האובייקטים בסצנה
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // סינון אובייקטים טכניים
    const validHit = intersects.find(hit => 
      hit.object.type === 'Mesh' && 
      !hit.object.name.includes('helper') &&
      !hit.object.name.includes('picker')
    );

    if (validHit) {
      const mesh = validHit.object as THREE.Mesh;
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      
      if (material && 'color' in material) {
        const color = (material as any).color as THREE.Color;
        const hex = `#${color.getHexString().toUpperCase()}`;
        console.log("Color Picked:", hex);
        onColorSelect(hex);
      }
    }
  }, [isActive, camera, mouse, raycaster, scene, onColorSelect]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;
    
    // הוספת מאזין אירועים ישירות ל-Canvas של Three.js
    canvas.addEventListener('mousedown', handleAction);
    
    // שינוי סמן העכבר
    canvas.style.cursor = 'crosshair';

    return () => {
      canvas.removeEventListener('mousedown', handleAction);
      canvas.style.cursor = 'default';
    };
  }, [isActive, gl, handleAction]);

  return null; // לא מרנדר JSX כדי למנוע שגיאות React Reconciler
};

export default ColorPickerTool;
