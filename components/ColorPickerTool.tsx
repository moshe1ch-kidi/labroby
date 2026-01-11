import React, { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ColorPickerToolProps {
  onColorSelect: (color: string) => void;
  isActive: boolean;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onColorSelect, isActive }) => {
  const { gl, scene, camera, raycaster } = useThree();

  const handleAction = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    // חישוב מדויק של מיקום העכבר ביחס לקנבס בלבד
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const mouseVector = new THREE.Vector2(x, y);
    
    // עדכון ה-Raycaster עם הוקטור שחישבנו ידנית
    raycaster.setFromCamera(mouseVector, camera);
    
    // בדיקה מול כל הילדים בסצנה (כולל תתי-קבוצות)
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    console.log("Mouse Pos:", x.toFixed(2), y.toFixed(2), "Hits:", intersects.length);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        const obj = hit.object;
        
        // התעלמות מעצמי עזר או מהמשטח השקוף של עצמו
        if (obj.name.includes('helper') || obj.name.includes('picker')) continue;

        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
          
          if (mat && (mat.color || mat.emissive)) {
            const targetColor = mat.color || mat.emissive;
            const hex = `#${targetColor.getHexString().toUpperCase()}`;
            
            console.log(`Bingo! Object: ${obj.name}, Color: ${hex}`);
            onColorSelect(hex);
            return; 
          }
        }
      }
    }
  }, [isActive, camera, gl, raycaster, scene, onColorSelect]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;
    // שימוש ב-pointerdown במקום mousedown לדיוק בטאץ' ועכבר
    canvas.addEventListener('pointerdown', handleAction);
    canvas.style.cursor = 'crosshair';

    return () => {
      canvas.removeEventListener('pointerdown', handleAction);
      canvas.style.cursor = 'default';
    };
  }, [isActive, gl, handleAction]);

  return null;
};

export default ColorPickerTool;
