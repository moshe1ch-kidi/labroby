import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Environment, ContactShadows, useCursor } from '@react-three/drei';
import { Save, FolderOpen, Plus, Trash2, Box, Square, Move, RotateCw, Download, Upload, X, MousePointer2, Map, LayoutGrid, Type, CornerDownRight, Undo2, Hand, FlipHorizontal, FlipVertical } from 'lucide-react';
import * as THREE from 'three';
import { CustomObject, PathShape, EditorTool } from '../types';

// --- Types for Editor ---
interface MissionMeta {
    title: string;
    description: string;
    startPosition: { x: number, y: number, z: number };
    startRotation: number;
}

// --- Default Templates ---
const DEFAULT_WALL: Partial<CustomObject> = { width: 0.5, length: 2, height: 1, color: '#ef4444', type: 'WALL' };
const DEFAULT_PATH: Partial<CustomObject> = { width: 2.8, length: 5, color: '#FFFF00', type: 'PATH', shape: 'STRAIGHT' };
const DEFAULT_CORNER: Partial<CustomObject> = { width: 2.8, length: 2.8, color: '#FFFF00', type: 'PATH', shape: 'CORNER' };
const DEFAULT_CURVE: Partial<CustomObject> = { width: 2.8, length: 8, color: '#FFFF00', type: 'PATH', shape: 'CURVED' }; // Length 8 implies radius 4 (d=8)
const DEFAULT_RAMP: Partial<CustomObject> = { width: 2.8, length: 4, height: 1, color: '#334155', type: 'RAMP' };
const DEFAULT_ZONE: Partial<CustomObject> = { width: 2.5, length: 0.1, color: '#22c55e', type: 'COLOR_LINE' };

// --- 3D Scene Components ---

// Renders the objects in the editor scene
// Fix: Use React.FC to properly handle React props in TypeScript
const EditorSceneObjects: React.FC<{ 
    objects: CustomObject[], 
    selectedId: string | null, 
    onSelect: (id: string | null) => void,
    onDragStart: (id: string, e: ThreeEvent<PointerEvent>) => void
}> = ({ 
    objects, 
    selectedId, 
    onSelect,
    onDragStart
}) => {
    return (
        <group>
            {objects.map((obj) => (
                <EditorObjectMesh 
                    key={obj.id} 
                    data={obj} 
                    isSelected={selectedId === obj.id} 
                    onSelect={() => onSelect(obj.id)}
                    onDragStart={(e) => onDragStart(obj.id, e)} 
                />
            ))}
        </group>
    );
};

// Individual object mesh logic
// Fix: Use React.FC to properly handle React props like key in TypeScript
const EditorObjectMesh: React.FC<{ data: CustomObject, isSelected: boolean, onSelect: () => void, onDragStart: (e: ThreeEvent<PointerEvent>) => void }> = ({ data, isSelected, onSelect, onDragStart }) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    const handlePointerOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); };
    const handlePointerOut = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(false); };
    
    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => { 
        e.stopPropagation(); 
        onSelect();
        onDragStart(e);
    };

    // Material for selection highlight
    const highlightMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3b82f6', wireframe: true, depthTest: false }), []);

    return (
        <group 
            position={[data.x, 0, data.z]} 
            rotation={[0, data.rotation || 0, 0]}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerDown={handlePointerDown}
        >
            {/* --- Geometry based on Type --- */}
            {data.type === 'WALL' && (
                <mesh position={[0, (data.height || 1)/2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[data.width, data.height || 1, data.length]} />
                    <meshStandardMaterial color={data.color} />
                </mesh>
            )}
            
            {data.type === 'COLOR_LINE' && (
                 <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                    <planeGeometry args={[data.width, data.length]} />
                    <meshBasicMaterial color={data.color} side={THREE.DoubleSide} />
                </mesh>
            )}

            {data.type === 'PATH' && (
                <group>
                    {/* Visual Logic matching Environment.tsx */}
                    {(!data.shape || data.shape === 'STRAIGHT') && (
                        <>
                            {/* Base */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                                <planeGeometry args={[data.width, data.length]} />
                                <meshBasicMaterial color="black" />
                            </mesh>
                            {/* Stripe */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                                <planeGeometry args={[data.width * 0.1, data.length]} />
                                <meshBasicMaterial color={data.color} />
                            </mesh>
                        </>
                    )}
                    {data.shape === 'CORNER' && (
                        <>
                            {/* Base */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                                <planeGeometry args={[data.width, data.width]} />
                                <meshBasicMaterial color="black" />
                            </mesh>
                            {/* Stripes (L Shape) */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[data.width/4, 0.02, 0]}>
                                <planeGeometry args={[data.width * 0.1, data.width/2 + 0.1]} />
                                <meshBasicMaterial color={data.color} />
                            </mesh>
                            <mesh rotation={[-Math.PI / 2, 0, Math.PI/2]} position={[0, 0.02, -data.width/4]}>
                                <planeGeometry args={[data.width * 0.1, data.width/2 + 0.1]} />
                                <meshBasicMaterial color={data.color} />
                            </mesh>
                        </>
                    )}
                    {data.shape === 'CURVED' && (
                        <>
                            {/* Base Ring Segment */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-data.length/2, 0.01, 0]}>
                                <ringGeometry args={[data.length/2 - data.width/2, data.length/2 + data.width/2, 32, 1, 0, Math.PI/2]} />
                                <meshBasicMaterial color="black" side={THREE.DoubleSide} />
                            </mesh>
                            {/* Stripe Arc */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-data.length/2, 0.02, 0]}>
                                <ringGeometry args={[data.length/2 - 0.1, data.length/2 + 0.1, 32, 1, 0, Math.PI/2]} />
                                <meshBasicMaterial color={data.color} side={THREE.DoubleSide} />
                            </mesh>
                        </>
                    )}
                    {data.shape === 'CURVED_RIGHT' && (
                        <>
                            {/* Base Ring Segment */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[data.length/2, 0.01, 0]}>
                                <ringGeometry args={[data.length/2 - data.width/2, data.length/2 + data.width/2, 32, 1, Math.PI/2, Math.PI/2]} />
                                <meshBasicMaterial color="black" side={THREE.DoubleSide} />
                            </mesh>
                            {/* Stripe Arc */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[data.length/2, 0.02, 0]}>
                                <ringGeometry args={[data.length/2 - 0.1, data.length/2 + 0.1, 32, 1, Math.PI/2, Math.PI/2]} />
                                <meshBasicMaterial color={data.color} side={THREE.DoubleSide} />
                            </mesh>
                        </>
                    )}
                </group>
            )}
            
            {data.type === 'RAMP' && (
                <group>
                    <mesh position={[0, (data.height || 1)/2, 0]} rotation={[-Math.atan2(data.height||1, data.length), 0, 0]}>
                        <boxGeometry args={[data.width, 0.1, Math.sqrt(Math.pow(data.length,2) + Math.pow(data.height||1, 2))]} />
                        <meshStandardMaterial color={data.color} />
                    </mesh>
                     {/* Fill underneath */}
                    <mesh position={[0, (data.height || 1)/4, data.length/4]}>
                         <boxGeometry args={[data.width - 0.1, (data.height||1)/2, data.length/2]} />
                         <meshStandardMaterial color={data.color} transparent opacity={0.5} />
                    </mesh>
                </group>
            )}

            {/* Selection Highlight */}
            {(isSelected || hovered) && (
                <mesh position={[0, (data.height || 0.1)/2 + 0.05, 0]}>
                     <boxGeometry args={[data.width + 0.1, (data.height || 0.1) + 0.1, data.length + 0.1]} />
                     <primitive object={highlightMaterial} attach="material" />
                </mesh>
            )}
        </group>
    );
};

// Controls for the selected object (Move/Rotate)
const ObjectTransformer = ({ 
    object, 
    mode, 
    onUpdate 
}: { 
    object: CustomObject, 
    mode: 'translate' | 'rotate' | 'drag',
    onUpdate: (updates: Partial<CustomObject>) => void 
}) => {
    // We create a dummy object to attach the controls to, ensuring we don't mess up the React tree state directly
    const ref = useRef<THREE.Group>(null);
    const { scene } = useThree();

    if (mode === 'drag') {
        return <group ref={ref} position={[object.x, 0, object.z]} rotation={[0, object.rotation || 0, 0]} />;
    }

    return (
        <>
            <group ref={ref} position={[object.x, 0, object.z]} rotation={[0, object.rotation || 0, 0]} />
            <TransformControls 
                object={ref.current as THREE.Object3D}
                mode={mode}
                translationSnap={0.5}
                rotationSnap={Math.PI / 12} // 15 degrees
                onMouseUp={() => {
                    if (ref.current) {
                        onUpdate({
                            x: ref.current.position.x,
                            z: ref.current.position.z,
                            rotation: ref.current.rotation.y
                        });
                    }
                }}
            />
        </>
    );
};

const RobotStartMarker = ({ position, rotation, isSelected, onClick, onDragStart }: { position: {x:number, z:number}, rotation: number, isSelected: boolean, onClick: () => void, onDragStart?: (e: ThreeEvent<PointerEvent>) => void }) => {
    return (
        <group 
            position={[position.x, 0, position.z]} 
            rotation={[0, rotation * Math.PI / 180, 0]} 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerDown={(e) => { if (onDragStart) { e.stopPropagation(); onDragStart(e); } }}
        >
             {/* Ghost Robot Body */}
             <group position={[0, 0.3, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[1.4, 0.4, 1.8]} />
                    <meshStandardMaterial color="#3b82f6" transparent opacity={0.5} />
                </mesh>
                <mesh position={[0, 0.2, -0.8]}>
                    <boxGeometry args={[0.5, 0.2, 0.2]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
                <arrowHelper args={[new THREE.Vector3(0,0,-1), new THREE.Vector3(0,0.5,0), 2, 0xffff00]} />
             </group>
             {isSelected && (
                 <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                     <ringGeometry args={[1.5, 1.6, 32]} />
                     <meshBasicMaterial color="#ef4444" toneMapped={false} />
                 </mesh>
             )}
        </group>
    );
};

// --- Main Component ---
const MissionEditor: React.FC = () => {
    const [objects, setObjects] = useState<CustomObject[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectionType, setSelectionType] = useState<'OBJECT' | 'ROBOT' | null>(null);
    
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'drag'>('drag');
    const [missionMeta, setMissionMeta] = useState<MissionMeta>({ 
        title: 'My Custom Mission', 
        description: 'Navigate the robot to the target.', 
        startPosition: { x: 0, y: 0, z: 0 }, 
        startRotation: 180 
    });

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const orbitControlsRef = useRef<any>(null);

    // --- Actions ---
    const addObject = (template: Partial<CustomObject>) => {
        const newObj: CustomObject = {
            id: `obj_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            x: 0,
            z: 0,
            rotation: 0,
            width: 1,
            length: 1,
            type: 'WALL',
            ...template
        };
        setObjects([...objects, newObj]);
        setSelectedId(newObj.id);
        setSelectionType('OBJECT');
    };

    const updateSelected = (updates: Partial<CustomObject>) => {
        if (!selectedId || selectionType !== 'OBJECT') return;
        setObjects(prev => prev.map(o => o.id === selectedId ? { ...o, ...updates } : o));
    };

    const deleteSelected = () => {
        if (!selectedId || selectionType !== 'OBJECT') return;
        setObjects(prev => prev.filter(o => o.id !== selectedId));
        setSelectedId(null);
        setSelectionType(null);
    };

    const handleRobotStartUpdate = (updates: { x?: number, z?: number, rotation?: number }) => {
        setMissionMeta(prev => ({
            ...prev,
            startPosition: { 
                ...prev.startPosition, 
                x: updates.x ?? prev.startPosition.x, 
                z: updates.z ?? prev.startPosition.z 
            },
            startRotation: updates.rotation !== undefined ? (updates.rotation * 180 / Math.PI) : prev.startRotation
        }));
    };

    const handleFlip = (direction: 'H' | 'V') => {
        if (!selectedId || selectionType !== 'OBJECT') return;
        const obj = objects.find(o => o.id === selectedId);
        if (!obj) return;

        let newRotation = obj.rotation || 0;
        let newShape = obj.shape;

        if (direction === 'H') {
            // Horizontal Flip (Mirror X)
            if (obj.type === 'PATH' && obj.shape === 'CORNER') {
                 // Corner Flip H: effectively -rotation - 90deg (in radians)
                 newRotation = -newRotation - Math.PI/2;
            } else {
                 newRotation = -newRotation;
            }
            
            if (obj.shape === 'CURVED') newShape = 'CURVED_RIGHT';
            else if (obj.shape === 'CURVED_RIGHT') newShape = 'CURVED';
        } else {
            // Vertical Flip (Mirror Z)
             if (obj.type === 'PATH' && obj.shape === 'CORNER') {
                 // Corner Flip V: effectively -rotation + 90deg (in radians)
                 newRotation = -newRotation + Math.PI/2;
            } else {
                 newRotation = Math.PI - newRotation;
            }

            if (obj.shape === 'CURVED') newShape = 'CURVED_RIGHT';
            else if (obj.shape === 'CURVED_RIGHT') newShape = 'CURVED';
        }

        updateSelected({ rotation: newRotation, shape: newShape });
    }

    // --- Drag Logic ---
    const handleDragStart = (id: string, e: ThreeEvent<PointerEvent>) => {
        if (transformMode !== 'drag') return;
        
        setSelectedId(id);
        setSelectionType('OBJECT');
        setIsDragging(true);
        if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
    };

    const handleRobotDragStart = () => {
        if (transformMode !== 'drag') return;
        setSelectedId(null);
        setSelectionType('ROBOT');
        setIsDragging(true);
        if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
    };

    const handlePlanePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging) return;
        
        const snap = 0.5;
        const newX = Math.round(e.point.x / snap) * snap;
        const newZ = Math.round(e.point.z / snap) * snap;

        if (selectionType === 'OBJECT' && selectedId) {
            updateSelected({ x: newX, z: newZ });
        } else if (selectionType === 'ROBOT') {
            handleRobotStartUpdate({ x: newX, z: newZ });
        }
    };

    const exportMission = () => {
        const exportData = {
            id: `custom_${Date.now()}`,
            ...missionMeta,
            environmentObjects: objects,
            check: "DRIVE_DISTANCE", 
            difficulty: "Medium" 
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${missionMeta.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        a.click();
    };

    const importMission = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (data.environmentObjects) setObjects(data.environmentObjects);
                if (data.startPosition) setMissionMeta(prev => ({ ...prev, startPosition: data.startPosition }));
                if (data.startRotation) setMissionMeta(prev => ({ ...prev, startRotation: data.startRotation }));
                if (data.title) setMissionMeta(prev => ({ ...prev, title: data.title, description: data.description || '' }));
            } catch (err) {
                alert("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    };

    const selectedObjectData = objects.find(o => o.id === selectedId);

    return (
        <div className="flex h-screen w-screen bg-slate-100 font-sans text-slate-800 overflow-hidden" dir="ltr">
            
            {/* --- Left Sidebar: Toolbox --- */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl z-10 flex-shrink-0">
                <div className="p-4 bg-slate-900 text-white shadow-md z-10">
                    <h1 className="font-bold text-xl flex items-center gap-2">
                        <Box className="text-blue-400" /> Mission Editor
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Design levels for RoboCode</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {/* Add Objects Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={12}/> Add Object</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <ToolButton icon={<Square size={20} className="text-red-500" />} label="Wall" onClick={() => addObject(DEFAULT_WALL)} />
                            <ToolButton icon={<Map size={20} className="text-yellow-500" />} label="Path" onClick={() => addObject(DEFAULT_PATH)} />
                            <ToolButton icon={<CornerDownRight size={20} className="text-yellow-600" />} label="Corner" onClick={() => addObject(DEFAULT_CORNER)} />
                            <ToolButton icon={<Undo2 size={20} className="text-yellow-600 transform rotate-180" />} label="Curve" onClick={() => addObject(DEFAULT_CURVE)} />
                            <ToolButton icon={<LayoutGrid size={20} className="text-slate-600" />} label="Ramp" onClick={() => addObject(DEFAULT_RAMP)} />
                            <ToolButton icon={<Type size={20} className="text-green-500" />} label="Zone" onClick={() => addObject(DEFAULT_ZONE)} />
                        </div>
                    </div>

                    {/* Mission Metadata */}
                    <div className="space-y-3">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Save size={12}/> Mission Info</h3>
                        <div className="space-y-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                                <input 
                                    className="w-full p-2 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-colors" 
                                    value={missionMeta.title} 
                                    onChange={e => setMissionMeta({...missionMeta, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                                <textarea 
                                    className="w-full p-2 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none h-20 resize-none transition-colors" 
                                    value={missionMeta.description} 
                                    onChange={e => setMissionMeta({...missionMeta, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 z-10">
                    <button onClick={exportMission} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <Download size={18} /> Export Mission JSON
                    </button>
                    <label className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 hover:bg-slate-50">
                        <Upload size={18} /> Import JSON
                        <input type="file" className="hidden" accept=".json" onChange={importMission} />
                    </label>
                </div>
            </div>

            {/* --- Main 3D View --- */}
            <div className="flex-1 relative bg-slate-200 overflow-hidden">
                {/* 3D Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur rounded-full px-2 py-1.5 shadow-xl flex gap-1 border border-white/50">
                    <ToolbarButton active={transformMode === 'drag'} onClick={() => setTransformMode('drag')} icon={<Hand size={18} />} title="Drag (Simple Move)" />
                    <div className="w-px bg-slate-300 mx-2 my-2"></div>
                    <ToolbarButton active={transformMode === 'translate'} onClick={() => setTransformMode('translate')} icon={<Move size={18} />} title="Move (Gizmo)" />
                    <ToolbarButton active={transformMode === 'rotate'} onClick={() => setTransformMode('rotate')} icon={<RotateCw size={18} />} title="Rotate (Gizmo)" />
                    <div className="w-px bg-slate-300 mx-2 my-2"></div>
                    <ToolbarButton active={false} onClick={deleteSelected} disabled={!selectedId || selectionType !== 'OBJECT'} icon={<Trash2 size={18} />} danger title="Delete" />
                </div>

                <Canvas shadows camera={{ position: [5, 15, 15], fov: 45 }}>
                    <color attach="background" args={['#f1f5f9']} />
                    <Environment preset="city" />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 20, 10]} castShadow shadow-mapSize={[2048, 2048]} />
                    
                    <Grid infiniteGrid sectionSize={5} cellSize={1} fadeDistance={60} sectionColor="#cbd5e1" cellColor="#e2e8f0" position={[0, -0.01, 0]} />
                    <ContactShadows opacity={0.4} scale={30} blur={2} far={4} color="#000000" />

                    {/* Interaction Plane for Dragging */}
                    <mesh 
                        visible={false} 
                        rotation={[-Math.PI/2, 0, 0]} 
                        position={[0, 0.01, 0]}
                        onPointerMove={handlePlanePointerMove}
                        onPointerUp={handleDragEnd}
                    >
                        <planeGeometry args={[100, 100]} />
                        <meshBasicMaterial />
                    </mesh>

                    <OrbitControls ref={orbitControlsRef} makeDefault minDistance={2} maxDistance={50} />

                    {/* Scene Objects */}
                    <EditorSceneObjects 
                        objects={objects} 
                        selectedId={selectionType === 'OBJECT' ? selectedId : null} 
                        onSelect={(id) => { setSelectedId(id); setSelectionType('OBJECT'); }} 
                        onDragStart={handleDragStart}
                    />
                    
                    {/* Robot Start Position Marker */}
                    <RobotStartMarker 
                        position={missionMeta.startPosition} 
                        rotation={missionMeta.startRotation} 
                        isSelected={selectionType === 'ROBOT'}
                        onClick={() => { setSelectedId(null); setSelectionType('ROBOT'); }}
                        onDragStart={handleRobotDragStart}
                    />

                    {/* Transform Controls Logic */}
                    {selectionType === 'OBJECT' && selectedObjectData && (
                        <ObjectTransformer 
                            object={selectedObjectData} 
                            mode={transformMode} 
                            onUpdate={updateSelected} 
                        />
                    )}

                    {selectionType === 'ROBOT' && (
                        <TransformControls 
                            visible={transformMode !== 'drag'}
                            enabled={transformMode !== 'drag'}
                            position={[missionMeta.startPosition.x, 0, missionMeta.startPosition.z]}
                            rotation={[0, missionMeta.startRotation * Math.PI / 180, 0]}
                            mode={transformMode === 'drag' ? 'translate' : transformMode}
                            translationSnap={0.5}
                            rotationSnap={Math.PI / 12}
                            onMouseUp={(e) => {
                                // @ts-ignore
                                const obj = e.target.object;
                                if (obj) {
                                    handleRobotStartUpdate({
                                        x: obj.position.x,
                                        z: obj.position.z,
                                        rotation: obj.rotation.y
                                    });
                                }
                            }}
                        />
                    )}
                </Canvas>
                
                {/* Hints */}
                <div className="absolute bottom-4 left-4 text-xs text-slate-400 font-medium select-none pointer-events-none">
                    {transformMode === 'drag' 
                        ? "Drag Mode: Click and hold object to move" 
                        : "Gizmo Mode: Use arrows to move/rotate"} 
                    • Scroll: Zoom • Right Click: Pan
                </div>
            </div>

            {/* --- Right Sidebar: Properties --- */}
            {((selectionType === 'OBJECT' && selectedObjectData) || selectionType === 'ROBOT') && (
                <div className="w-80 bg-white border-l border-slate-200 p-5 shadow-2xl z-20 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                             {selectionType === 'ROBOT' ? 'Start Position' : 'Properties'}
                        </h3>
                        <button onClick={() => { setSelectedId(null); setSelectionType(null); }} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-6">
                        {selectionType === 'ROBOT' ? (
                            <>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-800 font-medium">Robot Start Configuration</p>
                                    <p className="text-xs text-blue-600 mt-1">Set where the robot begins the mission.</p>
                                </div>
                                <div className="space-y-4">
                                    <PropertyInput label="Position X" value={missionMeta.startPosition.x} onChange={x => handleRobotStartUpdate({x})} />
                                    <PropertyInput label="Position Z" value={missionMeta.startPosition.z} onChange={z => handleRobotStartUpdate({z})} />
                                    <PropertyInput label="Rotation (Deg)" value={missionMeta.startRotation} onChange={r => handleRobotStartUpdate({rotation: r * Math.PI / 180})} />
                                </div>
                            </>
                        ) : selectedObjectData && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Type</p>
                                        <p className="font-mono font-bold text-blue-600 text-sm">{selectedObjectData.type}</p>
                                    </div>
                                    {selectedObjectData.type === 'PATH' && (
                                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] text-slate-400 uppercase font-bold">Shape</label>
                                            </div>
                                            <select 
                                                className="w-full bg-transparent font-mono text-sm font-bold text-slate-700 outline-none"
                                                value={selectedObjectData.shape || 'STRAIGHT'}
                                                onChange={(e) => updateSelected({ shape: e.target.value as PathShape })}
                                            >
                                                <option value="STRAIGHT">Straight</option>
                                                <option value="CORNER">Corner (90°)</option>
                                                <option value="CURVED">Curve (Left)</option>
                                                <option value="CURVED_RIGHT">Curve (Right)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Flip Buttons */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleFlip('H')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200"
                                        title="Flip Horizontal (Mirror X)"
                                    >
                                        <FlipHorizontal size={16} /> <span className="text-xs font-bold">Flip H</span>
                                    </button>
                                    <button 
                                        onClick={() => handleFlip('V')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200"
                                        title="Flip Vertical (Mirror Z)"
                                    >
                                        <FlipVertical size={16} /> <span className="text-xs font-bold">Flip V</span>
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimensions</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PropertyInput label="Width" value={selectedObjectData.width} onChange={v => updateSelected({ width: v })} min={0.1} />
                                        <PropertyInput label="Length" value={selectedObjectData.length} onChange={v => updateSelected({ length: v })} min={0.1} />
                                        {(selectedObjectData.type === 'RAMP' || selectedObjectData.type === 'WALL') && (
                                            <PropertyInput label="Height" value={selectedObjectData.height || 1} onChange={v => updateSelected({ height: v })} min={0.1} />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transform</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PropertyInput label="Pos X" value={selectedObjectData.x} onChange={v => updateSelected({ x: v })} />
                                        <PropertyInput label="Pos Z" value={selectedObjectData.z} onChange={v => updateSelected({ z: v })} />
                                        <div className="col-span-2">
                                             <PropertyInput label="Rotation (Deg)" value={(selectedObjectData.rotation || 0) * 180 / Math.PI} onChange={v => updateSelected({ rotation: v * Math.PI / 180 })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Appearance</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#d946ef', '#ffffff', '#94a3b8', '#1e293b', '#000000'].map(c => (
                                            <button 
                                                key={c} 
                                                onClick={() => updateSelected({ color: c })}
                                                className={`aspect-square rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${selectedObjectData.color?.toLowerCase() === c ? 'border-blue-500 ring-2 ring-blue-100 scale-105' : 'border-slate-100'}`}
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            className="w-full h-8 rounded-lg cursor-pointer opacity-0 absolute"
                                            onChange={(e) => updateSelected({ color: e.target.value })}
                                        />
                                        <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-slate-300" style={{backgroundColor: selectedObjectData.color}} />
                                            Custom Color
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Helper UI Components ---
const ToolButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-slate-100 hover:border-blue-400 hover:bg-white rounded-2xl transition-all active:scale-95 group">
        <div className="mb-2 transform group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">{label}</span>
    </button>
);

const ToolbarButton = ({ active, onClick, icon, danger, disabled, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, danger?: boolean, disabled?: boolean, title?: string }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        title={title}
        className={`p-2.5 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed
            ${active 
                ? 'bg-blue-600 text-white shadow-md' 
                : danger 
                    ? 'text-red-400 hover:bg-red-50 hover:text-red-500' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
    >
        {icon}
    </button>
);

const PropertyInput = ({ label, value, onChange, min }: { label: string, value: number, onChange: (val: number) => void, min?: number }) => (
    <div className="relative group">
        <label className="text-[9px] font-bold text-slate-400 uppercase absolute -top-1.5 left-2 bg-white px-1">{label}</label>
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
            <input 
                type="number" 
                step="0.1" 
                min={min}
                className="w-full p-2 text-sm font-mono font-medium outline-none text-slate-700 bg-transparent"
                value={Number(value).toFixed(2)} 
                onChange={(e) => onChange(parseFloat(e.target.value))} 
            />
        </div>
    </div>
);

export default MissionEditor;
