import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { RobotState, CameraMode } from '../types';

interface CameraManagerProps {
    robotState: RobotState;
    cameraMode: CameraMode;
    controlsRef: React.MutableRefObject<any>;
}

const CameraManager: React.FC<CameraManagerProps> = ({ robotState, cameraMode, controlsRef }) => {
    const { camera } = useThree();
    const lastRobotPosRef = useRef({ x: 0, z: 0 });

    useEffect(() => {
        // Safety checks - if camera or controls don't exist, exit early
        if (!camera) {
            console.warn("Camera not available");
            return;
        }

        if (!controlsRef.current) {
            console.warn("Controls not available");
            return;
        }

        try {
            if (cameraMode === 'FOLLOW') {
                // Follow camera mode - camera follows the robot
                if (!camera.position) {
                    console.error("Camera position not available");
                    return;
                }

                const robotX = robotState.x;
                const robotZ = robotState.z;
                const robotY = robotState.y || 0;

                // Camera offset from robot
                const cameraDistance = 5;
                const cameraHeight = 3;
                const cameraOffsetZ = -cameraDistance;

                // Calculate rotation-aware camera position
                const rad = (robotState.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                // Position camera behind and above the robot
                const targetCameraX = robotX - sin * cameraDistance;
                const targetCameraY = robotY + cameraHeight;
                const targetCameraZ = robotZ - cos * cameraDistance;

                // Smooth camera movement
                const smoothFactor = 0.1;
                camera.position.x += (targetCameraX - camera.position.x) * smoothFactor;
                camera.position.y += (targetCameraY - camera.position.y) * smoothFactor;
                camera.position.z += (targetCameraZ - camera.position.z) * smoothFactor;

                // Update controls target to follow robot
                if (controlsRef.current.target) {
                    const targetX = robotX;
                    const targetY = robotY + 0.5;
                    const targetZ = robotZ;

                    controlsRef.current.target.x += (targetX - controlsRef.current.target.x) * smoothFactor;
                    controlsRef.current.target.y += (targetY - controlsRef.current.target.y) * smoothFactor;
                    controlsRef.current.target.z += (targetZ - controlsRef.current.target.z) * smoothFactor;

                    if (controlsRef.current.update) {
                        controlsRef.current.update();
                    }
                }

                lastRobotPosRef.current = { x: robotX, z: robotZ };
            }
        } catch (err) {
            console.error("Error in CameraManager:", err);
        }
    }, [robotState, cameraMode, camera, controlsRef]);

    // This component doesn't render anything, it just manages camera state
    return null;
};

export default CameraManager;
