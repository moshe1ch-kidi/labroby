
import React, { useState } from 'react';
import { BookOpen, Trophy, ArrowLeft, Zap, Cpu, Hand, Palette, Eye, Compass, Info, Lightbulb, X, Activity, Target, Settings, GraduationCap, Play, Gauge, Radar, CheckCircle2, ChevronRight, ChevronDown, Layers, Repeat, Variable, Star, LightbulbIcon, ArrowRight, ShieldCheck, Milestone, MoveHorizontal, RotateCw, Scaling, Flame, Waves, Fingerprint, ZapOff, Code, MonitorPlay, AlertTriangle, RotateCcw, Share2, Table, Projector, ListChecks, GitBranch, RefreshCw, Binary } from 'lucide-react';

type HelpPage = 'MENU' | 'BLOCKS' | 'CHALLENGES' | 'STRUCTURE' | 'COURSE' | 'UNIT_DETAIL';

interface HelpCenterProps {
    onClose: () => void;
}

interface Mission {
    id?: string;
    title: string;
    objective: string;
    hint: string;
    deepDive?: {
        title: string;
        concepts: { name: string, description: string }[];
        advantagesTitle: string;
        advantages: string[];
    };
    img?: string; // Field/Environment Image
    imgCode?: string; // Specific Program/Code Image
    videoCode?: string; // Video solution for the program
    video?: string; // Live visual guide video
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

// Helper to convert filename to readable label in English
const getBlockLabel = (filename: string): string => {
    const name = filename.replace('.svg', '');
    const mapping: Record<string, string> = {
        'drive_forward_distance': 'Drive Distance',
        'drive_forward': 'Drive Forward',
        'drive_speed': 'Set Speed',
        'drive_stop': 'Stop Moving',
        'led_setcolor': 'Set LED Color',
        'led_turnoff': 'Turn LED Off',
        'sensor_distance': 'Distance Sensor',
        'sensor_gyro': 'Gyro Sensor',
        'sensor_touch': 'Touch Sensor',
        'sensor_touchingcolor': 'Touching Color?',
        'drive_turn_dgree_speed': 'Turn by Degrees',
        'drive_turn_until_speed': 'Turn Until...',
        'drive_heading_dgree': 'Set Heading',
        'drive_setmotor': 'Set Raw Motors',
        'control_forever': 'Forever Loop',
        'repeatornge': 'Repeat X Times',
        'control_ifelse': 'If / Else',
        'control_if': 'If Then',
        'logic_compare': 'Compare (>, <, =)',
        'logic_and': 'And / Or',
        'control_wait': 'Wait Seconds'
    };
    return mapping[name] || name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

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
        keyBlocks: ["drive_forward_distance.svg", "drive_speed.svg", "drive_stop.svg"]
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
                img: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/led_setcolor.svg",
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
        title: "Programming Logic & Efficiency",
        subtitle: "Loops, Branching & Decision Making",
        description: "Optimizing code with loops and teaching the robot to make autonomous decisions based on conditions.",
        details: "As programs grow, efficiency becomes critical. Instead of repeating the same blocks (Sequence), we use Loops. To make robots truly smart, we use Conditional Statements (If/Else) to allow them to choose paths based on sensor input.",
        technicalConcepts: [
            { title: "Programming Efficiency", content: "Writing the same sequence of blocks over and over is inefficient. This is where the 'Loop' concept comes in – instead of writing the same blocks four times, we use a single loop block (orange) that tells the robot to repeat the action 4 times." },
            { title: "Stacking Loops", content: "Adding blocks one after another. The robot will finish all iterations of the first loop before moving on to the next loop in line." },
            { title: "Nesting Loops", content: "Placing one loop block inside the 'mouth' of another loop block. Every time the outer loop runs once, it triggers the inner loop to run through its entire set of repetitions. This allows for massive complexity with very few blocks." },
            { title: "Program Branching", content: "The IF statement forces the program to check a condition. If the condition is met, the robot executes what's inside the block. If not, it simply moves on. This makes the robot responsive and intelligent." }
        ],
        color: "#FFAB19",
        icon: <Layers size={32} />,
        lessons: [
            { title: "Efficiency with Loops", description: "Learn to replace redundant sequences with structured loops. Understand 'Stacking' (sequential loops) and 'Nesting' (loops inside loops)." },
            { title: "The If-Then Formula", description: "Use diamond-shaped parameters to define conditions. If a condition is met, execute; otherwise, skip. Remember: Sequence matters!" },
            { title: "Path Branching", description: "Master If-Else blocks to create different behaviors for different sensor scenarios (e.g., Obstacle on Left vs. Obstacle on Right)." }
        ],
        missions: [
             {
                title: "Efficiency: THE SQUARE LOOP",
                objective: "Drive in a perfect square pattern. Instead of using 8 blocks, achieve the goal using a 'Repeat' loop with only 2 blocks inside.",
                hint: "Put 'Drive Distance' and 'Turn 90°' inside a 'Repeat 4 times' block.",
                videoCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/missionrepeat.mp4",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/missionrepeat1.mp4",
            },
            {
                title: "Mission 2: THE TOUCH & COLOR LOGIC (IF)",
                objective: "Program the robot to drive forward with green LEDs. Upon hitting an obstacle (touch sensor), it should stop, turn the LEDs red, and wait for one second. Then, it should drive backward with yellow LEDs and stop automatically only when it detects the green color on the ground.",
                hint: "Use an 'If' block inside a 'Forever' loop to check the state of the touch sensor. Inside the 'If', place the commands for changing lights, waiting, and starting the backward motion. Use the 'Wait Until' block to stop when the green color is detected.",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/MISSION2IF.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/MISSION2IF.mp4",
            },
            {
                title: "Mission 3: ULTRASONIC RANGE LOGIC (IF ELSE)",
                objective: "Program the robot to move forward continuously as long as the distance from the wall is greater than 10cm. If the distance becomes 10cm or less, the robot must reverse for 50cm. The entire logic must be placed inside a 'Forever' loop so the robot automatically approaches and retreats from the wall.",
                hint: "Use the 'If Else' block inside a 'Forever' loop. Set the condition to 'Distance from obstacle > 10'. In the 'Then' section, use 'Drive Forward'. In the 'Else' section, use 'Drive Distance' set to -50cm.",
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/ultrasonicifelse.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/ultrasonicifelse.mp4",
            },
            {
                title: "Mission 4: Speed Control by Track Color",
                objective: "Identify the track color to adjust the robot's speed dynamically. Program the robot to drive fast (100%) on Green, moderate (50%) on Yellow, and very slow (20%) on Red. The robot must stop and the program must terminate exactly at the purple stop line.",
                hint: "Engineer Hint: For this mission, you must select the 'Color Run - 4 Meters' challenge from the challenges menu. Use nested If Else blocks inside a Forever loop to check colors and update the driving speed accordingly.",
                deepDive: {
                    title: "Advanced Logic Concepts",
                    concepts: [
                        { name: "1. Forever Loop", description: "This is your 'while True' engine. It ensures the internal code runs repeatedly without stopping. In robotics, this is vital because the robot needs to 'sample' its environment and sensors every split second to respond correctly." },
                        { name: "2. Nested If-Else Blocks", description: "This is the heart of complex decision-making. 'Nested' means placing one If-Else block inside the 'Else' branch of another. This creates a logical hierarchy or 'staircase' where the robot checks conditions in a specific order." }
                    ],
                    advantagesTitle: "Why Use Nested Logic?",
                    advantages: [
                        "Prioritization: Ensures only one action happens at a time. If the robot sees two colors, it follows only the first match.",
                        "Computational Efficiency: Once a condition is true, the processor skips all other checks in the nested tree, saving energy and speed.",
                        "Conflict Resolution: Prevents overlapping commands (like setting speed to 20 and 50 at once). The logic flow is always clear and unambiguous."
                    ]
                },
                imgCode: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/missioncolorspeed.svg",
                video: "https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/missioncolorspeed.mp4",
                requiredChallenge: "c_color_run"
            }
        ],
        keyBlocks: ["control_forever.svg", "repeatornge.svg", "control_ifelse.svg", "logic_compare.svg", "logic_and.svg", "control_if.svg"]
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

const FlowDiagram = ({ type }: { type: 'NESTING' | 'BRANCHING' }) => {
    if (type === 'NESTING') {
        return (
            <svg viewBox="0 0 200 120" className="w-full h-auto">
                <rect x="10" y="10" width="180" height="100" rx="8" fill="#FFAB19" fillOpacity="0.2" stroke="#FFAB19" strokeWidth="2" strokeDasharray="4 2" />
                <text x="20" y="25" fontSize="10" fontWeight="bold" fill="#CF8B17">OUTER LOOP (x10)</text>
                <rect x="40" y="40" width="120" height="50" rx="8" fill="#FFAB19" stroke="#FFAB19" strokeWidth="2" />
                <text x="50" y="55" fontSize="10" fontWeight="bold" fill="white">INNER LOOP (x4)</text>
                <rect x="60" y="65" width="80" height="15" rx="4" fill="white" fillOpacity="0.5" />
                <text x="100" y="76" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#CF8B17">DRIVE & TURN</text>
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 200 120" className="w-full h-auto">
            <path d="M100 10 L100 30" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="70" y="30" width="60" height="30" rx="4" fill="#FFAB19" stroke="#CF8B17" strokeWidth="2" transform="rotate(45, 100, 45)" />
            <text x="100" y="50" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">IF?</text>
            <path d="M80 50 L40 80" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
            <path d="M120 50 L160 80" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrow)" />
            <text x="40" y="100" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ef4444">FALSE (Else)</text>
            <text x="160" y="100" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#22c55e">TRUE (Then)</text>
            <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                </marker>
            </defs>
        </svg>
    );
};

const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
    const [currentPage, setCurrentPage] = useState<HelpPage>('MENU');
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [expandedMissionIdx, setExpandedMissionIdx] = useState<number | null>(null);

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
                        onClick={() => { setSelectedUnit(unit); setCurrentPage('UNIT_DETAIL'); setExpandedMissionIdx(null); }}
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

                            {/* MODULE 5 SPECIAL: LOGIC CONCEPTS */}
                            {selectedUnit.id === 5 && (
                                <div className="space-y-24">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="bg-amber-50 rounded-[4rem] border-2 border-amber-100 flex flex-col overflow-hidden">
                                            <div className="p-10 space-y-6">
                                                <h4 className="text-3xl font-black text-amber-600 uppercase flex items-center gap-3"><RefreshCw /> Stacking & Nesting Loops</h4>
                                                <p className="text-xl text-slate-700 font-medium"><b>Stacking:</b> Placing loops one after another. The robot finishes the first set of repetitions completely before moving to the next.</p>
                                                <p className="text-xl text-slate-700 font-medium"><b>Nesting:</b> Placing a loop inside another's "mouth". The inner loop is treated as a single command that the outer loop repeats. This allows for massive complexity with minimal blocks.</p>
                                            </div>
                                            <div className="bg-white p-8 border-t-2 border-amber-50">
                                                <FlowDiagram type="NESTING" />
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 rounded-[4rem] border-2 border-blue-100 flex flex-col overflow-hidden">
                                            <div className="p-10 space-y-6">
                                                <h4 className="text-3xl font-black text-blue-600 uppercase flex items-center gap-3"><GitBranch /> Branching Paths (If/Else)</h4>
                                                <p className="text-xl text-slate-700 font-medium italic">"If it is Saturday, then go to the beach; otherwise, stay home."</p>
                                                <p className="text-xl text-slate-700 font-medium">The <b>If-Else</b> block forces a split. The robot checks the diamond-shaped condition; if true, it takes the first path. If false, it takes the "Else" path. It never does both!</p>
                                            </div>
                                            <div className="bg-white p-8 border-t-2 border-blue-50">
                                                <FlowDiagram type="BRANCHING" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-12 rounded-[4rem] shadow-2xl text-white">
                                        <h3 className="text-4xl font-black mb-8 flex items-center gap-4 text-amber-400"><ListChecks /> Algorithmic Rules</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <h5 className="text-2xl font-bold text-slate-300 uppercase">Sequence</h5>
                                                <p className="text-slate-400 leading-relaxed text-lg">Every program moves step-by-step. Even with complex nested conditions, the robot always checks the top block first and follows the flow chronologically.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="text-2xl font-bold text-slate-300 uppercase">Decision Menus</h5>
                                                <p className="text-slate-400 leading-relaxed text-lg">By nesting multiple If-Else blocks, you can create a "Decision Tree". Obstacle on the left? Turn right. Else, if obstacle on the right? Turn left. Otherwise? Drive straight.</p>
                                            </div>
                                        </div>
                                        <div className="mt-12 bg-slate-800 p-8 rounded-3xl border border-slate-700 flex items-start gap-4">
                                            <AlertTriangle className="text-amber-500 shrink-0 mt-1" />
                                            <p className="text-slate-300 italic"><b>Pro Tip:</b> The robot processes code faster than you can blink (1/100th of a second). If your 'If' block depends on a physical event, consider adding a 'Wait' block to synchronize the robot with your actions.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                <div className="flex flex-wrap items-start gap-8">
                                    {selectedUnit.keyBlocks.map((block, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-3 group">
                                            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-lg group-hover:border-blue-200 transition-all inline-flex items-center justify-center">
                                                <img src={`https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/${block}`} alt={getBlockLabel(block)} className="h-auto w-auto max-h-[90px] block group-hover:scale-105 transition-transform" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getBlockLabel(block)}</span>
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

                                                                {mission.deepDive && (
                                                                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 space-y-8 shadow-sm">
                                                                        <div className="flex items-center gap-3 text-indigo-600">
                                                                            <Binary size={24} />
                                                                            <h5 className="text-3xl font-black uppercase tracking-tight">{mission.deepDive.title}</h5>
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                                            {mission.deepDive.concepts.map((concept, cIdx) => (
                                                                                <div key={cIdx} className="space-y-3">
                                                                                    <h6 className="text-xl font-black text-slate-800 uppercase tracking-wide">{concept.name}</h6>
                                                                                    <p className="text-slate-600 text-lg leading-relaxed">{concept.description}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
                                                                            <h6 className="text-xl font-black text-indigo-700 uppercase mb-4 flex items-center gap-2"><CheckCircle2 size={20}/> {mission.deepDive.advantagesTitle}</h6>
                                                                            <ul className="space-y-3">
                                                                                {mission.deepDive.advantages.map((adv, aIdx) => (
                                                                                    <li key={aIdx} className="flex items-start gap-3 text-indigo-900 font-medium text-lg leading-snug">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                                                                                        {adv}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {(mission.imgCode || mission.videoCode) && (
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em] pl-4"><Code size={16} /> Official Program Solution</div>
                                                                        <div className="p-8 bg-slate-900 rounded-[3rem] border-4 border-indigo-500/30 shadow-2xl relative overflow-hidden min-h-[300px] flex items-center justify-center group-hover:border-indigo-500 transition-all duration-500">
                                                                            {mission.videoCode ? (
                                                                                <video src={mission.videoCode} autoPlay loop muted playsInline className="w-full h-auto object-contain rounded-lg shadow-2xl" />
                                                                            ) : (
                                                                                <img src={mission.imgCode} alt="Code Solution" className="w-auto h-auto max-w-full rounded-lg drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                                                                            )}
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
                </BlockSection>
                <BlockSection title="Control & Logic" color="#FFAB19">
                    <BlockCard title="Forever" desc="Loops the code blocks indefinitely." img="control_forever.svg" color="#FFAB19" />
                    <BlockCard title="Repeat X Times" desc="Repeats the internal blocks for a specific count." img="repeatornge.svg" color="#FFAB19" />
                    <BlockCard title="If Condition" desc="Executes if the logical statement is true." img="control_if.svg" color="#FFAB19" />
                    <BlockCard title="If Else" desc="Selects between two paths of execution." img="control_ifelse.svg" color="#FFAB19" />
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
