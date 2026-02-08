
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { RobotState, CameraMode } from '../types';

interface CameraManagerProps {
    robotState: RobotState;
    cameraMode: CameraMode;
    controlsRef: React.MutableRefObject<any>;
}

const CameraManager: React.FC<CameraManagerProps> = ({ robotState, cameraMode, controlsRef }) => {
    const { camera } = useThree();
    const desiredCameraPosition = useRef(new Vector3());
    const desiredCameraTarget = useRef(new Vector3());

    // Handle smooth following in FOLLOW mode
    useFrame(() => {
        if (!controlsRef.current || cameraMode !== 'FOLLOW') return;

        const { x, y, z, rotation } = robotState;
        
        // Target the robot's center
        desiredCameraTarget.current.set(x, y + 0.5, z);

        // Calculate camera position behind the robot
        const distanceBehind = 7;
        const heightAbove = 5;
        const robotRad = rotation * Math.PI / 180;
        
        const camX = x - Math.sin(robotRad) * distanceBehind;
        const camZ = z - Math.cos(robotRad) * distanceBehind;
        
        desiredCameraPosition.current.set(camX, y + heightAbove, camZ);

        // Smoothly move camera and target
        camera.position.lerp(desiredCameraPosition.current, 0.1);
        controlsRef.current.target.lerp(desiredCameraTarget.current, 0.1);
        controlsRef.current.update();
    });

    // Handle mode transitions (One-time setup per mode change)
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

        if (cameraMode === 'HOME') {
            controls.reset();
            // Default home view
            camera.position.set(10, 10, 10);
            controls.target.set(0, 0, 0);
            controls.minDistance = 1.2;
            controls.maxDistance = 60;
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            controls.update();
        } 
        else if (cameraMode === 'TOP') {
            // Force Top View
            camera.position.set(robotState.x, 25, robotState.z);
            controls.target.set(robotState.x, 0, robotState.z);
            
            // Lock rotation for pure top-down experience
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = 0;
            controls.minDistance = 1;
            controls.maxDistance = 100;
            controls.update();
        }
        else if (cameraMode === 'FOLLOW') {
            // Setup FOLLOW constraints
            controls.minDistance = 1;
            controls.maxDistance = 20;
            controls.minPolarAngle = Math.PI / 6; // Limit low angle
            controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going under floor
            
            // Initial snap to position
            const robotRad = robotState.rotation * Math.PI / 180;
            camera.position.set(
                robotState.x - Math.sin(robotRad) * 7,
                robotState.y + 5,
                robotState.z - Math.cos(robotRad) * 7
            );
            controls.target.set(robotState.x, robotState.y + 0.5, robotState.z);
            controls.update();
        }
    }, [cameraMode, controlsRef, camera]);

    return null;
};

export default CameraManager;
