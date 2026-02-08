import React, { useState } from 'react';
import { BookOpen, Trophy, ArrowLeft, Zap, Cpu, Hand, Palette, Eye, Compass, Info, Lightbulb, X, Activity, Target, Settings, PlusCircle, GraduationCap, MousePointer2, Ruler, Play, MoveVertical, Gauge, AlertTriangle, FastForward, Undo2, ChevronRight, Check, MoveHorizontal, RotateCw, RefreshCw, MoveRight, Layers, Navigation, CircleDot, Disc, MoveUp, MoveDown, Terminal, MousePointer } from 'lucide-react';

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
                    (e.target as HTMLImageElement).src = "https://placehold.co/200x100?text=Block+Icon";
                }}
            />
        </div>
        <div className="h-1 rounded-full w-12" style={{ backgroundColor: color }} />
        <h3 className="font-mono font-bold text-slate-800 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
);

const PivotTurnDiagram = () => (
    <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-[2rem] border-4 border-indigo-100 flex items-center justify-center overflow-hidden shadow-inner p-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <marker id="arrow-head-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4C97FF" />
                </marker>
            </defs>
            {/* Robot Base */}
            <rect x="60" y="50" width="80" height="100" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
            
            {/* Center of Rotation */}
            <circle cx="100" cy="100" r="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.2" />
            <circle cx="100" cy="100" r="8" fill="#ef4444" />
            <text x="100" y="125" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">AXIS</text>

            {/* Left Wheel Power Forward */}
            <rect x="48" y="80" width="12" height="40" rx="3" fill="#1e293b" />
            <path d="M35 120 L35 85" stroke="#4C97FF" strokeWidth="6" fill="none" markerEnd="url(#arrow-head-blue)" />
            
            {/* Right Wheel Power Backward */}
            <rect x="140" y="80" width="12" height="40" rx="3" fill="#1e293b" />
            <path d="M165 80 L165 115" stroke="#4C97FF" strokeWidth="6" fill="none" markerEnd="url(#arrow-head-blue)" />
            
            <text x="100" y="180" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="black">OPPOSITE POWER</text>
        </svg>
    </div>
);

const SwingTurnDiagram = () => (
    <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-[2rem] border-4 border-amber-100 flex items-center justify-center overflow-hidden shadow-inner p-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <marker id="arrow-head-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFAB19" />
                </marker>
            </defs>
            {/* Robot Base */}
            <rect x="60" y="70" width="80" height="100" rx="12" fill="#fffcf9" stroke="#fed7aa" strokeWidth="3" />
            
            {/* Left Wheel (STATIONARY - Center of Rotation) */}
            <rect x="48" y="100" width="12" height="40" rx="3" fill="#ef4444" />
            <circle cx="54" cy="120" r="10" fill="#ef4444" />
            <text x="54" y="150" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">PIVOT</text>

            {/* Right Wheel (DRIVING) */}
            <rect x="140" y="100" width="12" height="40" rx="3" fill="#1e293b" />
            <path d="M146 100 A90 90 0 0 0 54 10" stroke="#FFAB19" strokeWidth="6" fill="none" markerEnd="url(#arrow-head-amber)" />
            
            <text x="100" y="185" textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="black">ONE MOTOR DRIVES</text>
        </svg>
    </div>
);

interface HelpCenterProps {
    onClose: () => void;
}

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
                    <div className="space-y-12">
                        <section className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><MousePointer2 className="text-amber-500" /> Welcome to the Lab</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <p className="text-lg text-slate-600 leading-relaxed">
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
                title: "Unit 2: Linear Motion (Forward & Backward)",
                content: (
                    <div className="space-y-12">
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><MoveVertical size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">Controlling Direction</h3>
                            </div>
                            <p className="text-xl text-slate-600 leading-relaxed mb-10">In robotics, driving in a straight line is the foundation of every maneuver. To switch from driving forward to driving backward, use the dropdown menu inside the drive blocks:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-transparent hover:border-blue-400 transition-all">
                                    <h4 className="text-xl font-black text-slate-800 mb-4 underline decoration-blue-200 decoration-4">Drive Forward</h4>
                                    <p className="text-slate-600 mb-6">The default setting. The robot drives in the direction its sensors are facing.</p>
                                    <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_forward.svg" className="h-12 bg-white p-2 rounded-xl border border-slate-200" />
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-transparent hover:border-pink-400 transition-all">
                                    <h4 className="text-xl font-black text-slate-800 mb-4 underline decoration-pink-200 decoration-4">Drive Backward</h4>
                                    <p className="text-slate-600 mb-6">Click the word <b>forward</b> and select <b>backward</b>. The robot will move in reverse.</p>
                                    <div className="flex items-center gap-4">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_forward.svg" className="h-12 bg-white p-2 rounded-xl border border-slate-200 grayscale" />
                                        <Undo2 className="text-pink-500" size={32} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 bg-amber-50 p-6 rounded-[2rem] border-2 border-amber-100 flex items-start gap-4">
                                <AlertTriangle className="text-amber-500 shrink-0" size={32} />
                                <div>
                                    <h4 className="text-lg font-black text-amber-800 mb-2">Safety Tip: Driving Blind</h4>
                                    <p className="text-amber-900 leading-relaxed">Remember! The sensors (Distance, Touch, Color) are on the <b>front</b> of the robot. When driving backward, the robot cannot "see" obstacles. Always plan your distance carefully!</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 3,
                title: "Unit 3: Speed, Power & Inertia",
                content: (
                    <div className="space-y-12">
                        <section className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><Gauge className="text-blue-500" /> Speed Control Blocks</h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">There are three main ways to control the velocity of your robot. Speed is measured in <b>Percentage (%)</b> from 0 (stopped) to 100 (maximum speed).</p>
                            <div className="space-y-8">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black text-blue-600 mb-2">Set Global Speed</h4>
                                        <p className="text-slate-600 mb-4">The <b>"set default speed"</b> block changes the speed for <b>all</b> following movement commands.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border shadow-inner">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_speed.svg" className="h-12" />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black text-emerald-600 mb-2">Drive at Speed</h4>
                                        <p className="text-slate-600 mb-4">The <b>"drive distance at speed"</b> block lets you set a specific power level for only that single movement.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border shadow-inner">
                                        <img src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/blocks/drive_forward_distance_speed.svg" className="h-12" />
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="bg-blue-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 p-8 opacity-10"><Zap size={200} /></div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black mb-6 flex items-center gap-3"><Info className="text-amber-400" /> What is Inertia?</h3>
                                <p className="text-xl text-blue-100 leading-relaxed mb-8">If your robot drives at 100% speed and suddenly stops, it will "slide" forward slightly due to inertia.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                                        <h4 className="font-bold text-amber-400 mb-2 uppercase text-xs tracking-widest">Low Precision</h4>
                                        <p className="text-sm">Driving at 100% causes route deviations.</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                                        <h4 className="font-bold text-emerald-400 mb-2 uppercase text-xs tracking-widest">Controlled Speed</h4>
                                        <p className="text-sm">30-50% speed gives much better traction.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 4,
                title: "Unit 4: The Art of Rotation",
                content: (
                    <div className="space-y-12">
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><RefreshCw size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">Point Turn vs. Swing Turn</h3>
                            </div>
                            <p className="text-xl text-slate-600 leading-relaxed mb-12">Robots change direction using two main physical patterns. The difference is the <b>Center of Rotation</b> — the exact spot the robot spins around.</p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-400 transition-all flex flex-col items-center">
                                    <div className="flex items-center justify-between gap-3 mb-6 w-full">
                                        <div className="flex items-center gap-3">
                                            <CircleDot className="text-indigo-500" size={32} />
                                            <h4 className="text-2xl font-black text-slate-800">Point Turn (Pivot)</h4>
                                        </div>
                                    </div>
                                    <PivotTurnDiagram />
                                    <div className="mt-8 space-y-6 w-full text-center">
                                        <p className="text-lg text-slate-600 font-medium">The robot rotates <b>on its own center</b>. The wheels move in <b>opposite directions</b> at the same power.</p>
                                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-700 font-bold text-sm text-left">
                                            ✔ Highest Precision <br/>
                                            ✔ Used for tight corners & "turning on a dime" <br/>
                                            ✔ Zero turn radius
                                        </div>
                                        <div className="space-y-3 pt-6 border-t border-slate-200">
                                            <h5 className="text-xs font-black text-slate-400 uppercase flex items-center justify-center gap-2"><Terminal size={14}/> Recommended Block:</h5>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-indigo-100 inline-block overflow-hidden">
                                                <img 
                                                    src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/spinturn.svg" 
                                                    className="h-20" 
                                                    alt="Point Turn Block"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-amber-400 transition-all flex flex-col items-center">
                                    <div className="flex items-center justify-between gap-3 mb-6 w-full">
                                        <div className="flex items-center gap-3">
                                            <Disc className="text-amber-500" size={32} />
                                            <h4 className="text-2xl font-black text-slate-800">Swing Turn</h4>
                                        </div>
                                    </div>
                                    <SwingTurnDiagram />
                                    <div className="mt-8 space-y-6 w-full text-center">
                                        <p className="text-lg text-slate-600 font-medium">The robot swings around <b>one stationary wheel</b>. One motor drives while the other is stopped.</p>
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 font-bold text-sm text-left">
                                            ✔ Smooth wide curves <br/>
                                            ✔ Great for following circular tracks <br/>
                                            ✔ Turn radius = robot width
                                        </div>
                                        <div className="space-y-3 pt-6 border-t border-slate-200">
                                            <h5 className="text-xs font-black text-slate-400 uppercase flex items-center justify-center gap-2"><Terminal size={14}/> Recommended Block:</h5>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-amber-100 inline-block overflow-hidden">
                                                <img 
                                                    src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/swingturn.svg" 
                                                    className="h-20" 
                                                    alt="Swing Turn Block"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl">
                             <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Layers size={24} className="text-indigo-400" /> Mastering Angles</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="text-3xl font-black text-indigo-400">90°</div>
                                    <div className="text-xs uppercase font-bold mt-2 opacity-60">Square Turn</div>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="text-3xl font-black text-amber-400">180°</div>
                                    <div className="text-xs uppercase font-bold mt-2 opacity-60">U-Turn</div>
                                </div>
                                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="text-3xl font-black text-emerald-400">360°</div>
                                    <div className="text-xs uppercase font-bold mt-2 opacity-60">Full Circle</div>
                                </div>
                            </div>
                        </section>
                        <div className="bg-indigo-600 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><RefreshCw size={200} /></div>
                            <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                                    <Target size={56} className="text-indigo-600" />
                                </div>
                                <div className="flex-1 text-center lg:text-left">
                                    <h3 className="text-4xl font-black mb-4">Challenge: The Magic Square</h3>
                                    <p className="text-xl opacity-90 leading-relaxed max-w-2xl">Can you drive the robot in a perfect square? Use the <b>Repeat 4 Times</b> block to keep your code clean!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: 5,
                title: "Unit 5: Compass & Gyro Navigation",
                content: (
                    <div className="space-y-12">
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Navigation size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">Heading Logic</h3>
                            </div>
                            <p className="text-xl text-slate-600 leading-relaxed mb-10">Instead of just turning "90 degrees", you can tell the robot to face an <b>absolute</b> direction on the map.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 bg-orange-50 p-6 rounded-3xl border border-orange-100">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border"><Compass size={24}/></div>
                                        <div>
                                            <h4 className="text-xl font-bold text-orange-800 mb-2">Absolute Heading</h4>
                                            <p className="text-orange-700">North is 0°, East is 90°, South is 180°, and West is 270°.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm border"><Target size={24}/></div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-2">Set Heading To</h4>
                                            <p className="text-slate-500">The robot will auto-rotate until it faces the exact compass degree you set.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-48 h-48 border-4 border-slate-700 rounded-full flex items-center justify-center">
                                        <div className="absolute top-2 font-black text-slate-400">0° (N)</div>
                                        <div className="absolute right-2 font-black text-slate-400">90° (E)</div>
                                        <div className="absolute bottom-2 font-black text-slate-400">180° (S)</div>
                                        <div className="absolute left-2 font-black text-slate-400">270° (W)</div>
                                        <div className="w-1 h-20 bg-orange-500 rounded-full origin-bottom -translate-y-10 rotate-45" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            },
            {
                id: 6,
                title: "Unit 6: Manual Motor Control",
                content: (
                    <div className="space-y-12">
                        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><Settings size={28} /></div>
                                <h3 className="text-3xl font-black text-slate-800">Differential Steering</h3>
                            </div>
                            <p className="text-xl text-slate-600 leading-relaxed mb-10">High-level robotics uses independent wheel control. By changing the speed of each motor, you create custom turns.</p>
                            
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                                <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><MoveHorizontal size={24} className="text-red-500" /> Motor Power Combinations</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                                        <div className="text-xs font-black text-slate-400 mb-4">Left: 50 | Right: 10</div>
                                        <p className="font-bold text-slate-700">Wide Right Curve</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                                        <div className="text-xs font-black text-slate-400 mb-4">Left: 50 | Right: -50</div>
                                        <p className="font-bold text-slate-700">Point Turn (Pivot)</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                                        <div className="text-xs font-black text-slate-400 mb-4">Left: 50 | Right: 0</div>
                                        <p className="font-bold text-slate-700">Swing Turn</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )
            }
        ];

        const activeUnit = units.find(u => u.id === currentUnit);

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
                    <button disabled={currentUnit === units.length} onClick={() => setCurrentUnit(p => Math.min(units.length, p + 1))} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${currentUnit === units.length ? 'opacity-30 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}>Next Lesson</button>
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
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={16} /> Programming Tip</h3>
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
                    <BlockCard title="drive forward" desc="Starts continuous movement of the robot forward or backward without distance limit." img="drive_forward.svg" color="#4C97FF" />
                    <BlockCard title="drive forward distance" desc="Drives the robot for a defined distance (in cm) and then stops." img="drive_forward_distance.svg" color="#4C97FF" />
                    <BlockCard title="drive distance at speed" desc="Drives for a defined distance while setting motor power as a percentage." img="drive_forward_distance_speed.svg" color="#4C97FF" />
                    <BlockCard title="set default speed" desc="Sets the constant working speed for all subsequent movement actions." img="drive_speed.svg" color="#4C97FF" />
                    <BlockCard title="stop moving" desc="Immediately stops all robot movements." img="drive_stop.svg" color="#4C97FF" />
                    <BlockCard title="turn degree at speed" desc="Rotates the robot to a precise angle at the selected speed." img="drive_turn_dgree_speed.svg" color="#4C97FF" />
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
