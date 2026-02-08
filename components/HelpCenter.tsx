import React, { useState } from 'react';
import { BookOpen, Trophy, ArrowLeft, Zap, Cpu, Hand, Palette, Eye, Compass, Info, Lightbulb, X, Activity, Target, Settings, PlusCircle, GraduationCap, MousePointer2, Ruler, Play, MoveVertical, Gauge, AlertTriangle, FastForward, Undo2, ChevronRight, Check, MoveHorizontal, RotateCw, RefreshCw, MoveRight, Layers, Navigation, CircleDot, Disc, MoveUp, MoveDown, Terminal, MousePointer, Share2, GitCommitHorizontal, Route, ArrowRightLeft, Timer, Radar, FastForward as SpeedIcon, ZapOff, Sparkles, Target as TargetIcon, Waves } from 'lucide-react';

type HelpPage = 'MENU' | 'BLOCKS' | 'CHALLENGES' | 'STRUCTURE' | 'COURSE';

interface HardwareDetail {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    howItWorks: string;
    technicalData: string[];
    programmingTip: string;
}

interface HelpCenterProps {
    onClose: () => void;
}

const HARDWARE_DETAILS: Record<string, HardwareDetail> = {
    motors: {
        id: 'motors',
        title: 'Drive Motors',
        icon: <Zap size={32} />,
        color: 'blue',
        howItWorks: 'The robot uses differential steering with two independent motors. By varying the power to each wheel, the robot can move forward, backward, or rotate on its axis.',
        technicalData: [
            'Power Range: -100% to 100%',
            'Max Speed: Approx 20 cm/s',
            'Independent Left/Right control'
        ],
        programmingTip: 'To turn right in place, set Left Motor to 50 and Right Motor to -50.'
    },
    touch: {
        id: 'touch',
        title: 'Touch Sensor',
        icon: <Hand size={32} />,
        color: 'pink',
        howItWorks: 'A physical bumper connected to a microswitch. When the red tip hits a wall, the circuit closes and sends a "True" signal to the brain.',
        technicalData: [
            'Type: Digital (On/Off)',
            'Trigger: 0.1cm compression',
            'Location: Front bumper'
        ],
        programmingTip: 'Always use a "wait until touch sensor pressed" block for the most reliable wall detection.'
    },
    gyro: {
        id: 'gyro',
        title: 'Gyro Sensor',
        icon: <Compass size={32} />,
        color: 'orange',
        howItWorks: 'Uses MEMS technology to measure rotational velocity. The brain integrates this data to keep track of the exact heading and pitch (tilt) of the robot.',
        technicalData: [
            'Heading: 0° - 359° (Continuous)',
            'Tilt (Pitch): -90° to +90°',
            'Precision: 0.1 degrees'
        ],
        programmingTip: 'Use the Heading to maintain a perfectly straight line even if the robot bumps into something.'
    },
    ultrasonic: {
        id: 'ultrasonic',
        title: 'Ultrasonic Sensor',
        icon: <Eye size={32} />,
        color: 'indigo',
        howItWorks: 'Works like a bat\'s radar. It emits a high-frequency sound pulse and measures the time it takes for the echo to bounce back from an object.',
        technicalData: [
            'Range: 3cm to 250cm',
            'Beam Angle: Approx 15°',
            'Detection Frequency: 40kHz'
        ],
        programmingTip: 'The sensor can detect walls from a distance. Use it to slow down before hitting a wall for smoother movement.'
    },
    color: {
        id: 'color',
        title: 'Color Sensor',
        icon: <Palette size={32} />,
        color: 'yellow',
        howItWorks: 'Projects a small beam of light onto the floor and uses a photodiode to measure the reflected wavelengths. It can identify specific colors and measure overall brightness.',
        technicalData: [
            'Recognized Colors: 10 standard colors',
            'Intensity Range: 0% (Dark) to 100% (Bright)',
            'Refresh Rate: 50Hz'
        ],
        programmingTip: 'Use "Light Intensity" for line following on gray surfaces where "Color" might not be distinct enough.'
    },
    leds: {
        id: 'leds',
        title: 'Status LEDs',
        icon: <Lightbulb size={32} />,
        color: 'purple',
        howItWorks: 'Two programmable RGB LEDs located on the top deck. They provide immediate visual feedback about the program state or sensor triggers.',
        technicalData: [
            'Type: RGB (Millions of colors)',
            'Location: Top left & Top right',
            'Status: Programmable via code'
        ],
        programmingTip: 'Set the LED to Red when an obstacle is detected and Green when the path is clear to help debug your logic.'
    },
    brain: {
        id: 'brain',
        title: 'Central Brain',
        icon: <Cpu size={32} />,
        color: 'emerald',
        howItWorks: 'The core processing unit that interprets your Blockly commands. It processes sensor inputs and calculates motor power 60 times every second.',
        technicalData: [
            'Processor: 32-bit High Speed',
            'Execution Rate: 60Hz (Simulated)',
            'Variable Memory: Infinite (Simulated)'
        ],
        programmingTip: 'The brain can run multiple event blocks (hat blocks) at once. Use "Broadcast" to sync complex behaviors.'
    }
};

const BlockSection: React.FC<{ title: string, color: string, children: React.ReactNode }> = ({ title, color, children }) => (
    <section>
        <div className="flex items-center gap-4 mb-8 border-b-4 pb-4" style={{ borderColor: color + '20' }}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
        </div>
    </section>
);

const BlockCard = ({ title, desc, img, color }: { title: string, desc: string, img: string, color: string }) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-100 hover:border-slate-200 transition-all hover:shadow-md flex flex-col gap-4">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center h-32 overflow-hidden">
            <img 
                src={`https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/${img}`} 
                alt={title} 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/200x100?text=${title.replace(/ /g, '+')}`;
                }}
            />
        </div>
        <div className="h-1 rounded-full w-12" style={{ backgroundColor: color }} />
        <h3 className="font-mono font-bold text-slate-800 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
);

// --- Diagrams ---

const DistanceDiagram = () => (
    <div className="relative w-full max-w-sm h-48 bg-white rounded-3xl border-2 border-blue-100 flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
        <svg viewBox="0 0 400 120" className="w-full">
            <defs>
                <marker id="arrow-blue-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4C97FF" />
                </marker>
            </defs>
            <line x1="40" y1="80" x2="360" y2="80" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="30" y="50" width="40" height="50" rx="4" fill="#3b82f6" opacity="0.3" />
            <rect x="330" y="50" width="40" height="50" rx="4" fill="#3b82f6" />
            <path d="M50 100 L350 100" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue-head)" />
            <text x="200" y="115" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">DISTANCE (cm)</text>
            <g transform="translate(40, 85)">
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="10" stroke="#94a3b8" strokeWidth="2" />
                ))}
            </g>
        </svg>
    </div>
);

const SpeedometerDiagram = () => (
    <div className="relative w-full max-w-sm h-48 bg-white rounded-3xl border-2 border-emerald-100 flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
        <svg viewBox="0 0 200 120" className="w-full h-full">
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
            <path d="M20 100 A80 80 0 0 1 130 35" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
            <circle cx="100" cy="100" r="8" fill="#1e293b" />
            <line x1="100" y1="100" x2="135" y2="45" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <text x="100" y="90" textAnchor="middle" fill="#1e293b" fontSize="14" fontWeight="black">75%</text>
            <text x="35" y="115" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">0%</text>
            <text x="165" y="115" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">100%</text>
        </svg>
    </div>
);

const UltrasonicRangeDiagram = () => (
    <div className="relative w-full max-w-sm h-48 bg-white rounded-3xl border-2 border-indigo-100 flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
        <svg viewBox="0 0 400 160" className="w-full">
            <path d="M40 80 L360 20 L360 140 Z" fill="#6366f1" opacity="0.1" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="20" y="65" width="30" height="30" rx="6" fill="#1e293b" />
            <circle cx="35" cy="72" r="3" fill="#6366f1" />
            <circle cx="35" cy="88" r="3" fill="#6366f1" />
            <g>
                {[1, 2, 3, 4].map(i => (
                    <path key={i} d={`M${60 + i * 40} ${80 - i * 15} Q${70 + i * 40} 80 ${60 + i * 40} ${80 + i * 15}`} fill="none" stroke="#6366f1" strokeWidth="2" opacity={1.2 - i * 0.2} />
                ))}
            </g>
            <text x="220" y="150" textAnchor="middle" fill="#6366f1" fontSize="12" fontWeight="black">BEAM RANGE: 255cm</text>
        </svg>
    </div>
);

const TouchDiagram = () => (
    <div className="relative w-full max-w-sm h-48 bg-white rounded-3xl border-2 border-pink-100 flex items-center justify-center overflow-hidden shadow-inner p-4">
        <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect x="300" y="20" width="20" height="160" fill="#94a3b8" rx="4" />
            <rect x="50" y="60" width="100" height="80" rx="8" fill="#334155" />
            <rect x="150" y="85" width="40" height="30" rx="4" fill="#e2e8f0" />
            <path d="M190 85 L260 85 L260 115 L190 115 Z" fill="#ef4444">
                <animate attributeName="x" from="190" to="230" dur="2s" repeatCount="indefinite" />
            </path>
            <circle cx="280" cy="100" r="10" fill="#ef4444" opacity="0.3">
                <animate attributeName="scale" from="0.5" to="2" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x="200" y="160" textAnchor="middle" fill="#db2777" fontSize="14" fontWeight="bold">TOUCH DETECTED</text>
        </svg>
    </div>
);

const ColorSensorDiagram = () => (
    <div className="relative w-full max-w-sm h-48 bg-white rounded-3xl border-2 border-yellow-100 flex items-center justify-center overflow-hidden shadow-inner p-4">
        <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect x="50" y="160" width="300" height="20" fill="#22c55e" rx="4" />
            <rect x="150" y="20" width="100" height="60" rx="8" fill="#334155" />
            <path d="M200 80 L160 160 L240 160 Z" fill="rgba(34, 197, 94, 0.2)" />
            <circle cx="200" cy="120" r="15" fill="#22c55e">
                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="200" y="195" textAnchor="middle" fill="#854d0e" fontSize="14" fontWeight="bold">RECOGNIZED: GREEN</text>
        </svg>
    </div>
);

const SpinTurnDiagram = () => (
    <div className="relative w-full h-72 bg-white rounded-3xl border-2 border-indigo-100 flex items-center justify-center overflow-hidden shadow-inner">
        <svg viewBox="0 0 200 200" className="w-full h-full p-12">
            <defs>
                <marker id="arrow-blue-spin" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4C97FF" />
                </marker>
                <marker id="arrow-red-spin" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
            </defs>
            <rect x="70" y="60" width="60" height="80" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="62" y="80" width="8" height="40" rx="2" fill="#334155" />
            <path d="M52 110 L52 75" stroke="#4C97FF" strokeWidth="3" fill="none" markerEnd="url(#arrow-blue-spin)" />
            <rect x="130" y="80" width="8" height="40" rx="2" fill="#334155" />
            <path d="M148 90 L148 125" stroke="#ef4444" strokeWidth="3" fill="none" markerEnd="url(#arrow-red-spin)" />
            <circle cx="100" cy="100" r="4" fill="#4C97FF" />
            <circle cx="100" cy="100" r="12" fill="none" stroke="#4C97FF" strokeWidth="1" strokeDasharray="2 2" />
            <text x="100" y="175" textAnchor="middle" fill="#4C97FF" fontSize="12" fontWeight="black">CENTER SPIN</text>
        </svg>
    </div>
);

const SwingTurnDiagram = () => (
    <div className="relative w-full h-72 bg-white rounded-3xl border-2 border-emerald-100 flex items-center justify-center overflow-hidden shadow-inner">
        <svg viewBox="0 0 200 200" className="w-full h-full p-12">
            <defs>
                <marker id="arrow-emerald-swing" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
            </defs>
            <rect x="70" y="60" width="60" height="80" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="62" y="80" width="8" height="40" rx="2" fill="#334155" />
            <path d="M52 110 L52 95" stroke="#10b981" strokeWidth="3" fill="none" markerEnd="url(#arrow-emerald-swing)" />
            <rect x="130" y="80" width="8" height="40" rx="2" fill="#334155" />
            <path d="M148 110 L148 65" stroke="#10b981" strokeWidth="3" fill="none" markerEnd="url(#arrow-emerald-swing)" />
            <path d="M100 130 A120 120 0 0 0 170 50" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            <text x="100" y="175" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="black">SWING TURN</text>
        </svg>
    </div>
);

const PivotTurnDiagram = () => (
    <div className="relative w-full h-72 bg-white rounded-3xl border-2 border-orange-100 flex items-center justify-center overflow-hidden shadow-inner">
        <svg viewBox="0 0 200 200" className="w-full h-full p-12">
            <defs>
                <marker id="arrow-orange-pivot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFAB19" />
                </marker>
            </defs>
            <rect x="70" y="60" width="60" height="80" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="62" y="80" width="8" height="40" rx="2" fill="#ef4444" />
            <circle cx="66" cy="100" r="5" fill="#ef4444" />
            <rect x="130" y="80" width="8" height="40" rx="2" fill="#1e293b" />
            <path d="M148 110 L148 65" stroke="#FFAB19" strokeWidth="4" fill="none" markerEnd="url(#arrow-orange-pivot)" />
            <text x="100" y="175" textAnchor="middle" fill="#FFAB19" fontSize="12" fontWeight="black">PIVOT POINT</text>
        </svg>
    </div>
);

const GyroTurnDiagram = () => (
    <div className="relative w-full h-72 bg-white rounded-3xl border-2 border-sky-100 flex items-center justify-center overflow-hidden shadow-inner">
        <svg viewBox="0 0 200 200" className="w-full h-full p-8">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 2" />
            <path d="M100 20 L100 180 M20 100 L180 100" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="85" y="75" width="30" height="50" rx="4" fill="#334155" />
            <path d="M100 75 A60 60 0 0 1 150 60" stroke="#0ea5e9" strokeWidth="4" fill="none" />
            <circle cx="155" cy="55" r="8" fill="#0ea5e9" />
            <text x="155" y="59" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">90°</text>
            <Compass className="text-sky-500 opacity-20" size={100} style={{ position: 'absolute' }} />
        </svg>
    </div>
);

const MoveLDiagram = () => (
    <div className="relative w-full h-72 bg-white rounded-3xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
        <svg viewBox="0 0 200 200" className="w-full h-full p-12">
            <path d="M40 160 L160 40" stroke="#64748b" strokeWidth="4" strokeDasharray="8 4" />
            <rect x="30" y="150" width="20" height="30" rx="2" fill="#334155" transform="rotate(-45 40 165)" />
            <rect x="150" y="30" width="20" height="30" rx="2" fill="#3b82f6" transform="rotate(-45 160 45)" />
            <text x="100" y="110" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold" transform="rotate(-45 100 110)">LINEAR</text>
        </svg>
    </div>
);

const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
    const [currentPage, setCurrentPage] = useState<HelpPage>('MENU');
    const [currentUnit, setCurrentUnit] = useState(1);
    const [selectedHardware, setSelectedHardware] = useState<HardwareDetail | null>(null);

    const renderMenu = () => (
        <div className="max-w-5xl mx-auto p-8 pt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center mb-16">
                <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">RoboCode Knowledge Center</h1>
                <p className="text-xl text-slate-500">Everything you need to master the virtual lab and build perfect code.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button onClick={() => setCurrentPage('COURSE')} className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-amber-500 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <GraduationCap size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Robotics Course</h2>
                        <p className="text-slate-500 text-sm">Step-by-step lessons to learn robotics from scratch.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-amber-600 text-white rounded-2xl font-bold group-hover:bg-amber-500 transition-colors">Start Learning</div>
                </button>
                <button onClick={() => setCurrentPage('STRUCTURE')} className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-emerald-500 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Info size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Robot Structure</h2>
                        <p className="text-slate-500 text-sm">Learn about the physical hardware, motors, and sensors.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold group-hover:bg-emerald-500 transition-colors">Hardware Info</div>
                </button>
                <button onClick={() => setCurrentPage('BLOCKS')} className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-blue-500 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <BookOpen size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Blocks Guide</h2>
                        <p className="text-slate-500 text-sm">Discover what every programming block does, from movement to logic.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold group-hover:bg-blue-500 transition-colors">View Blocks</div>
                </button>
                <button onClick={() => setCurrentPage('CHALLENGES')} className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-purple-500 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <Trophy size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Mission Help</h2>
                        <p className="text-slate-500 text-sm">Tips and tricks for completing lab missions and challenges.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-purple-600 text-white rounded-2xl font-bold group-hover:bg-purple-500 transition-colors">View Missions</div>
                </button>
            </div>
        </div>
    );

    const renderCourse = () => {
        const units = [
            {
                id: 1,
                title: "Unit 1: The Lab & Robot Basics",
                content: (
                    <div className="space-y-12 text-slate-700">
                        <section className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><MousePointer2 className="text-amber-500" /> Welcome to the Lab</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <p className="text-lg leading-relaxed">
                                    The Virtual Robotics Lab is split into two main areas:
                                    <br /><br />
                                    1. <b>The 3D World (Right side):</b> This is where your robot lives. Use your mouse to rotate and zoom, or the Camera buttons to switch views.
                                    <br /><br />
                                    2. <b>The Workspace (Left side):</b> This is where you build the "brain" of the robot using blocks.
                                </p>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">1</div>
                                        <p className="text-sm font-bold text-slate-700">Drag blocks from the toolbox to the center.</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold">2</div>
                                        <p className="text-sm font-bold text-slate-700">Connect them under the "When Flag Clicked" block.</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">3</div>
                                        <p className="text-sm font-bold text-slate-700">Press the Green Flag button at the top to start!</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 2,
                title: "Unit 2: Physics of Linear Motion",
                content: (
                    <div className="space-y-12">
                        {/* Direction Section */}
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><MoveVertical size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">1. Controlling Direction</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 p-6 rounded-3xl">
                                    <h4 className="text-xl font-bold text-slate-800 mb-3 underline decoration-blue-400 decoration-2">Drive Forward</h4>
                                    <p className="text-slate-600 text-sm mb-4">Moves the robot in the direction its main sensor is facing (0° Heading).</p>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                                        <img 
                                            src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_forward_distance_speed.svg" 
                                            className="h-24 object-contain"
                                            onError={(e) => (e.currentTarget.src = "https://placehold.co/200x50?text=Drive+Forward+Block")}
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl">
                                    <h4 className="text-xl font-bold text-slate-800 mb-3 underline decoration-pink-400 decoration-2">Drive Backward</h4>
                                    <p className="text-slate-600 text-sm mb-4">Reverses the polarity of the motors. Useful for backing away from obstacles.</p>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-4">
                                        <img 
                                            src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/robot_drive_simple.svg" 
                                            className="h-24 object-contain grayscale opacity-60"
                                            onError={(e) => (e.currentTarget.src = "https://placehold.co/200x50?text=Drive+Backward+Block")}
                                        />
                                        <ArrowRightLeft className="text-pink-500" size={24} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Distance Section */}
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm text-slate-700">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Ruler size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">2. Mastering Distance</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-4">
                                    <p className="text-lg leading-relaxed">
                                        The robot measures distance in <b>centimeters (cm)</b>. It calculates this by counting how many times the wheels rotate (encoders).
                                    </p>
                                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                                        <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Lightbulb size={16}/> Calculation Tip</h5>
                                        <p className="text-sm text-amber-700">One full rotation of the wheel covers approx <b>3.77 cm</b>. To drive 10cm, the robot turns its wheels about 2.6 times.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 w-full flex justify-center">
                                        <img 
                                            src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/robot_move.svg" 
                                            className="h-24 object-contain"
                                            onError={(e) => (e.currentTarget.src = "https://placehold.co/200x50?text=Move+Distance+Block")}
                                        />
                                    </div>
                                    <DistanceDiagram />
                                </div>
                            </div>
                        </section>

                        {/* Speed Section */}
                        <section className="bg-white p-10 rounded-[3rem] border-4 border-emerald-100 shadow-xl text-slate-700">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-emerald-100 text-emerald-600 rounded-3xl shadow-inner"><SpeedIcon size={32} strokeWidth={2.5} /></div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">3. Understanding Speed</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                        <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                            <div className="w-2 h-6 bg-blue-500 rounded-full"/> Speed-Controlled Blocks
                                        </h4>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            You can set the speed as a constant for all movements, or specify it for a single command.
                                        </p>
                                        
                                        <div className="space-y-4">
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Continuous Speed</div>
                                                <img 
                                                    src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_speed.svg" 
                                                    className="h-24 object-contain self-start"
                                                />
                                            </div>
                                            
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Task-Specific Speed</div>
                                                <img 
                                                    src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_forward_distance_speed.svg" 
                                                    className="h-24 object-contain self-start"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 relative overflow-hidden group">
                                        <AlertTriangle className="absolute -right-4 -bottom-4 text-emerald-100 group-hover:scale-110 transition-transform" size={120} />
                                        <div className="relative z-10">
                                            <h5 className="font-black text-emerald-900 text-lg mb-2 flex items-center gap-2"><Activity size={20}/> Physics: Momentum</h5>
                                            <p className="text-emerald-800 text-sm font-medium leading-relaxed">
                                                High speed means more <b>Kinetic Energy</b>. A robot driving at 100% speed will "coast" further after stopping than one at 20%. 
                                                <br/><br/>
                                                For precision tasks (like stopping exactly on a line), <b>lower speeds</b> are your best friend!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-8 bg-slate-50/50 rounded-[3rem] p-8 border-2 border-dashed border-slate-200">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Motor Power Output</h4>
                                    <SpeedometerDiagram />
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-white p-4 rounded-2xl text-center border border-slate-200 shadow-sm">
                                            <div className="text-2xl font-black text-slate-800">0%</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Stationary</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl text-center border border-slate-200 shadow-sm">
                                            <div className="text-2xl font-black text-emerald-500">100%</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Max Power</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 3,
                title: "Unit 3: Sensors & Decision Making",
                content: (
                    <div className="space-y-12">
                        {/* Ultrasonic Section */}
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm text-slate-700">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Radar size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">1. Seeing with Sound</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-4">
                                    <p className="text-lg leading-relaxed">
                                        The <b>Ultrasonic Sensor</b> acts as the robot's eyes. It sends out sound waves and measures how long it takes for them to bounce back.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 font-bold text-slate-600"><Check size={16} className="text-indigo-500" /> Measures distance from 3cm to 255cm.</li>
                                        <li className="flex items-center gap-2 font-bold text-slate-600"><Check size={16} className="text-indigo-500" /> Helps prevent crashes by "looking" ahead.</li>
                                    </ul>
                                </div>
                                <UltrasonicRangeDiagram />
                            </div>
                        </section>

                        {/* Logic Section */}
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm text-slate-700">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Timer size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">2. The "Wait Until" Concept</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <h4 className="text-xl font-bold text-slate-800 mb-3 underline decoration-amber-400 decoration-2">Event-Based Logic</h4>
                                    <p className="text-slate-600 text-sm mb-6 font-medium">Instead of driving for a set distance, we tell the robot: <b>"Drive forward until the sensor sees a wall."</b></p>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-4">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/control_waituntil.svg" className="h-24 object-contain" />
                                        <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase">
                                            <ArrowRightLeft size={14}/>
                                            <span>Connects to: "Distance {'<'} 20 cm"</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 text-slate-600">
                                    <p className="text-base font-medium">
                                        This logic makes the robot <b>reactive</b>. It doesn't just blindly follow instructions; it adapts to its environment.
                                    </p>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-bold">
                                        PRO TIP: Use "Stop Moving" immediately after a "Wait Until" block to ensure the robot stops precisely when the condition is met.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 4,
                title: "Unit 4: Turning Patterns & Trajectories",
                content: (
                    <div className="space-y-12">
                        <section className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                            <header className="mb-12">
                                <h3 className="text-4xl font-black text-slate-900 mb-4">Maneuvering Patterns</h3>
                                <p className="text-xl text-slate-500">Choosing the right way to change direction depends on the environment and the required precision.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Spin Turn */}
                                <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border-2 border-indigo-100 flex flex-col gap-6">
                                    <h4 className="text-2xl font-black text-indigo-900">Spin Turn (Point Turn)</h4>
                                    <div className="h-72 bg-white rounded-3xl border-2 border-indigo-100 p-2 overflow-hidden">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/spinturn.svg" className="w-full h-full object-contain" />
                                    </div>
                                    <SpinTurnDiagram />
                                    <div className="space-y-3">
                                        <p className="text-slate-700 font-medium">The robot spins <b>around its center</b>. One motor runs forward, the other backward.</p>
                                        <div className="bg-white/60 p-4 rounded-2xl border border-indigo-200">
                                            <h5 className="text-xs font-black text-indigo-600 uppercase mb-2 flex items-center gap-2"><TargetIcon size={14}/> When to use?</h5>
                                            <ul className="text-sm text-slate-600 space-y-1.5 font-bold">
                                                <li>• Dead ends: Perfect for doing a 180° flip.</li>
                                                <li>• Tight corridors: When there is no room to curve.</li>
                                                <li>• Fixed orientation: When you need to face a wall perfectly.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Pivot Turn */}
                                <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border-2 border-orange-100 flex flex-col gap-6">
                                    <h4 className="text-2xl font-black text-orange-900">Pivot Turn</h4>
                                    <div className="h-72 bg-white rounded-3xl border-2 border-orange-100 p-2 overflow-hidden">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/pivotgturn.svg" className="w-full h-full object-contain" />
                                    </div>
                                    <PivotTurnDiagram />
                                    <div className="space-y-3">
                                        <p className="text-slate-700 font-medium">The robot turns <b>around one wheel</b>. One wheel stays stopped while the other drives.</p>
                                        <div className="bg-white/60 p-4 rounded-2xl border border-orange-200">
                                            <h5 className="text-xs font-black text-orange-600 uppercase mb-2 flex items-center gap-2"><TargetIcon size={14}/> When to use?</h5>
                                            <ul className="text-sm text-slate-600 space-y-1.5 font-bold">
                                                <li>• Cornering: Great for squaring up with a wall corner.</li>
                                                <li>• Obstacles: Navigating around a small box.</li>
                                                <li>• Simple 90°: Easier to calculate than a curve turn.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Swing Turn */}
                                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border-2 border-emerald-100 flex flex-col gap-6">
                                    <h4 className="text-2xl font-black text-emerald-900">Curve / Swing Turn</h4>
                                    <div className="h-72 bg-white rounded-3xl border-2 border-emerald-100 p-2 overflow-hidden">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/turnswing.svg" className="w-full h-full object-contain" />
                                    </div>
                                    <SwingTurnDiagram />
                                    <div className="space-y-3">
                                        <p className="text-slate-700 font-medium">Wide, gentle turn. <b>Both wheels move</b>, but at different speeds.</p>
                                        <div className="bg-white/60 p-4 rounded-2xl border border-emerald-200">
                                            <h5 className="text-xs font-black text-emerald-600 uppercase mb-2 flex items-center gap-2"><TargetIcon size={14}/> When to use?</h5>
                                            <ul className="text-sm text-slate-600 space-y-1.5 font-bold">
                                                <li>• Racing: Best for high speeds as it keeps momentum.</li>
                                                <li>• Curved Lines: Essential for following arc-shaped paths.</li>
                                                <li>• Efficiency: The fastest way to change direction while moving.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Gyro Turn */}
                                <div className="bg-sky-50/50 p-8 rounded-[2.5rem] border-2 border-sky-100 flex flex-col gap-6">
                                    <h4 className="text-2xl font-black text-sky-900">Gyro-Assisted Turn</h4>
                                    <div className="h-72 bg-white rounded-3xl border-2 border-sky-100 p-2 flex items-center justify-center overflow-hidden">
                                        <GyroTurnDiagram />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-slate-700 font-medium">Using <b>sensors</b> to stop at a perfect angle (e.g., exactly 90°).</p>
                                        <div className="bg-white/60 p-4 rounded-2xl border border-sky-200">
                                            <h5 className="text-xs font-black text-sky-600 uppercase mb-2 flex items-center gap-2"><TargetIcon size={14}/> When to use?</h5>
                                            <ul className="text-sm text-slate-600 space-y-1.5 font-bold">
                                                <li>• Critical Tasks: When you MUST be 100% accurate.</li>
                                                <li>• Slippery Floors: Compensates for wheel slip on ramps.</li>
                                                <li>• Long Missions: Prevents small errors from adding up.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 5,
                title: "Unit 5: Sensors - The Robot's Senses",
                content: (
                    <div className="space-y-16">
                        {/* Ultrasonic */}
                        <section className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-3xl"><Waves size={32} /></div>
                                <h3 className="text-3xl font-black text-slate-900">1. Ultrasonic Sensor (Distance)</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                <div className="space-y-6 text-left">
                                    <p className="text-xl text-slate-600 leading-relaxed">
                                        This sensor works like the sonar system of bats or dolphins. It emits high-frequency sound waves and measures how long it takes for them to return from an obstacle.
                                    </p>
                                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                        <h4 className="font-black text-indigo-900 mb-2">Common Uses:</h4>
                                        <ul className="list-disc list-inside text-indigo-800 space-y-1">
                                            <li>Preventing wall collisions.</li>
                                            <li>Precise distance detection for parking.</li>
                                            <li>Maze navigation without physical contact.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Relevant Programming Block:</h4>
                                        <div className="flex flex-col gap-2">
                                            <BlockCard title="distance from obstacle" desc="Returns the distance in centimeters (0-255)." img="sensor_distance.svg" color="#00C7E5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6 items-center">
                                    <UltrasonicRangeDiagram />
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-500 border border-slate-200">Diagram: Sensor sound wave range</div>
                                </div>
                            </div>
                        </section>

                        {/* Color Sensor */}
                        <section className="bg-white p-10 rounded-[3rem] border-2 border-yellow-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-yellow-100 text-yellow-600 rounded-3xl"><Palette size={32} /></div>
                                <h3 className="text-3xl font-black text-slate-900">2. Color Sensor</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                <div className="space-y-6 text-left">
                                    <p className="text-xl text-slate-600 leading-relaxed">
                                        The sensor is located at the bottom of the robot, facing the floor. It projects white light and measures the color reflected back from the surface.
                                    </p>
                                    <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                                        <h4 className="font-black text-yellow-900 mb-2">Operation Modes:</h4>
                                        <ul className="list-disc list-inside text-yellow-800 space-y-1">
                                            <li><b>Color Identification:</b> Recognizes colors like Red, Green, Blue, and Black.</li>
                                            <li><b>Light Intensity:</b> Measures how "bright" or "dark" the surface is (excellent for line following).</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Relevant Programming Block:</h4>
                                        <div className="flex flex-col gap-2">
                                            <BlockCard title="touching color ?" desc="Checks if the robot is currently on a specific color." img="sensor_touchingcolor.svg" color="#00C7E5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6 items-center">
                                    <ColorSensorDiagram />
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-500 border border-slate-200">Diagram: Surface color detection</div>
                                </div>
                            </div>
                        </section>

                        {/* Touch Sensor */}
                        <section className="bg-white p-10 rounded-[3rem] border-2 border-pink-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-pink-100 text-pink-600 rounded-3xl"><Hand size={32} /></div>
                                <h3 className="text-3xl font-black text-slate-900">3. Touch Sensor</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                <div className="space-y-6 text-left">
                                    <p className="text-xl text-slate-600 leading-relaxed">
                                        This sensor is a simple physical button. When the red tip is pressed against a wall or obstacle, the electrical circuit closes and the robot knows it has touched something.
                                    </p>
                                    <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
                                        <h4 className="font-black text-pink-900 mb-2">Uses:</h4>
                                        <ul className="list-disc list-inside text-pink-800 space-y-1">
                                            <li>Safe stopping during a collision.</li>
                                            <li>"Feeling" walls during wall-following navigation.</li>
                                            <li>Starting a program by manually pressing the bumper.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Relevant Programming Block:</h4>
                                        <div className="flex flex-col gap-2">
                                            <BlockCard title="touch sensor pressed?" desc="Returns 'True' if the bumper is pressed." img="sensor_touchpressed.svg" color="#00C7E5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6 items-center">
                                    <TouchDiagram />
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-500 border border-slate-200">Diagram: Press mechanism and collision</div>
                                </div>
                            </div>
                        </section>

                        {/* Gyro Sensor */}
                        <section className="bg-white p-10 rounded-[3rem] border-2 border-orange-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-orange-100 text-orange-600 rounded-3xl"><Compass size={32} /></div>
                                <h3 className="text-3xl font-black text-slate-900">4. Gyro Sensor</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                <div className="space-y-6 text-left">
                                    <p className="text-xl text-slate-600 leading-relaxed">
                                        The Gyro is the robot's "compass" and "level". It measures rotational movement and angle changes with a precision of a fraction of a degree.
                                    </p>
                                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                        <h4 className="font-black text-orange-900 mb-2">Measured Data:</h4>
                                        <ul className="list-disc list-inside text-orange-800 space-y-1">
                                            <li><b>Rotation Angle (Heading):</b> Which direction the robot is facing (0-360 degrees).</li>
                                            <li><b>Tilt Angle:</b> Whether the robot is climbing up or down a ramp.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Relevant Programming Block:</h4>
                                        <div className="flex flex-col gap-2">
                                            <BlockCard title="gyro angle / tilt" desc="Returns the robot's current rotational or tilt angle." img="sensor_gyro.svg" color="#00C7E5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6 items-center">
                                    <GyroTurnDiagram />
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-500 border border-slate-200">Diagram: Measuring angles in 360 degrees</div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            }
        ];

        const activeUnit = units.find(u => u.id === currentUnit) || units[0];

        return (
            <div className="max-w-6xl mx-auto p-8 pt-16 animate-in fade-in duration-300 h-full overflow-y-auto pb-40">
                <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-2 text-amber-600 font-bold mb-8 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all">
                    <ArrowLeft size={20} /> Back to Help Menu
                </button>
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 mb-2">Course Curriculum</h1>
                        <p className="text-xl text-slate-500">Learn robotics step-by-step.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 overflow-x-auto max-w-full">
                        {units.map((u) => (
                            <button key={u.id} onClick={() => setCurrentUnit(u.id)} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${currentUnit === u.id ? 'bg-white text-amber-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}>Unit {u.id}</button>
                        ))}
                    </div>
                </header>
                <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <div className="mb-6">
                        <span className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">Active Lesson</span>
                        <h2 className="text-3xl font-black text-slate-800 mt-3">{activeUnit?.title}</h2>
                    </div>
                    {activeUnit?.content}
                </div>
                <div className="mt-16 flex justify-between border-t-2 border-slate-100 pt-8">
                    <button disabled={currentUnit === 1} onClick={() => setCurrentUnit(p => Math.max(1, p - 1))} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${currentUnit === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><ArrowLeft size={20} /> Previous Lesson</button>
                    <button onClick={() => {
                        const idx = units.findIndex(u => u.id === currentUnit);
                        if (idx < units.length - 1) setCurrentUnit(units[idx+1].id);
                    }} disabled={currentUnit === units[units.length-1]?.id} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${currentUnit === units[units.length-1]?.id ? 'opacity-30 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}>Next Lesson</button>
                </div>
            </div>
        );
    };

    const renderHardwareModal = () => {
        if (!selectedHardware) return null;
        return (
            <div className="fixed inset-0 z-[6000000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col border-4 border-emerald-500">
                    <div className={`p-8 bg-emerald-50 flex justify-between items-center border-b border-emerald-100`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 bg-white shadow-md rounded-2xl flex items-center justify-center text-emerald-500`}>{selectedHardware.icon}</div>
                            <h2 className="text-3xl font-black text-slate-900">{selectedHardware.title}</h2>
                        </div>
                        <button onClick={() => setSelectedHardware(null)} className="p-3 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-90"><X size={24} strokeWidth={3} /></button>
                    </div>
                    <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                        <div>
                            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={16} /> How it works?</h3>
                            <p className="text-slate-600 leading-relaxed text-xl">{selectedHardware.howItWorks}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Settings size={16} /> Technical Specs</h3>
                                <ul className="space-y-3">
                                    {selectedHardware.technicalData.map((data, i) => (
                                        <li key={i} className="flex items-center gap-2 text-base font-bold text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{data}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><TargetIcon size={16} /> Programming Tip</h3>
                                <p className="text-emerald-800 text-base font-bold leading-relaxed">{selectedHardware.programmingTip}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <button onClick={() => setSelectedHardware(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg">Got it!</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStructure = () => (
        <div className="max-w-7xl mx-auto p-8 pt-16 animate-in fade-in duration-300 h-full overflow-y-auto pb-40">
            <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"><ArrowLeft size={20} /> Back to Menu</button>
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-black text-slate-900 flex flex-col md:flex-row items-center justify-center gap-4"><span className="bg-emerald-600 text-white p-2 rounded-2xl"><Cpu size={32} /></span>Robot Hardware & Structure</h1>
                <p className="text-slate-500 mt-2 text-xl font-medium">Technical manual for the virtual robot hardware.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="space-y-6">
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.motors)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Zap size={20} /></div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Drive Motors</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-base leading-relaxed">Two independent motors allowing forward, backward movement and turning in place.</p>
                    </button>
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.touch)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Hand size={20} /></div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Touch Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-base leading-relaxed">A physical bumper located at the front tip. Returns "True" when hitting a wall.</p>
                    </button>
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.gyro)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Compass size={20} /></div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Gyro Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-base leading-relaxed">Measures the rotation angle and pitch (tilt) of the robot in real-time.</p>
                    </button>
                </div>
                <div className="flex flex-col gap-8 py-4 items-center">
                    <div className="relative group w-full">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1 rounded-full font-bold z-10">Hardware Diagram</div>
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex items-center justify-center min-h-[350px]">
                            <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/robotsensor.svg?v=1.2" alt="Robot Sensor Diagram" className="w-full h-auto max-w-sm drop-shadow-lg" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.ultrasonic)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Eye size={20} /></div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Ultrasonic Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-base leading-relaxed">The "eyes" of the robot. Measures distance to objects in cm using sound waves.</p>
                    </button>
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.color)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Palette size={20} /></div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Color Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-base leading-relaxed">Pointed at the floor. Identifies colors and light intensity for line following.</p>
                    </button>
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.leds)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Lightbulb size={20} /></div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Status LEDs</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-base leading-relaxed">Two programmable RGB lights on the back of the robot for visual feedback.</p>
                    </button>
                </div>
            </div>
            {renderHardwareModal()}
        </div>
    );

    const renderBlocks = () => (
        <div className="max-w-6xl mx-auto p-8 pt-16 animate-in fade-in duration-300 h-full overflow-y-auto pb-40">
            <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-2 text-blue-600 font-bold mb-8 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"><ArrowLeft size={20} /> Back to Help Menu</button>
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4"><span className="bg-blue-600 text-white p-2 rounded-2xl"><BookOpen size={32} /></span>Blocks Library</h1>
                <p className="text-slate-500 mt-2 text-lg">Full details of all blocks available in the lab.</p>
            </header>
            <div className="space-y-16 pb-32">
                <BlockSection title="Drive Blocks" color="#4C97FF">
                    <BlockCard title="drive forward" desc="Starts continuous movement of the robot forward or backward without distance limit." img="robot_drive_simple.svg" color="#4C97FF" />
                    <BlockCard title="drive forward distance" desc="Drives the robot for a defined distance (in cm) and then stops." img="robot_move.svg" color="#4C97FF" />
                    <BlockCard title="drive distance at speed" desc="Drives for a defined distance while setting motor power as a percentage." img="robot_move_speed.svg" color="#4C97FF" />
                    <BlockCard title="set default speed" desc="Sets the constant working speed for all subsequent movement actions." img="robot_set_speed.svg" color="#4C97FF" />
                    <BlockCard title="stop moving" desc="Immediately stops all robot movements." img="robot_stop.svg" color="#4C97FF" />
                    <BlockCard title="turn degree at speed" desc="Rotates the robot to a precise angle at the selected speed." img="robot_turn.svg" color="#4C97FF" />
                </BlockSection>
                <BlockSection title="Control" color="#FFAB19">
                    <BlockCard title="forever" desc="A loop that runs the code inside it repeatedly without end." img="control_forever.svg" color="#FFAB19" />
                    <BlockCard title="wait (seconds)" desc="Pauses program execution for a few seconds before the next block." img="robot_wait.svg" color="#FFAB19" />
                    <BlockCard title="wait until" desc="Stops code execution until a condition is met (e.g. hitting a wall)." img="control_waituntil.svg" color="#FFAB19" />
                </BlockSection>
            </div>
        </div>
    );

    const renderChallenges = () => (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-8 animate-bounce"><Zap size={48} className="text-purple-500 fill-purple-500" /></div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">Missions Guide</h1>
            <p className="text-xl text-slate-500 max-w-md mb-8">How to complete lab challenges like a pro.</p>
            <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-slate-100 text-left max-w-2xl">
                <h3 className="font-bold text-slate-800 text-lg mb-4 text-xl">Tips for Victory:</h3>
                <ul className="space-y-4 text-slate-700 text-base">
                    <li className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 mt-0.5" /><span>Use the <b>Ultrasonic sensor</b> to detect walls from a distance and prevent crashes.</span></li>
                    <li className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" /><span>The <b>Color sensor</b> is excellent for identifying finish lines or specific tracks.</span></li>
                    <li className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5" /><span>Use <b>Loops</b> to keep your code clean and perform repeating movement patterns.</span></li>
                </ul>
            </div>
            <button onClick={() => setCurrentPage('MENU')} className="mt-12 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">Back to Menu <ArrowLeft size={20} /></button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[5000000] bg-[#F8FAFC] font-sans selection:bg-blue-100 overflow-y-auto" dir="ltr">
            <div className="fixed top-6 left-6 z-[5000001]">
                <button onClick={onClose} className="p-4 bg-white/90 backdrop-blur-md hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all active:scale-90 shadow-xl border-2 border-slate-100 group" title="Close Help Center"><X size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" /></button>
            </div>
            <div className="relative min-h-full">
                {currentPage === 'MENU' && renderMenu()}
                {currentPage === 'BLOCKS' && renderBlocks()}
                {currentPage === 'CHALLENGES' && renderChallenges()}
                {currentPage === 'STRUCTURE' && renderStructure()}
                {currentPage === 'COURSE' && renderCourse()}
            </div>
        </div>
    );
};

export default HelpCenter;
