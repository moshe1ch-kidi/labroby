
import React, { useState } from 'react';
import { BookOpen, Trophy, ArrowLeft, Zap, Cpu, Hand, Palette, Eye, Compass, Info, Lightbulb, X, Activity, Target, Settings, GraduationCap, Play, Gauge, Radar, CheckCircle2, ChevronRight, ChevronDown, Layers, Repeat, Variable, Star, LightbulbIcon, ArrowRight, ShieldCheck, Milestone, MoveHorizontal, RotateCw, Scaling, Flame, Waves, Fingerprint, ZapOff, Code, MonitorPlay, AlertTriangle, RotateCcw, Share2, Table, Projector } from 'lucide-react';

type HelpPage = 'MENU' | 'BLOCKS' | 'CHALLENGES' | 'STRUCTURE' | 'COURSE' | 'UNIT_DETAIL';

interface HelpCenterProps {
    onClose: () => void;
}

interface Mission {
    id?: string;
    title: string;
    objective: string;
    hint: string;
    img?: string; // Field/Environment Image
    imgCode?: string; // Specific Program/Code Image
    video?: string;
    placeholder?: string;
    requiredChallenge?: string;
}

interface Unit {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    details: string;
    technicalConcepts: { title: string, content: string }[];
    color: string;
    icon: React.ReactNode;
    lessons: { title: string, description: string }[];
    missions?: Mission[];
    keyBlocks: string[];
}

const COURSE_UNITS: Unit[] = [
    {
        id: 1,
        title: "Basics of Motion",
        subtitle: "Differential Steering & Power",
        description: "Understanding how two independent motors create complex movement.",
        details: "At the heart of our robot is a Differential Drive system. By controlling the power to the left and right wheels separately, we can move forward, curve, or spin on the spot.",
        technicalConcepts: [
            { title: "System Outputs", content: "A robot's 'Output' is any way it interacts with its environment. In this lab, we focus on Kinetic Output (Motors), Visual Output (LEDs), and Sound Output (Buzzer)." },
            { title: "Input Parameters", content: "Blocks aren't just commands; they are templates. Each parameter (Speed, Distance, Direction) is a specific variable that defines how the command is executed." }
        ],
        color: "#4C97FF",
        icon: <Play size={32} fill="currentColor" />,
        lessons: [
            { title: "Kinetic & Visual Outputs", description: "Discover how the robot communicates using three main outputs: Physical Motion (Motors), Visual Signals (LEDs), and Acoustic Feedback (Buzzer)." },
            { title: "Block Input Parameters", description: "Learn to configure the 'Arguments' of a block. You must define Velocity (Speed), Displacement (Distance), and Heading (Direction) to achieve your goals." },
            { title: "Dual-Motor Architecture", description: "Deep dive into the independent Left and Right motor setup. Understand how differing power levels between the two wheels create turns, curves, and pivots." }
        ],
        missions: [
            {
                title: "Mission 1: THE FIRST STEP",
                objective: "Program the robot to move forward exactly 50cm and stop.",
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/Mission1TheFirstStep.svg",
                hint: "Use the 'Drive Distance' block and look at the parameter for CM. Set the value to 50 for this mission.",
            }
        ],
        keyBlocks: ["drive_forward.svg", "drive_speed.svg", "drive_stop.svg"]
    },
    {
        id: 2,
        title: "Visual Communication",
        subtitle: "Robot Status & LED Signaling",
        description: "Programming the robot's lights to communicate movement, states, and warnings.",
        details: "In robotics, LEDs serve as a human-machine interface (HMI). They provide immediate visual feedback about the robot's internal state. A green light might mean 'Safe to proceed', while a red light indicates an 'Obstacle detected'.",
        technicalConcepts: [
            { title: "Robot HMI", content: "Human-Machine Interface using visual cues. This is how the robot 'talks' to us without using words." }
        ],
        color: "#9966FF",
        icon: <Lightbulb size={32} />,
        lessons: [
            { title: "Standardized Color Encoding", description: "Create a standard 'signaling language' using colors: Green for go, Red for stop, and Orange for warning states." }
        ],
        missions: [
            {
                title: "Mission 1: Traffic Signals",
                objective: "Move forward 50cm with Green LEDs. When stopped, change the LEDs to Red for 2 seconds.",
                hint: "Use the 'Set LED Color' block before the movement, and change it again immediately after the movement finishes.",
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/ledmissen1.svg",
            }
        ],
        keyBlocks: ["led_setcolor.svg", "led_turnoff.svg"]
    },
    {
        id: 3,
        title: "Senses & Environment",
        subtitle: "The Four Core Sensors",
        description: "Mastering the physics and logic of how robots perceive space, contact, orientation, and light.",
        details: "Smart robots don't just follow pre-recorded instructions; they adapt to their surroundings. This module explores the four essential sensors that act as the robot's eyes and ears: Ultrasonic (Distance), Touch (Contact), Color (ID), and Gyro (Orientation).",
        technicalConcepts: [
            { title: "Digital vs. Analog", content: "Touch sensors are Digital (0/1), while Ultrasonic and Gyro are Analog, providing continuous numeric data for higher intelligence." },
            { title: "SENSE-THINK-ACT", content: "The fundamental loop of robotics. Sensors provide the 'Sense' part, allowing the code to 'Think' and the motors to 'Act'." }
        ],
        color: "#00C7E5",
        icon: <Radar size={32} />,
        lessons: [
            { title: "Ultrasonic Principles", description: "Learn how sound waves (Echolocation) allow the robot to calculate distance without touching objects." },
            { title: "Touch Logic", description: "Programming the front bumper to act as an emergency stop or a physical navigation trigger." },
            { title: "Color Identification", description: "Using light waves to detect floor markers, tracks, and road colors." },
            { title: "Gyro Navigation", description: "Mastering rotation and tilt for perfect 90° turns and ramp safety." }
        ],
        missions: [
            {
                id: "M3_1",
                title: "Mission 1: Ultrasonic Wall Stop",
                objective: "Program the robot to stop automatically exactly 10cm before hitting a wall using the distance sensor.",
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/ultrasonikmission1.svg",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/ultrasonikmission1.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/ultrasonikmission1.mp4",
                hint: "Combine the 'Drive Forward' block with a 'Wait Until (Distance < 10)' followed by a 'Stop' block.",
                requiredChallenge: "Touch Sensor - Obstacle Retreat"
            },
            {
                id: "M3_2",
                title: "Mission 2: Impact Retreat",
                objective: "Drive forward until the bumper is pressed. Immediately reverse for 30cm and stop.",
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensortouch1.svg",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensortouch1.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/touchsensor.mp4",
                hint: "Wait until 'Touch Sensor Pressed' is true, then use the 'Drive Distance' block with a negative CM value.",
                requiredChallenge: "Touch Sensor - Obstacle Retreat"
            },
            {
                id: "M3_3",
                title: "Mission 3: Precision Pivot",
                objective: "Rotate the robot exactly 180 degrees using the Gyro sensor feedback and stop.",
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorgyro.svg",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorgyro1.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/gyrosensor.mp4",
                hint: "Use 'Turn Right' followed by 'Wait Until (Gyro Angle >= 180)'. This ensures a precise rotation regardless of battery level.",
            },
            {
                id: "M3_4",
                title: "Mission 4: Color Signal Stop",
                objective: "Drive forward until the color sensor detects a RED marker on the floor, then stop moving.",
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorcolor.svg",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorcolor2.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorcolor.mp4",
                hint: "Use the 'Drive Forward' block, followed by a 'Wait Until (Detected Color = Red)' and then a 'Stop Moving' block.",
                requiredChallenge: "Traffic Light - Road Nav"
            }
        ],
        keyBlocks: ["sensor_distance.svg", "sensor_gyro.svg", "sensor_touch.svg", "sensor_touchingcolor.svg"]
    },
    {
        id: 4,
        title: "Engineering Turn Types",
        subtitle: "Kinematics of Rotation",
        description: "Mastering the three fundamental ways a robot rotates in space.",
        details: "Not all turns are equal. In robotics engineering, we categorize rotation by how the motors behave relative to each other. Understanding Swing, Pivot, and Arc turns is essential for precise navigation and path planning.",
        technicalConcepts: [
            { title: "Turn Radius", content: "The distance between the center of the turn and the center of the robot. Pivot turns have zero radius, while Arcs have a variable large radius." },
            { title: "Relative Velocity", content: "The difference in power between the left and right motors determines the sharpness and type of the turn." }
        ],
        color: "#F43F5E",
        icon: <RotateCw size={32} />,
        lessons: [
            { title: "Swing Turn Mechanics", description: "One wheel stays stationary while the other moves. This creates a predictable sweep around a single point." },
            { title: "Pivot Turn Physics", description: "Motors rotate in opposite directions at equal speeds. The robot spins on its own center of gravity." },
            { title: "Arc Turn Geometry", description: "Both wheels move in the same direction but at different speeds, creating a smooth, sweeping curve." }
        ],
        missions: [
            {
                title: "SWING TURNSIDWAYES",
                objective: "Perform a 90-degree turn to the right while the right wheel stays still (0% power) and the left wheel moves forward (50% power).",
                hint: "Use the 'Set Motor' block. Set the right motor to 0 and the left motor to 50. Add a 'Wait Until' the Gyro Angle is greater than 90.",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/swingrurnmission.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/swingrurnmission.mp4",
            },
            {
                title: "PIVOT TURN U TURN",
                objective: "Rotate exactly 180 degrees on the spot without the robot shifting forward or backward.",
                hint: "Use the 'Turn by Degrees' block. Set it to 180. In a Pivot Turn, the wheels move at equal speeds in opposite directions automatically in this block.",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/pivotturn.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/pivotturn.mp4",
            },
            {
                title: "ARCTURN",
                objective: "Travel through a long curved path. Both wheels must move forward, but one wheel must be twice as fast as the other.",
                hint: "Use the 'Set Motor' block. Try setting one motor to 50% and the other to 10%. The smaller the difference, the wider the arc.",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/arcturn.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/arcturn.mp4",
            }
        ],
        keyBlocks: ["drive_turn_dgree_speed.svg", "drive_turn_until_speed.svg", "drive_heading_dgree.svg", "drive_setmotor.svg"]
    },
    {
        id: 5,
        title: "Logic & Intelligence",
        subtitle: "Decision Trees & Boolean Logic",
        description: "Programming the 'brain' to react to various sensor scenarios.",
        details: "Logic is the set of rules that governs the robot's behavior. By using conditions, the robot can 'decide' what to do based on what it sees or feels.",
        technicalConcepts: [
            { title: "Conditional Branching (If/Else)", content: "The basis of AI: If condition is true, perform action A; otherwise, perform action B." }
        ],
        color: "#FFAB19",
        icon: <Layers size={32} />,
        lessons: [
            { title: "Boolean State Awareness", description: "Introduction to True/False logic and using sensors as inputs for conditions." }
        ],
        missions: [
             {
                title: "Mission 1: The Gatekeeper",
                objective: "If touch sensor is pressed - turn on Red light. If not pressed - turn on Green light.",
                hint: "Use an 'If/Else' block inside a 'Forever' loop.",
            }
        ],
        keyBlocks: ["control_if.svg", "logic_compare.svg", "logic_and.svg"]
    }
];

const SwingTurnDiagram = () => (
    <svg viewBox="0 0 200 200" className="w-full h-auto">
        <rect x="60" y="50" width="80" height="100" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="45" y="70" width="15" height="40" rx="4" fill="#ef4444" /> {/* Stopped Wheel */}
        <circle cx="52" cy="90" r="4" fill="white" />
        <rect x="140" y="70" width="15" height="40" rx="4" fill="#3b82f6" /> {/* Moving Wheel */}
        <path d="M147 60 Q 147 20 80 20" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="6 4" markerEnd="url(#arrow-blue)" />
        <circle cx="52" cy="90" r="10" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
        <defs>
            <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#3b82f6" />
            </marker>
        </defs>
        <text x="52" y="130" textAnchor="middle" fontSize="10" fontStyle="italic" fill="#ef4444">Axis of Rotation</text>
    </svg>
);

const PivotTurnDiagram = () => (
    <svg viewBox="0 0 200 200" className="w-full h-auto">
        <rect x="60" y="50" width="80" height="100" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="45" y="70" width="15" height="40" rx="4" fill="#3b82f6" /> 
        <path d="M52 115 L52 140" fill="none" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue)" /> {/* Backward */}
        <rect x="140" y="70" width="15" height="40" rx="4" fill="#3b82f6" />
        <path d="M147 65 L147 40" fill="none" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue)" /> {/* Forward */}
        <circle cx="100" cy="90" r="6" fill="#f59e0b" />
        <path d="M80 90 A 20 20 0 1 1 120 90" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrow-gold)" />
        <defs>
            <marker id="arrow-gold" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#f59e0b" />
            </marker>
        </defs>
        <text x="100" y="115" textAnchor="middle" fontSize="10" fontStyle="italic" fill="#f59e0b">Center of Gravity</text>
    </svg>
);

const ArcTurnDiagram = () => (
    <svg viewBox="0 0 200 200" className="w-full h-auto">
        <rect x="60" y="60" width="80" height="90" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" transform="rotate(-15, 100, 105)" />
        <rect x="40" y="80" width="15" height="40" rx="4" fill="#10b981" transform="rotate(-15, 47, 100)" /> 
        <path d="M40 70 Q 50 10 150 10" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="6 4" markerEnd="url(#arrow-green)" />
        <rect x="135" y="60" width="15" height="40" rx="4" fill="#10b981" transform="rotate(-15, 142, 80)" />
        <path d="M145 50 Q 155 0 200 0" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.5" strokeDasharray="6 4" />
        <defs>
            <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#10b981" />
            </marker>
        </defs>
        <text x="100" y="170" textAnchor="middle" fontSize="12" fontStyle="italic" fill="#10b981">Large Radius</text>
    </svg>
);

const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
    const [currentPage, setCurrentPage] = useState<HelpPage>('MENU');
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [expandedMissionIdx, setExpandedMissionIdx] = useState<number | null>(0);

    const renderMenu = () => (
        <div className="max-w-6xl mx-auto p-8 pt-20 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left" dir="ltr">
            <header className="text-center mb-20">
                <h1 className="text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-none uppercase">Robot Wiki</h1>
                <p className="text-2xl text-slate-500 font-medium italic">Complete guide to Virtual Robotics Lab v4.0</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <button onClick={() => setCurrentPage('COURSE')} className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-amber-500 flex items-center gap-6 text-left">
                    <div className="w-20 h-20 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        <Projector size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">Curriculum</h2>
                        <p className="text-slate-500 text-sm font-medium">Step-by-step lessons.</p>
                    </div>
                </button>

                <button onClick={() => setCurrentPage('BLOCKS')} className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-blue-500 flex items-center gap-6 text-left">
                    <div className="w-20 h-20 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        <BookOpen size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">Blocks</h2>
                        <p className="text-slate-500 text-sm font-medium">Programming library.</p>
                    </div>
                </button>

                <button onClick={() => setCurrentPage('STRUCTURE')} className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-emerald-500 flex items-center gap-6 text-left">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        <Cpu size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">Hardware</h2>
                        <p className="text-slate-500 text-sm font-medium">Sensor anatomy.</p>
                    </div>
                </button>

                <button onClick={() => setCurrentPage('CHALLENGES')} className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-purple-500 flex items-center gap-6 text-left">
                    <div className="w-20 h-20 bg-purple-50 rounded-[1.5rem] flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        <Trophy size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">Strategy</h2>
                        <p className="text-slate-500 text-sm font-medium">Expert tactics.</p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderCourseHome = () => (
        <div className="max-w-6xl mx-auto p-8 pt-20 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left" dir="ltr">
            <header className="text-center mb-16">
                <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-4 text-slate-500 font-black mb-8 hover:translate-x-[-8px] transition-transform text-2xl tracking-tighter uppercase">
                    <ArrowLeft size={32} strokeWidth={3} /> Back to Wiki
                </button>
                <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-none uppercase">The Course</h1>
                <p className="text-xl text-slate-500 font-medium italic">Master the art of robotics, module by module.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {COURSE_UNITS.map((unit) => (
                    <button 
                        key={unit.id} 
                        onClick={() => { setSelectedUnit(unit); setCurrentPage('UNIT_DETAIL'); setExpandedMissionIdx(0); }}
                        className="group bg-white p-8 rounded-[3rem] shadow-lg hover:shadow-2xl transition-all border-4 border-transparent flex flex-col items-start text-left gap-6 relative overflow-hidden"
                        style={{ borderColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = unit.color)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                    >
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: unit.color }}>
                            {unit.icon}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: unit.color }}>UNIT MODULE 0{unit.id}</div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase">{unit.title}</h2>
                            <p className="text-slate-500 text-sm font-medium line-clamp-2">{unit.description}</p>
                        </div>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-transform group-hover:translate-x-[8px]" style={{ color: unit.color }}>
                            Start Lesson <ChevronRight size={16} strokeWidth={3} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderUnitDetail = () => {
        if (!selectedUnit) return null;
        
        return (
            <div className="max-w-[1600px] mx-auto p-8 md:p-12 pt-20 animate-in slide-in-from-right duration-500 h-full overflow-y-auto pb-60 text-left font-sans" dir="ltr">
                <button onClick={() => setCurrentPage('COURSE')} className="flex items-center gap-4 text-slate-400 font-black mb-14 hover:translate-x-[-8px] transition-transform text-2xl tracking-tighter uppercase">
                    <ArrowLeft size={32} strokeWidth={3} /> Back to Units
                </button>
                
                <div className="bg-white rounded-[5rem] p-8 md:p-16 shadow-2xl border border-slate-100 mb-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.03] pointer-events-none" style={{ color: selectedUnit.color }}>
                         <GraduationCap size={380} className="rotate-12 transform translate-x-24 -translate-y-24" />
                    </div>

                    <div className="flex items-center gap-8 mb-16">
                        <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shrink-0" style={{ backgroundColor: selectedUnit.color }}>
                            {selectedUnit.icon}
                        </div>
                        <div>
                            <div className="text-sm font-black uppercase tracking-[0.4em]" style={{ color: selectedUnit.color }}>Study Module 0{selectedUnit.id}</div>
                            <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none uppercase">{selectedUnit.title}</h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
                        <div className="lg:col-span-3 space-y-20">
                            {/* Summary */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase"><Info className="text-slate-400" /> Executive Summary</h3>
                                <p className="text-slate-500 text-2xl leading-relaxed font-medium italic">{selectedUnit.details}</p>
                            </div>

                            {/* MODULE 4 SPECIAL: TURN TYPE DIAGRAMS */}
                            {selectedUnit.id === 4 && (
                                <div className="space-y-20">
                                    <div className="grid grid-cols-1 gap-12">
                                        <div className="bg-slate-50 rounded-[4rem] border-2 border-blue-100 flex flex-col lg:flex-row overflow-hidden">
                                            <div className="p-12 lg:w-2/3 space-y-6">
                                                <h4 className="text-3xl font-black text-blue-600 uppercase">1. Swing Turn</h4>
                                                <p className="text-xl text-slate-600 font-medium">One wheel stops while the other moves. The robot swings around the stationary axis.</p>
                                            </div>
                                            <div className="lg:w-1/3 bg-white p-8 border-l-2 border-slate-100 flex items-center justify-center">
                                                <div className="w-full max-w-[250px]"><SwingTurnDiagram /></div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-[4rem] border-2 border-rose-100 flex flex-col lg:flex-row overflow-hidden">
                                            <div className="p-12 lg:w-2/3 space-y-6">
                                                <h4 className="text-3xl font-black text-rose-600 uppercase">2. Pivot Turn</h4>
                                                <p className="text-xl text-slate-600 font-medium">Wheels spin in opposite directions. The robot rotates exactly on its center.</p>
                                            </div>
                                            <div className="lg:w-1/3 bg-white p-8 border-l-2 border-slate-100 flex items-center justify-center">
                                                <div className="w-full max-w-[250px]"><PivotTurnDiagram /></div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-[4rem] border-2 border-emerald-100 flex flex-col lg:flex-row overflow-hidden">
                                            <div className="p-12 lg:w-2/3 space-y-6">
                                                <h4 className="text-3xl font-black text-emerald-600 uppercase">3. Arc Turn</h4>
                                                <p className="text-xl text-slate-600 font-medium">Both wheels move forward but at different speeds, creating a sweeping curve.</p>
                                            </div>
                                            <div className="lg:w-1/3 bg-white p-8 border-l-2 border-slate-100 flex items-center justify-center">
                                                <div className="w-full max-w-[250px]"><ArcTurnDiagram /></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl text-white">
                                        <h3 className="text-4xl font-black mb-8 flex items-center gap-4">Comparison Table</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b-2 border-slate-700">
                                                        <th className="pb-6 text-slate-400 font-black uppercase text-sm">Turn Mode</th>
                                                        <th className="pb-6 text-slate-400 font-black uppercase text-sm">One Wheel</th>
                                                        <th className="pb-6 text-slate-400 font-black uppercase text-sm">Second Wheel</th>
                                                        <th className="pb-6 text-slate-400 font-black uppercase text-sm">Radius</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    <tr>
                                                        <td className="py-6 font-bold text-2xl">Swing</td>
                                                        <td className="py-6 text-slate-300">Stopped</td>
                                                        <td className="py-6 text-slate-300">Moving</td>
                                                        <td className="py-6 text-blue-400 font-bold">Medium</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-6 font-bold text-2xl">Pivot</td>
                                                        <td className="py-6 text-slate-300">Forward</td>
                                                        <td className="py-6 text-slate-300">Backward</td>
                                                        <td className="py-6 text-rose-400 font-bold">Zero</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-6 font-bold text-2xl">Arc</td>
                                                        <td className="py-6 text-slate-300">Speed X</td>
                                                        <td className="py-6 text-slate-300">Speed Y</td>
                                                        <td className="py-6 text-emerald-400 font-bold">Large</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MODULE 3 SPECIAL: SENSOR SHOWCASE */}
                            {selectedUnit.id === 3 && (
                                <div className="space-y-12">
                                    <h3 className="text-3xl font-black text-slate-900 border-b-4 border-cyan-100 pb-4 inline-block uppercase tracking-tight">Sensor Hardware Specs</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col gap-6 group hover:bg-white hover:shadow-2xl transition-all">
                                            <div className="h-56 bg-white rounded-3xl p-6 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden border border-slate-50">
                                                <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorultrasonok.svg" alt="Ultrasonic" className="max-h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2"><Radar className="text-cyan-500" /><h4 className="text-2xl font-black text-cyan-600 uppercase">Ultrasonic</h4></div>
                                                <p className="text-slate-600 font-medium leading-relaxed">Measures distance (0-255cm) using echolocation sound waves.</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col gap-6 group hover:bg-white hover:shadow-2xl transition-all">
                                            <div className="h-56 bg-white rounded-3xl p-6 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden border border-slate-50">
                                                <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensortouch.svg" alt="Touch" className="max-h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2"><Hand className="text-red-500" /><h4 className="text-2xl font-black text-red-500 uppercase">Touch Sensor</h4></div>
                                                <p className="text-slate-600 font-medium leading-relaxed">A digital binary switch that detects physical impact with obstacles.</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col gap-6 group hover:bg-white hover:shadow-2xl transition-all">
                                            <div className="h-56 bg-white rounded-3xl p-6 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden border border-slate-50">
                                                <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorgyro.svg" alt="Gyro" className="max-h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2"><Compass className="text-indigo-500" /><h4 className="text-2xl font-black text-indigo-600 uppercase">Gyroscope</h4></div>
                                                <p className="text-slate-600 font-medium leading-relaxed">Tracks rotation angle and pitch for precise navigation and balancing.</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col gap-6 group hover:bg-white hover:shadow-2xl transition-all">
                                            <div className="h-56 bg-white rounded-3xl p-6 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden border border-slate-50">
                                                <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/sensorcolor.svg" alt="Color" className="max-h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2"><Palette className="text-pink-500" /><h4 className="text-2xl font-black text-pink-600 uppercase">Color Sensor</h4></div>
                                                <p className="text-slate-600 font-medium leading-relaxed">Identifies track colors and light intensity using RGB spectrum analysis.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-12">
                                <h3 className="text-2xl font-black text-slate-800 uppercase mb-6 flex items-center gap-3"><Milestone className="text-slate-400" /> Learning Path</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {selectedUnit.lessons.map((lesson, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-md shrink-0" style={{ backgroundColor: selectedUnit.color }}>{idx + 1}</div>
                                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{lesson.title}</h4>
                                            </div>
                                            <p className="text-slate-600 text-xl leading-relaxed font-medium pl-14">{lesson.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8 pt-10 border-t-2 border-slate-100">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase"><ShieldCheck className="text-slate-400" /> Essential Blocks</h3>
                                <div className="flex flex-wrap items-start gap-6">
                                    {selectedUnit.keyBlocks.map((block, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-lg group hover:border-slate-200 transition-all inline-flex items-center justify-center">
                                            <img src={`https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/${block}`} alt="Block Icon" className="h-auto w-auto max-h-[110px] block group-hover:scale-105 transition-transform" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedUnit.missions && selectedUnit.missions.length > 0 && (
                                <div className="space-y-12 pt-20">
                                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter"><Target className="text-slate-400" /> Unit Missions</h3>
                                    <div className="space-y-4">
                                        {selectedUnit.missions.map((mission, mIdx) => {
                                            const isExpanded = expandedMissionIdx === mIdx;
                                            return (
                                                <div key={mIdx} className={`bg-slate-50 rounded-[3rem] border-2 transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-400 shadow-xl' : 'border-slate-100 shadow-sm hover:bg-slate-100'}`}>
                                                    <button onClick={() => setExpandedMissionIdx(isExpanded ? null : mIdx)} className="w-full p-8 flex items-center justify-between group">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isExpanded ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 group-hover:text-slate-600'}`}>{mIdx + 1}</div>
                                                            <h4 className={`text-2xl font-black uppercase tracking-tight transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-700'}`}>{mission.title}</h4>
                                                        </div>
                                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : 'text-slate-300 group-hover:text-slate-500'}`}><ChevronDown size={28} strokeWidth={3} /></div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="p-8 pt-0 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                                            <div className="h-px bg-slate-200 w-full mb-8" />
                                                            <div className="flex flex-col gap-10">
                                                                {mission.requiredChallenge && (
                                                                    <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 flex items-start gap-4 animate-pulse">
                                                                        <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={24} />
                                                                        <div><h5 className="font-black text-rose-800 text-lg mb-1">Important Mission Note:</h5><p className="text-rose-700 font-bold leading-relaxed">To spawn required obstacles, load <span className="bg-white px-2 py-0.5 rounded-lg mx-1 border border-rose-300">"{mission.requiredChallenge}"</span> from the Challenges menu.</p></div>
                                                                    </div>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-inner flex flex-col gap-3">
                                                                        <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]"><Target size={14} className="text-blue-500" /> Mission Objective</span>
                                                                        <p className="text-slate-700 font-bold text-2xl leading-tight italic">{mission.objective}</p>
                                                                    </div>
                                                                    <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 shadow-inner flex flex-col gap-3">
                                                                        <span className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-[0.2em]"><LightbulbIcon size={14} /> Engineer Hint</span>
                                                                        <p className="text-amber-900 font-bold text-xl leading-snug">{mission.hint}</p>
                                                                    </div>
                                                                </div>
                                                                {mission.imgCode && (
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em] pl-4"><Code size={16} /> Official Program Solution</div>
                                                                        <div className="p-8 bg-slate-900 rounded-[3rem] border-4 border-indigo-500/30 shadow-2xl relative overflow-x-auto min-h-[300px] flex items-center justify-center group-hover:border-indigo-500 transition-all duration-500">
                                                                            <img src={mission.imgCode} alt="Code Solution" className="w-auto h-auto max-w-full rounded-lg drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] pl-4"><MonitorPlay size={16} /> Live Visual Guide</div>
                                                                    <div className="bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col border-8 border-slate-800">
                                                                        <div className="flex-1 flex items-center justify-center bg-black min-h-[450px]">
                                                                            {mission.video ? (
                                                                                <video src={mission.video} autoPlay loop muted playsInline className="w-full h-auto object-contain" />
                                                                            ) : mission.img ? (
                                                                                <img src={mission.img} alt="Mission Preview" className="w-full h-auto object-contain p-8" />
                                                                            ) : (
                                                                                <div className="text-slate-800 font-black uppercase tracking-widest text-4xl opacity-50">Offline Feed</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1 space-y-12">
                            <div className="sticky top-12 space-y-12">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase"><Cpu className="text-slate-400" /> Specs</h3>
                                <div className="grid grid-cols-1 gap-8">
                                    {selectedUnit.technicalConcepts.map((concept, idx) => (
                                        <div key={idx} className="bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                                            <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3 uppercase">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedUnit.color }} />
                                                {concept.title}
                                            </h4>
                                            <p className="text-slate-600 text-lg leading-relaxed font-medium">{concept.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBlocks = () => (
        <div className="max-w-7xl mx-auto p-12 pt-20 animate-in fade-in duration-500 h-full overflow-y-auto pb-60 text-left" dir="ltr">
            <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-4 text-blue-600 font-black mb-14 hover:translate-x-[-8px] transition-transform text-2xl uppercase tracking-tighter">
                <ArrowLeft size={32} strokeWidth={3} /> Back to Wiki
            </button>
            <div className="space-y-24">
                <BlockSection title="Drive & Motion" color="#4C97FF">
                    <BlockCard title="Drive Forward" desc="Starts continuous forward motion." img="drive_forward.svg" color="#4C97FF" />
                    <BlockCard title="Drive Distance" desc="Moves for a precise number of centimeters." img="drive_forward_distance.svg" color="#4C97FF" />
                    <BlockCard title="Drive Distance Speed" desc="Moves a distance at a specific speed percentage." img="drive_forward_distance_speed.svg" color="#4C97FF" />
                    <BlockCard title="Heading Degree" desc="Sets the absolute robot orientation." img="drive_heading_dgree.svg" color="#4C97FF" />
                    <BlockCard title="Set Motor" desc="Directly control left and right motor power." img="drive_setmotor.svg" color="#4C97FF" />
                    <BlockCard title="Speed" desc="Sets the default travel speed." img="drive_speed.svg" color="#4C97FF" />
                    <BlockCard title="Stop" desc="Immediately halts all motor activity." img="drive_stop.svg" color="#4C97FF" />
                    <BlockCard title="Turn Degree Speed" desc="Turns by an angle at a specific speed." img="drive_turn_dgree_speed.svg" color="#4C97FF" />
                    <BlockCard title="Turn Until Speed" desc="Turns at speed until a condition is met." img="drive_turn_until_speed.svg" color="#4C97FF" />
                    <BlockCard title="Drive Until Speed" desc="Drives forward at speed until a condition is met." img="drive_until_speed.svg" color="#4C97FF" />
                </BlockSection>
                <BlockSection title="Sensing & Perception" color="#00C7E5">
                    <BlockCard title="Distance Sensor" desc="Measures range to obstacle in cm." img="sensor_distance.svg" color="#00C7E5" />
                    <BlockCard title="Gyroscope" desc="Provides orientation and tilt data." img="sensor_gyro.svg" color="#00C7E5" />
                    <BlockCard title="Touch Sensor" desc="Returns the physical bumper state." img="sensor_touch.svg" color="#00C7E5" />
                    <BlockCard title="Touching Color" desc="Checks if the robot is over a specific track color." img="sensor_touchingcolor.svg" color="#00C7E5" />
                    <BlockCard title="Touch Event" desc="Event trigger when the bumper is hit." img="sensor_touchpressed.svg" color="#00C7E5" />
                    <BlockCard title="Wheel Info" desc="Returns physical wheel metrics." img="sensor_wheel.svg" color="#00C7E5" />
                </BlockSection>
                <BlockSection title="Control & Logic" color="#FFAB19">
                    <BlockCard title="Forever" desc="Loops the code blocks indefinitely." img="control_forever.svg" color="#FFAB19" />
                    <BlockCard title="If Condition" desc="Executes if the logical statement is true." img="control_if.svg" color="#FFAB19" />
                    <BlockCard title="If Else" desc="Selects between two paths of execution." img="control_ifelse.svg" color="#FFAB19" />
                    <BlockCard title="Repeat Until" desc="Loops until a specific condition is satisfied." img="control_repeat_until.svg" color="#FFAB19" />
                    <BlockCard title="Stop Program" desc="Terminates all execution logic." img="control_stopprogram.svg" color="#FFAB19" />
                    <BlockCard title="Wait Seconds" desc="Pauses execution for a duration." img="control_wait.svg" color="#FFAB19" />
                    <BlockCard title="Wait Until" desc="Pauses execution until a condition occurs." img="control_waituntil.svg" color="#FFAB19" />
                </BlockSection>
                <BlockSection title="Logic & Math" color="#59C059">
                    <BlockCard title="And / Or" desc="Combines logical conditions." img="logic_and.svg" color="#59C059" />
                    <BlockCard title="Compare" desc="Checks for equality or inequality." img="logic_compare.svg" color="#59C059" />
                    <BlockCard title="Integer" desc="Rounds decimal numbers to whole numbers." img="logic_intrger.svg" color="#59C059" />
                    <BlockCard title="Arithmetic" desc="Basic mathematical operators." img="logic_math.svg" color="#59C059" />
                    <BlockCard title="Not" desc="Inverts a logical boolean value." img="logic_not.svg" color="#59C059" />
                    <BlockCard title="Boolean" desc="Constant True or False values." img="logic_true.svg" color="#59C059" />
                </BlockSection>
                <BlockSection title="Looks & Signaling" color="#9966FF">
                    <BlockCard title="Detected Color" desc="Matches LEDs to environmental color." img="led_detectedcolor.svg" color="#9966FF" />
                    <BlockCard title="Set LED Color" desc="Manually set status indicator color." img="led_setcolor.svg" color="#9966FF" />
                    <BlockCard title="Turn LED Off" desc="Deactivates light output." img="led_turnoff.svg" color="#9966FF" />
                </BlockSection>
                <BlockSection title="Pen Drawing" color="#0FBD8C">
                    <BlockCard title="Clear Drawing" desc="Erases all lines from the surface." img="pen_clear.svg" color="#0FBD8C" />
                    <BlockCard title="Pen Down" desc="Lowers the robot pen to draw." img="pen_down.svg" color="#0FBD8C" />
                    <BlockCard title="Set Pen Color" desc="Changes the drawing ink color." img="pen_setcolor.svg" color="#0FBD8C" />
                    <BlockCard title="Pen Up" desc="Lifts the pen to stop drawing." img="pen_up.svg" color="#0FBD8C" />
                </BlockSection>
            </div>
        </div>
    );

    const renderStructure = () => (
        <div className="max-w-7xl mx-auto p-12 pt-20 animate-in fade-in duration-500 h-full overflow-y-auto pb-60 text-left" dir="ltr">
             <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-4 text-emerald-600 font-black mb-14 hover:translate-x-[-8px] transition-transform text-2xl uppercase tracking-tighter">
                <ArrowLeft size={32} strokeWidth={3} /> Back to Wiki
            </button>
            <div className="flex flex-col items-center gap-16">
                <header className="text-center">
                    <h1 className="text-5xl font-black text-slate-900 mb-4 uppercase">Robot Anatomy v4.0</h1>
                    <p className="text-xl text-slate-500 font-medium">Explore the hardware configuration of your virtual lab bot.</p>
                </header>
                <div className="bg-white p-16 rounded-[5rem] shadow-2xl border-4 border-slate-100 flex flex-col items-center justify-center max-w-5xl">
                    <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/robotsensor.svg" alt="Robot Diagram" className="w-full h-auto drop-shadow-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full text-center">
                        <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100"><Radar className="mx-auto mb-4 text-blue-500" size={40} /><h3 className="font-black text-blue-900 mb-2 uppercase">Distance</h3><p className="text-sm text-blue-700 font-medium">Ultrasonic sound waves for collision avoidance (Range: 2.5m).</p></div>
                        <div className="p-8 bg-red-50 rounded-[2.5rem] border border-red-100"><Hand className="mx-auto mb-4 text-red-500" size={40} /><h3 className="font-black text-red-900 mb-2 uppercase">Touch</h3><p className="text-sm text-red-700 font-medium">Physical micro-switch for detection of wall impacts.</p></div>
                        <div className="p-8 bg-purple-50 rounded-[2.5rem] border border-purple-100"><Eye className="mx-auto mb-4 text-purple-500" size={40} /><h3 className="font-black text-purple-900 mb-2 uppercase">Color</h3><p className="text-sm text-purple-700 font-medium">Optical spectrometer for line following and marker ID.</p></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const BlockSection = ({ title, color, children }: { title: string; color: string; children?: React.ReactNode }) => (
        <div className="space-y-10">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                <div className="w-4 h-12 rounded-full" style={{ backgroundColor: color }} />
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">{children}</div>
        </div>
    );

    const BlockCard = ({ title, desc, img, color }: { title: string; desc: string; img: string; color: string }) => (
        <div className="bg-white p-8 rounded-[3rem] shadow-lg border-2 border-slate-50 hover:shadow-2xl transition-all group flex flex-col gap-6">
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 rounded-[2.5rem] shadow-inner group-hover:bg-white transition-colors duration-500">
                <img src={`https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/${img}`} alt={title} className="max-h-[110px] w-auto drop-shadow-md group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="px-4">
                <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight" style={{ color }}>{title}</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[5000000] bg-[#F8FAFC] font-sans selection:bg-blue-100 overflow-y-auto overflow-x-hidden">
            <div className="fixed top-10 right-10 z-[5000001]">
                <button onClick={onClose} className="p-7 bg-white shadow-2xl hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all active:scale-90 border-4 border-slate-100 group">
                    <X size={48} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
            </div>
            <div className="relative min-h-full pb-20">
                {currentPage === 'MENU' && renderMenu()}
                {currentPage === 'COURSE' && renderCourseHome()}
                {currentPage === 'UNIT_DETAIL' && renderUnitDetail()}
                {currentPage === 'BLOCKS' && renderBlocks()}
                {currentPage === 'STRUCTURE' && renderStructure()}
            </div>
        </div>
    );
};

export default HelpCenter;
