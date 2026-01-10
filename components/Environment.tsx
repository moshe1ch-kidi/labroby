
import React, { useMemo } from 'react';
import { Grid, Environment as DreiEnvironment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CustomObject, RobotState } from '../types'; // Removed ROBOT_LAYER as it's not needed here directly
import { ThreeEvent } from '@react-three/fiber'; // Import ThreeEvent here

interface EnvironmentProps {
    challengeId?: string;
    customObjects?: CustomObject[];
    selectedObjectId?: string | null;
    onObjectSelect?: (id: string) => void;
    onPointerDown?: (e: ThreeEvent<MouseEvent>) => void; // Explicitly type
    onPointerMove?: (e: ThreeEvent<MouseEvent>) => void; // Explicitly type
    onPointerUp?: (e: ThreeEvent<MouseEvent>) => void; // Explicitly type
    robotState: RobotState; // Changed from optional to required
}

const EllipseMarker = ({ centerX, centerZ, radiusX, radiusZ, angle, width, color }: any) => {
    // Ensure all inputs are finite numbers
    const safeCenterX: number = Number.isFinite(centerX) ? centerX : 0;
    const safeCenterZ: number = Number.isFinite(centerZ) ? centerZ : 0;
    const safeRadiusX: number = Number.isFinite(radiusX) && radiusX > 0 ? radiusX : 1;
    const safeRadiusZ: number = Number.isFinite(radiusZ) && radiusZ > 0 ? radiusZ : 1;
    const safeAngle: number = Number.isFinite(angle) ? angle : 0;
    const safeWidth: number = Number.isFinite(width) && width > 0 ? width : 0.1;

    const x_raw = safeRadiusX * Math.cos(safeAngle);
    const z_raw = safeRadiusZ * Math.sin(safeAngle);
    const x: number = Number.isFinite(x_raw) ? x_raw : 0;
    const z: number = Number.isFinite(z_raw) ? z_raw : 0;
    
    // Ensure denominators are not zero before division
    const safeRadXSq: number = safeRadiusX * safeRadiusX;
    const safeRadZSq: number = safeRadiusZ * safeRadiusZ;

    const nx_raw = (safeRadXSq > 0 ? x / safeRadXSq : 0);
    const nz_raw = (safeRadZSq > 0 ? z / safeRadZSq : 0);
    const nx: number = Number.isFinite(nx_raw) ? nx_raw : 0;
    const nz: number = Number.isFinite(nz_raw) ? nz_raw : 0;

    const rotation_raw = Number.isFinite(nx) && Number.isFinite(nz) ? Math.atan2(nx, -nz) : 0; // Ensure rotation is finite
    const rotation: number = Number.isFinite(rotation_raw) ? rotation_raw : 0;

    return (
        <mesh name="challenge-marker" position={[safeCenterX + x, 0.025, safeCenterZ + z]} rotation={[-Math.PI / 2, 0, rotation]}>
            <planeGeometry args={[safeWidth, 0.45]} />
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

const UniformEllipse = ({ x = 0, y = 0, z = 0, radiusX = 12, radiusZ = 6, width = 0.4, segments = 128, color = "black" }: any) => {
    // Ensure all inputs are finite numbers and positive for dimensions
    const safeX: number = Number.isFinite(x) ? x : 0;
    const safeY: number = Number.isFinite(y) ? y : 0;
    const safeZ: number = Number.isFinite(z) ? z : 0;
    const safeRadiusX: number = Number.isFinite(radiusX) && radiusX > 0 ? radiusX : 1;
    const safeRadiusZ: number = Number.isFinite(radiusZ) && radiusZ > 0 ? radiusZ : 1;
    const safeWidth: number = Number.isFinite(width) && width > 0 ? width : 0.1;
    const safeSegments: number = Number.isFinite(segments) && segments > 0 ? Math.floor(segments) : 128; // Ensure integer segments

    const geometry = useMemo(() => {
        const vertices = [];
        const indices = [];
        for (let i = 0; i <= safeSegments; i++) {
            const t: number = (i / safeSegments) * Math.PI * 2;
            const ct = Math.cos(t); const st = Math.sin(t);
            const px_raw = safeRadiusX * ct; const pz_raw = safeRadiusZ * st;
            const px: number = Number.isFinite(px_raw) ? px_raw : 0;
            const pz: number = Number.isFinite(pz_raw) ? pz_raw : 0;

            // Ensure denominators are not zero
            const safeRadXSq: number = safeRadiusX * safeRadiusX;
            const safeRadZSq: number = safeRadiusZ * safeRadiusZ;

            const nx_raw = (safeRadXSq > 0 ? (2 * px) / safeRadXSq : 0);
            const nz_raw = (safeRadZSq > 0 ? (2 * pz) / safeRadZSq : 0);
            const nx: number = Number.isFinite(nx_raw) ? nx_raw : 0;
            const nz: number = Number.isFinite(nz_raw) ? nz_raw : 0;

            const mag_raw = Math.sqrt(nx * nx + nz * nz);
            const mag: number = Number.isFinite(mag_raw) && mag_raw > 0 ? mag_raw : 1;

            const nnx = nx / mag; const nnz = nz / mag;
            const halfW = safeWidth / 2;
            
            vertices.push(px + (Number.isFinite(nnx) ? nnx : 0) * halfW, 0, pz + (Number.isFinite(nnz) ? nnz : 0) * halfW); 
            vertices.push(px - (Number.isFinite(nnx) ? nnx : 0) * halfW, 0, pz - (Number.isFinite(nnz) ? nnz : 0) * halfW); 
            if (i < safeSegments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setIndex(indices); geo.computeVertexNormals(); return geo;
    }, [safeRadiusX, safeRadiusZ, safeWidth, safeSegments]);
    return (
        <mesh name="challenge-path" geometry={geometry} position={[safeX, safeY, safeZ]} receiveShadow>
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
    );
};

const SimulationEnvironment: React.FC<EnvironmentProps> = ({ 
    challengeId, 
    customObjects = [], 
    selectedObjectId,
    onObjectSelect,
    onPointerDown, 
    onPointerMove, 
    onPointerUp,
    robotState,
}) => {
  const config = useMemo(() => {
      const isRoomNav = challengeId === 'c1';
      const isLineTrack = ['c11', 'c10_lines'].includes(challengeId || '');
      const isEllipseTrack = challengeId === 'c12';
      const isFrontWall = ['c10', 'c16', 'c19', 'c20'].includes(challengeId || '');
      const isLineFollow = ['c21'].includes(challengeId || '');
      const isSlope = challengeId === 'c3';
      const isAutoLevel = challengeId === 'c18';
      const isGrayRoad = ['c10', 'c10_lines', 'c11', 'c9'].includes(challengeId || '');
      const isComplexPath = ['c14', 'c15'].includes(challengeId || '');
      return { isRoomNav, isLineTrack, isFrontWall, isLineFollow, isSlope, isAutoLevel, isEllipseTrack, isGrayRoad, isComplexPath };
  }, [challengeId]);

  return (
    <>
      <DreiEnvironment preset="city" />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      
      <mesh 
        name="ground-plane"
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]} 
        receiveShadow 
        // Reverted to always attach pointer events to ground-plane.
        // ColorPickerTool's interaction plane will be positioned above it and handles stopping propagation.
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e) => { e.stopPropagation(); if (onObjectSelect) onObjectSelect("GROUND"); }} 
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Grid name="grid-helper" infiniteGrid={false} args={[100, 100]} fadeDistance={50} sectionSize={5} cellSize={1} sectionColor="#ff4d4d" cellColor="#ffcccc" position={[0, 0.01, 0]} />
      <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
      
      <mesh name="start-marker" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.4, 1.5, 4, 1, Math.PI/4, Math.PI * 2]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Sensor position display - robotState is now guaranteed to be defined */}
      <group position={[
          Number.isFinite(robotState.sensorX) ? robotState.sensorX : 0, 
          0.03, 
          Number.isFinite(robotState.sensorZ) ? robotState.sensorZ : 0
      ]}> 
          <mesh rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[0, 0.1, 16]} />
              <meshBasicMaterial color="#ec4899" transparent opacity={0.6} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[0.08, 0.12, 16]} />
              <meshBasicMaterial color="#ec4899" toneMapped={false} />
          </mesh>
      </group>

      {customObjects.map((obj) => {
          const isSelected = obj.id === selectedObjectId;
          const handleSelect = (e: ThreeEvent<MouseEvent>) => { 
            e.stopPropagation(); 
            if (onObjectSelect) onObjectSelect(obj.id); 
          };

          // Sanitize obj properties before passing to mesh geometries/positions
          const safeObjX: number = typeof obj.x === 'number' && Number.isFinite(obj.x) ? obj.x : 0;
          const safeObjZ: number = typeof obj.z === 'number' && Number.isFinite(obj.z) ? obj.z : 0;
          const safeObjRotation: number = typeof obj.rotation === 'number' && Number.isFinite(obj.rotation) ? obj.rotation : 0;
          const safeObjWidth: number = typeof obj.width === 'number' && Number.isFinite(obj.width) && obj.width > 0 ? obj.width : 0.1;
          const safeObjLength: number = typeof obj.length === 'number' && Number.isFinite(obj.length) && obj.length > 0 ? obj.length : 0.1;
          const safeObjHeight: number = typeof obj.height === 'number' && Number.isFinite(obj.height) && (obj.height as number) >= 0 ? (obj.height as number) : 0.1;
          const safeObjOpacity: number = typeof obj.opacity === 'number' && Number.isFinite(obj.opacity) ? obj.opacity : 1;


          return (
            <group key={obj.id} position={[safeObjX, 0, safeObjZ]} rotation={[0, safeObjRotation, 0]}>
                {obj.type === 'WALL' && (
                    <mesh name="custom-wall" position={[0, 0.5, 0]} castShadow receiveShadow onClick={handleSelect}>
                        <boxGeometry args={[safeObjWidth, 1, safeObjLength]} />
                        <meshStandardMaterial color={obj.color || "#ef4444"} roughness={0.2} transparent opacity={safeObjOpacity} />
                        {isSelected && ( <mesh scale={[1.02, 1.02, 1.02]}><boxGeometry args={[safeObjWidth, 1, safeObjLength]} /><meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.5} /></mesh> )}
                    </mesh>
                )}
                {obj.type === 'RAMP' && (
                    <group name="custom-ramp" onClick={handleSelect}>
                        {(() => {
                            // Ensure section and slopeL are calculated with finite, positive numbers
                            const section: number = safeObjLength / 3;
                            const h: number = safeObjHeight; // Use the sanitized height
                            const slopeL: number = Number.isFinite(section) && Number.isFinite(h) ? Math.sqrt(section * section + h * h) : 0.1;
                            const t = 0.05; // עובי המשטח
                            const slopeAngle: number = Number.isFinite(h) && Number.isFinite(section) && section !== 0 ? Math.atan2(h, section) : 0;
                            
                            return (
                                <>
                                    {/* משטח עלייה */}
                                    <mesh rotation={[-slopeAngle, 0, 0]} position={[0, h/2, -section]}>
                                        <boxGeometry args={[safeObjWidth, t, slopeL]} />
                                        <meshStandardMaterial color={obj.color || "#334155"} transparent opacity={safeObjOpacity} />
                                    </mesh>
                                    {/* משטח עליון ישר */}
                                    <mesh position={[0, h, 0]}>
                                        <boxGeometry args={[safeObjWidth, t, section]} />
                                        <meshStandardMaterial color={obj.color || "#475569"} transparent opacity={safeObjOpacity} />
                                    </mesh>
                                    {/* משטח ירידה */}
                                    <mesh rotation={[slopeAngle, 0, 0]} position={[0, h/2, section]}>
                                        <boxGeometry args={[safeObjWidth, t, slopeL]} />
                                        <meshStandardMaterial color={obj.color || "#334155"} transparent opacity={safeObjOpacity} />
                                    </mesh>
                                    {/* גוף מילוי מתחת למשטח הישר */}
                                    <mesh position={[0, h/2, 0]}>
                                        <boxGeometry args={[safeObjWidth, h, section]} />
                                        <meshStandardMaterial color={obj.color || "#1e293b"} transparent opacity={safeObjOpacity * 0.4} />
                                    </mesh>
                                </>
                            );
                        })()}
                    </group>
                )}
                {obj.type === 'COLOR_LINE' && (
                    <mesh name="custom-marker" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} onClick={handleSelect}>
                        <planeGeometry args={[safeObjWidth, safeObjLength]} />
                        <meshBasicMaterial color={obj.color || '#FF0000'} transparent opacity={safeObjOpacity} />
                    </mesh>
                )}
                {obj.type === 'PATH' && (
                    <group name="custom-path" onClick={handleSelect}>
                        {(!obj.shape || obj.shape === 'STRAIGHT') && (
                            <>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow><planeGeometry args={[safeObjWidth, safeObjLength]} /><meshBasicMaterial color="black" transparent opacity={safeObjOpacity} /></mesh>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><planeGeometry args={[0.2, safeObjLength]} /><meshBasicMaterial color={obj.color || "#FFFF00"} transparent opacity={safeObjOpacity} /></mesh>
                            </>
                        )}
                        {obj.shape === 'CORNER' && (
                            <>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow><planeGeometry args={[safeObjWidth, safeObjWidth]} /><meshBasicMaterial color="black" transparent opacity={safeObjOpacity} /></mesh>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[safeObjWidth/4 - 0.05, 0.025, 0]}><planeGeometry args={[(safeObjWidth/2 + 0.1), 0.2]} /><meshBasicMaterial color={obj.color || "#FFFF00"} transparent opacity={safeObjOpacity} /></mesh>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -safeObjWidth/4 + 0.05]}><planeGeometry args={[0.2, (safeObjWidth/2 + 0.1)]} /><meshBasicMaterial color={obj.color || "#FFFF00"} transparent opacity={safeObjOpacity} /></mesh>
                            </>
                        )}
                        {obj.shape === 'CURVED' && (
                            <>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-safeObjLength/2, 0.02, 0]}><ringGeometry args={[(safeObjLength/2 - safeObjWidth/2), (safeObjLength/2 + safeObjWidth/2), 64, 1, 0, Math.PI/2]} /><meshBasicMaterial color="black" transparent opacity={safeObjOpacity} /></mesh>
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-safeObjLength/2, 0.025, 0]}><ringGeometry args={[(safeObjLength/2 - 0.1), (safeObjLength/2 + 0.1), 64, 1, 0, Math.PI/2]} /><meshBasicMaterial color={obj.color || "#FFFF00"} transparent opacity={safeObjOpacity} /></mesh>
                            </>
                        )}
                        {isSelected && ( <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.03, 0]}><planeGeometry args={[(safeObjWidth + 0.2), ((obj.shape === 'CORNER' ? safeObjWidth : safeObjLength) + 0.2)]} /><meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.3} /></mesh> )}
                    </group>
                )}
            </group>
          );
      })}

      {/* Reintroduced environment elements from the working version */}
      {config.isGrayRoad && (
          <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -7.5]} receiveShadow><planeGeometry args={[2.5, 15]} /><meshStandardMaterial color="#64748b" roughness={0.8} /></mesh>
      )}

      {config.isComplexPath && (
          <group position={[0, 0, 0]}>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -7.5]} receiveShadow><planeGeometry args={[3, 16]} /><meshStandardMaterial color="#94a3b8" roughness={0.8} /></mesh>
              <mesh name="challenge-marker" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -11]}><planeGeometry args={[3, 3]} /><meshBasicMaterial color="#0000FF" /></mesh>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.015, -11]} receiveShadow><planeGeometry args={[3, 3]} /><meshStandardMaterial color="#94a3b8" roughness={0.8} /></mesh>
              <mesh name="challenge-marker" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -5]}><planeGeometry args={[3, 3]} /><meshBasicMaterial color="#FF0000" /></mesh>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.015, -5]} receiveShadow><planeGeometry args={[3, 3]} /><meshStandardMaterial color="#94a3b8" roughness={0.8} /></mesh>
              <Text position={[0, 0.1, -1]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="white">START</Text>
          </group>
      )}

      {config.isRoomNav && (
          <group position={[0, 0, 0]}>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -5]} receiveShadow><planeGeometry args={[2.5, 10]} /><meshStandardMaterial color="#64748b" roughness={0.8} /></mesh>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -10]} receiveShadow><planeGeometry args={[2.5, 2.5]} /><meshStandardMaterial color="#64748b" roughness={0.8} /></mesh>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[3.75, 0.03, -10]} receiveShadow><planeGeometry args={[5, 2.5]} /><meshStandardMaterial color="#64748b" roughness={0.8} /></mesh>
              <Text position={[0, 0.1, -1]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="white">START</Text>
              <mesh name="challenge-marker" rotation={[-Math.PI / 2, 0, 0]} position={[6.25, 0.04, -10]}><ringGeometry args={[0.8, 1.0, 32]} /><meshBasicMaterial color="#ff0000" /></mesh>
              <Text position={[6.25, 0.1, -10]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.4} color="#ff0000">FINISH</Text>
          </group>
      )}

      {config.isAutoLevel && (
          <group position={[0, 0, 0]}>
              <mesh rotation={[0.523, 0, 0]} position={[0, 0.86 - 0.05, -2]} receiveShadow castShadow><boxGeometry args={[4.2, 0.1, 3.46]} /><meshStandardMaterial color="#334155" /></mesh>
              <mesh position={[0, 1.73 - 0.05, -5.5]} receiveShadow castShadow><boxGeometry args={[4.2, 0.1, 4]} /><meshStandardMaterial color="#475569" /></mesh>
              <mesh rotation={[-0.523, 0, 0]} position={[0, 0.86 - 0.05, -9]} receiveShadow castShadow><boxGeometry args={[4.2, 0.1, 3.46]} /><meshStandardMaterial color="#334155" /></mesh>
              <mesh name="road-background" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -14.5]} receiveShadow><planeGeometry args={[4.2, 8]} /><meshStandardMaterial color="#64748b" roughness={0.8} /></mesh>
              <mesh name="challenge-marker" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -17.5]}><planeGeometry args={[4.2, 0.5]} /><meshBasicMaterial color="#ff0000" /></mesh>
              <Text position={[0, 0.1, -0.4]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="white">STEEP RAMP</Text>
          </group>
      )}

      {config.isSlope && (
          <group position={[0, 0, 0]}>
              <mesh name="road-background" rotation={[0.0665, 0, 0]} position={[0, 0.5 - 0.025, -9]} receiveShadow castShadow><boxGeometry args={[4.2, 0.05, 15]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          </group>
      )}

      {config.isFrontWall && (
          <group position={[0, 0.5, -10]}><mesh name="challenge-wall" receiveShadow castShadow><boxGeometry args={[6, 1, 0.5]} /><meshStandardMaterial color="#ff0000" roughness={0.2} /></mesh></group>
      )}

      {config.isLineFollow && (
         <group position={[-6, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><mesh name="challenge-path"><ringGeometry args={[5.8, 6.2, 128]} /><meshBasicMaterial color="black" /></mesh></group>
      )}

      {config.isEllipseTrack && (
         <group>
            <UniformEllipse x={0} y={0.02} z={-8} radiusX={9} radiusZ={6} width={0.4} />
            <EllipseMarker centerX={0} centerZ={-8} radiusX={9} radiusZ={6} angle={0} width={0.08} color="#FF0000" />
            <EllipseMarker centerX={0} centerZ={-8} radiusX={9} radiusZ={6} angle={Math.PI / 2} width={0.08} color="#0000FF" />
            <EllipseMarker centerX={0} centerZ={-8} radiusX={9} radiusZ={6} angle={Math.PI} width={0.08} color="#22C55E" />
            <EllipseMarker centerX={0} centerZ={-8} radiusX={9} radiusZ={6} angle={3 * Math.PI / 2} width={0.08} color="#FFFF00" />
         </group>
      )}
    </>
  );
};

export default SimulationEnvironment;
