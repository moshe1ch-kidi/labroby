 import React, { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorPickerToolProps {
  onColorSelect: (color: string) => void;
  isActive: boolean;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorSelect, isActive }) => {
  const { gl, scene, camera, raycaster, mouse } = useThree();

  const handleAction = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    // עדכון ה-Raycaster לפי מיקום העכבר
    raycaster.setFromCamera(mouse, camera);
    
    // דגימה של כל האובייקטים בסצנה
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    console.log(`Picker: Total objects hit: ${intersects.length}`);

    if (intersects.length > 0) {
      // נעבור על כל מה שפגענו בו עד שנמצא משהו עם צבע
      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        
        // בדיקה אם זה Mesh ויש לו Material
        if (object instanceof THREE.Mesh && object.material) {
          const mat = Array.isArray(object.material) ? object.material[0] : object.material;
          
          // בדיקה אם יש לצבע ערך
          if (mat && (mat.color || mat.emissive)) {
            const color = mat.color || mat.emissive;
            const hex = `#${color.getHexString().toUpperCase()}`;
            
            console.log(`SUCCESS! Hit object: ${object.name || 'Unnamed'}, Color: ${hex}`);
            onColorSelect(hex);
            return; // מצאנו צבע, אפשר לעצור
          }
        }
      }
    } else {
      console.log("Picker: Clicked into empty space");
    }
  }, [isActive, camera, mouse, raycaster, scene, onColorSelect]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleAction);
    canvas.style.cursor = 'crosshair';

    return () => {
      canvas.removeEventListener('mousedown', handleAction);
      canvas.style.cursor = 'default';
    };
  }, [isActive, gl, handleAction]);

  return null;
};

export default ColorPickerTool;
