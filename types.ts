
import React from 'react';
import { ThreeElements } from '@react-three/fiber';

export type CameraMode = 'HOME' | 'TOP' | 'FOLLOW';
export type EditorTool = 'NONE' | 'ROTATE' | 'PAN' | 'WALL' | 'RAMP' | 'COLOR_LINE' | 'PATH' | 'ROBOT_MOVE';
export type PathShape = 'STRAIGHT' | 'CORNER' | 'CURVED';

export interface CustomObject {
    id: string;
    type: EditorTool;
    shape?: PathShape;
    x: number;
    z: number;
    width: number;
    length: number;
    color?: string;
    height?: number;
    rotation?: number; 
    opacity?: number;
}

export interface DrawingSegment {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
}

export interface ContinuousDrawing {
    id: string;
    points: [number, number, number][];
    color: string;
}

export interface RobotState {
  x: number;
  y: number; 
  z: number;
  rotation: number; // heading in degrees
  tilt: number; // pitch angle in degrees (forward/backward)
  roll: number; // roll angle in degrees (left/right)
  speed: number; 
  motorLeftSpeed: number; 
  motorRightSpeed: number; 
  ledLeftColor: string;
  ledRightColor: string;
  isMoving: boolean;
  isTouching: boolean;
  penDown: boolean;
  penColor: string;
  sensorX?: number; // Visual sensor projection X
  sensorZ?: number; // Visual sensor projection Z
}

export interface SimulationHistory {
    maxDistanceMoved: number;
    touchedWall: boolean;
    detectedColors: string[];
    totalRotation: number;
}

// Global augmentation to register Three.js intrinsic elements for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }

  interface Window {
    showBlocklyNumpad: (
      initialValue: string | number, 
      onConfirm: (newValue: number) => void,
      position: DOMRect
    ) => void;

    getStageColors: () => string[];
  }
}
