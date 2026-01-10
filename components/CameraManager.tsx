
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
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

    useFrame(() => {
        if (!controlsRef.current) return; // Add null check for controlsRef.current
        if (cameraMode === 'FOLLOW') {
            const { x, y, z, rotation } = robotState;
            
            // Target the robot's center, slightly above ground
            // We use robotState.y for accurate vertical positioning on ramps
            desiredCameraTarget.current.set(x, y + 0.5, z);

            // Calculate camera position behind the robot
            const distanceBehind = 7; // How far behind the robot
            const heightAbove = 5;    // How high above the robot
            
            const robotRad = rotation * Math.PI / 180; // Convert degrees to radians
            // Calculate camera X and Z based on robot's rotation
            const camX = x - Math.sin(robotRad) * distanceBehind;
            const camZ = z - Math.cos(robotRad) * distanceBehind;
            
            // Set desired camera position, matching robot's Y for ramps
            desiredCameraPosition.current.set(camX, y + heightAbove, camZ);

            // Smoothly move camera and target using lerp
            camera.position.lerp(desiredCameraPosition.current, 0.1); // Adjust lerp factor for smoothness
            controlsRef.current.target.lerp(desiredCameraTarget.current, 0.1);

            controlsRef.current.update(); // Important to update OrbitControls after manual position/target changes
        }
    });

    useEffect(() => {
        if (!controlsRef.current) return; // Add null check for controlsRef.current
        // When switching to FOLLOW mode, immediately set the camera to the desired position/target
        // to avoid a large jump from the previous mode. This also applies when robotState changes while in FOLLOW mode.
        if (cameraMode === 'FOLLOW') {
            const { x, y, z, rotation } = robotState;
            const distanceBehind = 7; 
            const heightAbove = 5;    
            const robotRad = rotation * Math.PI / 180;
            const camX = x - Math.sin(robotRad) * distanceBehind;
            const camZ = z - Math.cos(robotRad) * distanceBehind;
            
            // Immediately set the camera's position and target
            controlsRef.current.object.position.set(camX, y + heightAbove, camZ);
            controlsRef.current.target.set(x, y + 0.5, z);
            controlsRef.current.update();
        } else if (cameraMode === 'HOME') {
            controlsRef.current.reset(); // Resets to initial position set in Canvas
            controlsRef.current.minDistance = 1.2; // Restore default zoom limits
            controlsRef.current.maxDistance = 60;
            controlsRef.current.update();
        } else if (cameraMode === 'TOP') {
            controlsRef.current.object.position.set(0, 20, 0); // Position high up
            controlsRef.current.target.set(0, 0, 0); // Look at the origin
            controlsRef.current.minDistance = 0.1; // Allow closer zoom for top view
            controlsRef.current.maxDistance = 100; // Allow further zoom out
            controlsRef.current.update();
        }
    }, [cameraMode, robotState, controlsRef]); // Dependencies for this effect

    return null; // This component doesn't render anything visually in the scene
};

export default CameraManager;
