

import React from 'react';

export type CameraMode = 'HOME' | 'TOP' | 'FOLLOW';
export type EditorTool = 'NONE' | 'ROTATE' | 'PAN' | 'WALL' | 'RAMP' | 'COLOR_LINE' | 'PATH' | 'ROBOT_MOVE';
export type PathShape = 'STRAIGHT' | 'CORNER' | 'CURVED';

// Define a specific layer for robot parts to optimize raycasting
export const ROBOT_LAYER = 1; 

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

// New interface for continuous drawing paths
export interface ContinuousDrawing {
    id: string; // Unique ID for React keys
    points: [number, number, number][]; // Array of vertices for the continuous line
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
  sensorX: number; // Visual sensor projection X
  sensorZ: number; // Visual sensor projection Z
}

// NEW: Interface for the explicit return type of calculateSensorReadings
export interface SensorReadings {
  gyro: number;
  tilt: number;
  roll: number;
  y: number;
  isTouching: boolean;
  physicalHit: boolean;
  distance: number;
  color: string; // This is a string (e.g., hex or name)
  intensity: number;
  rawDecimalColor: number;
  sensorX: number;
  sensorZ: number;
}


export interface SimulationHistory {
    maxDistanceMoved: number;
    touchedWall: boolean;
    detectedColors: string[];
    totalRotation: number;
}

declare global {
  interface Window {
    showBlocklyNumpad: (
      initialValue: string | number, 
      onConfirm: (newValue: number) => void
    ) => void;

    // Modified to pass the Blockly FieldColour instance directly
    showBlocklyColorPicker: (
      field: any // This will be the Blockly.FieldColour instance
    ) => void;
  }
}

// Extend the existing interface or define a new one if this is for internal use
// to include the 'type' for complex zones.
// No direct change to CustomObject itself is needed for this.
