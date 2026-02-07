import React, { useState } from 'react';
import { BookOpen, Trophy, ArrowLeft, Zap, Cpu, Hand, Palette, Eye, Compass, Info, Lightbulb, X, Activity, Target, Settings, PlusCircle } from 'lucide-react';

type HelpPage = 'MENU' | 'BLOCKS' | 'CHALLENGES' | 'STRUCTURE';

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

// Fix: Defined helper components before the main component to avoid hoisting/children property missing errors in TS
const BlockSection = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => (
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

const HelpCenter: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<HelpPage>('MENU');
    const [selectedHardware, setSelectedHardware] = useState<HardwareDetail | null>(null);

    const renderMenu = () => (
        <div className="max-w-5xl mx-auto p-8 pt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center mb-16">
                <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Robot Knowledge Center</h1>
                <p className="text-xl text-slate-500">Everything you need to master the virtual lab and build perfect code.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                    onClick={() => setCurrentPage('STRUCTURE')}
                    className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-emerald-500 text-center flex flex-col items-center gap-6"
                >
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Info size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Robot Structure</h2>
                        <p className="text-slate-500 text-sm">Learn about the physical hardware, motors, and sensors.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold group-hover:bg-emerald-500 transition-colors">Hardware Info</div>
                </button>

                <button 
                    onClick={() => setCurrentPage('BLOCKS')}
                    className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-blue-500 text-center flex flex-col items-center gap-6"
                >
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <BookOpen size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Blocks Guide</h2>
                        <p className="text-slate-500 text-sm">Discover what every programming block does, from movement to logic.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold group-hover:bg-blue-500 transition-colors">View Blocks</div>
                </button>

                <button 
                    onClick={() => setCurrentPage('CHALLENGES')}
                    className="group bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-purple-500 text-center flex flex-col items-center gap-6"
                >
                    <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        <Trophy size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Missions Help</h2>
                        <p className="text-slate-500 text-sm">Tips and tricks for completing lab missions and coding challenges.</p>
                    </div>
                    <div className="mt-auto px-6 py-2.5 bg-purple-600 text-white rounded-2xl font-bold group-hover:bg-purple-500 transition-colors">View Missions</div>
                </button>
            </div>
        </div>
    );

    const renderHardwareModal = () => {
        if (!selectedHardware) return null;
        return (
            <div className="fixed inset-0 z-[3000000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col border-4 border-emerald-500">
                    <div className={`p-8 bg-emerald-50 flex justify-between items-center border-b border-emerald-100`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 bg-white shadow-md rounded-2xl flex items-center justify-center text-emerald-500`}>
                                {selectedHardware.icon}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900">{selectedHardware.title}</h2>
                        </div>
                        <button onClick={() => setSelectedHardware(null)} className="p-3 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-90">
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>
                    
                    <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                        <div>
                            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Activity size={16} /> How it works
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-lg">{selectedHardware.howItWorks}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Settings size={16} /> Technical Specs
                                </h3>
                                <ul className="space-y-3">
                                    {selectedHardware.technicalData.map((data, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {data}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Target size={16} /> Pro Tip
                                </h3>
                                <p className="text-emerald-800 text-sm font-bold leading-relaxed">
                                    {selectedHardware.programmingTip}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <button onClick={() => setSelectedHardware(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStructure = () => (
        <div className="max-w-7xl mx-auto p-8 pt-16 animate-in fade-in duration-300 h-full overflow-y-auto pb-40">
            <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all">
                <ArrowLeft size={20} /> Back to Help Menu
            </button>
            
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-black text-slate-900 flex flex-col md:flex-row items-center justify-center gap-4">
                    <span className="bg-emerald-600 text-white p-2 rounded-2xl"><Cpu size={32} /></span>
                    Robot Hardware & Structure
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Hardware technical manual for the virtual robot. <span className="font-bold text-emerald-600 underline underline-offset-4">Click any card to expand info.</span></p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="space-y-6">
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.motors)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Drive Motors</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Independent Left and Right motors allow for differential steering. Power ranges from -100% to 100%.
                        </p>
                    </button>

                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.touch)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Hand size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Touch Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            A red physical bumper at the very front tip. Returns <b>true</b> when pressed against a wall.
                        </p>
                    </button>
                    
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.gyro)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Compass size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Gyro Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            <b>Located on the back-top part</b> (blue circle). It measures rotation angles and chassis tilt (pitch).
                        </p>
                    </button>
                </div>

                <div className="flex flex-col gap-8 py-4 items-center">
                    <div className="relative group w-full">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-0.5 rounded-full font-bold z-10">HARDWARE DIAGRAM</div>
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex items-center justify-center min-h-[350px]">
                            <img 
                                src="https://cdn.jsdelivr.net/gh/moshe1ch-kidi/labroby/help/robotsensor.svg?v=1.2" 
                                alt="Robot Sensor Diagram" 
                                className="w-full h-auto max-w-sm drop-shadow-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Robot+Diagram+Error";
                                }}
                            />
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 w-full text-center">
                        <p className="text-blue-700 text-xs font-bold">
                            Official Robot Technical Architecture
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.ultrasonic)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Eye size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Ultrasonic Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            The "eyes" on the front face. Measures distance to objects in centimeters by bouncing sound waves.
                        </p>
                    </button>

                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.color)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Palette size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Color Sensor</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Pointed downwards under the front. It identifies floor colors and surface brightness for line-following.
                        </p>
                    </button>

                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.leds)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Lightbulb size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Status LEDs</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Two programmable LED lights on the top deck. Can be used for signaling or debugging logic states.
                        </p>
                    </button>

                    <button onClick={() => setSelectedHardware(HARDWARE_DETAILS.brain)} className="w-full text-left bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Cpu size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Central Brain</h2>
                            </div>
                            <PlusCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-slate-600 text-[10px] leading-relaxed">
                            The core processor that integrates all sensor data and executes your Blockly programs in real-time.
                        </p>
                    </button>
                </div>
            </div>
            {renderHardwareModal()}
        </div>
    );

    const renderBlocks = () => (
        <div className="max-w-6xl mx-auto p-8 pt-16 animate-in fade-in duration-300">
            <button onClick={() => setCurrentPage('MENU')} className="flex items-center gap-2 text-blue-600 font-bold mb-8 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                <ArrowLeft size={20} /> Back to Help Menu
            </button>
            
            <header className="mb-12 text-center md:text-left">
                <h1 className="text-4xl font-black text-slate-900 flex flex-col md:flex-row items-center gap-4">
                    <span className="bg-blue-600 text-white p-2 rounded-2xl"><BookOpen size={32} /></span>
                    Blocks Knowledge Base
                </h1>
                <p className="text-slate-500 mt-2">Comprehensive documentation for all programming blocks available in the lab.</p>
            </header>

            <div className="space-y-16 pb-32">
                <BlockSection title="Movement Blocks (Drive)" color="#4C97FF">
                    <BlockCard title="drive forward" desc="Starts moving the robot forward continuously without a distance limit." img="drive_forward.svg" color="#4C97FF" />
                    <BlockCard title="drive forward distance" desc="Moves the robot forward for a specific distance (in cm) and then stops." img="drive_forward_distance.svg" color="#4C97FF" />
                    <BlockCard title="drive distance at speed" desc="Moves for a defined distance while setting the motor power as a percentage." img="drive_forward_distance_speed.svg" color="#4C97FF" />
                    <BlockCard title="drive until at speed" desc="Moves at a defined speed until an external condition (sensor) is met." img="drive_until_speed.svg" color="#4C97FF" />
                    <BlockCard title="turn degree at speed" desc="Turns the robot to a precise angle at the selected speed." img="drive_turn_dgree_speed.svg" color="#4C97FF" />
                    <BlockCard title="turn until at speed" desc="Turns at a set speed until a condition is met (e.g., until a line is detected)." img="drive_turn_until_speed.svg" color="#4C97FF" />
                    <BlockCard title="set motor power" desc="Sets separate power levels for each motor (Left/Right) for full manual control." img="drive_setmotor.svg" color="#4C97FF" />
                    <BlockCard title="set heading to degree" desc="Resets or sets the internal compass heading to a specific degree value." img="drive_heading_dgree.svg" color="#4C97FF" />
                    <BlockCard title="set default speed" desc="Sets the constant working speed for all subsequent movement actions." img="drive_speed.svg" color="#4C97FF" />
                    <BlockCard title="stop moving" desc="Immediately brakes and stops all robot movements." img="drive_stop.svg" color="#4C97FF" />
                </BlockSection>

                <BlockSection title="Lighting (LEDs)" color="#9966FF">
                    <BlockCard title="set led color" desc="Sets the color of the robot's LED light based on your selection." img="led_setcolor.svg" color="#9966FF" />
                    <BlockCard title="led detected color" desc="Changes the LED color to match the color currently detected by the sensor." img="led_detectedcolor.svg" color="#9966FF" />
                    <BlockCard title="turn off led" desc="Turns off the robot's LED light." img="led_turnoff.svg" color="#9966FF" />
                </BlockSection>

                <BlockSection title="Pen and Drawing (Pen)" color="#0FBD8C">
                    <BlockCard title="pen down" desc="Lowers the pen to the track – the robot will start drawing as it moves." img="pen_down.svg" color="#0FBD8C" />
                    <BlockCard title="pen up" desc="Raises the pen – the robot will continue moving without leaving a trail." img="pen_up.svg" color="#0FBD8C" />
                    <BlockCard title="set pen color" desc="Sets the color of the line the robot draws on the surface." img="pen_setcolor.svg" color="#0FBD8C" />
                    <BlockCard title="clear all drawings" desc="Erases all the lines that have been drawn on the surface so far." img="pen_clear.svg" color="#0FBD8C" />
                </BlockSection>

                <BlockSection title="Control Blocks" color="#FFAB19">
                    <BlockCard title="forever" desc="A loop that runs the code inside it over and over again indefinitely." img="control_forever.svg" color="#FFAB19" />
                    <BlockCard title="if then" desc="Executes an action only if a specific condition is met." img="control_if.svg" color="#FFAB19" />
                    <BlockCard title="if then else" desc="Executes action A if the condition is met, and action B if it is not." img="control_ifelse.svg" color="#FFAB19" />
                    <BlockCard title="repeat until" desc="Repeats a block of code until a specific stopping condition is met." img="control_repeat_until.svg" color="#FFAB19" />
                    <BlockCard title="wait (seconds)" desc="Pauses the program for a set number of seconds before moving to the next block." img="control_wait.svg" color="#FFAB19" />
                    <BlockCard title="wait until" desc="Pauses the program execution at this point until a specific condition becomes true." img="control_waituntil.svg" color="#FFAB19" />
                    <BlockCard title="stop program" desc="Immediately ends the execution of the entire program." img="control_stopprogram.svg" color="#FFAB19" />
                </BlockSection>

                <BlockSection title="Sensors" color="#4CBFE6">
                    <BlockCard title="distance from obstacle" desc="Returns the exact distance to the nearest obstacle in centimeters." img="sensor_distance.svg" color="#4CBFE6" />
                    <BlockCard title="gyro angle" desc="Displays the current turning angle of the robot relative to its starting point." img="sensor_gyro.svg" color="#4CBFE6" />
                    <BlockCard title="touch sensor pressed?" desc="Checks if the touch sensor is currently being pressed (returns true or false)." img="sensor_touchpressed.svg" color="#4CBFE6" />
                    <BlockCard title="touching color?" desc="Checks if the sensor is over a specific color selected on the surface." img="sensor_touchingcolor.svg" color="#4CBFE6" />
                    <BlockCard title="wheel circumference" desc="Technical data used for precise movement calculations based on wheel size." img="sensor_wheel.svg" color="#4CBFE6" />
                </BlockSection>

                <BlockSection title="Logic and Math" color="#59C059">
                    <BlockCard title="logic and / or" desc="Allows combining multiple conditions (e.g., move if there is a black line AND no obstacle)." img="logic_and.svg" color="#59C059" />
                    <BlockCard title="comparison" desc="Compares values: greater than, less than, or equal to." img="logic_compare.svg" color="#59C059" />
                    <BlockCard title="math operators" desc="Performs arithmetic operations like addition, subtraction, multiplication, and division." img="logic_math.svg" color="#59C059" />
                    <BlockCard title="logic not" desc="Inverts the result of a condition (if it was true, it becomes false)." img="logic_not.svg" color="#59C059" />
                    <BlockCard title="integer of" desc="Rounds a decimal number to the nearest whole integer." img="logic_intrger.svg" color="#59C059" />
                    <BlockCard title="true / false" desc="Fixed logical values representing True or False." img="logic_true.svg" color="#59C059" />
                </BlockSection>
            </div>
        </div>
    );

    const renderChallenges = () => (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <Zap size={48} className="text-purple-500 fill-purple-500" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">Missions Guide</h1>
            <p className="text-xl text-slate-500 max-w-md mb-8">Master the lab challenges using these pro-level programming tips.</p>
            <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-slate-100 text-left max-w-2xl">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Mission Winning Tips:</h3>
                <ul className="space-y-3 text-slate-600 text-sm">
                    <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
                        <span>Use the <b>Ultrasonic sensor</b> to detect walls from a distance and avoid crashing.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                        <span>The <b>Color sensor</b> is perfect for detecting finish lines or identifying specific track paths.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5" />
                        <span>Use <b>Loops</b> to keep your code clean and repeat movement patterns.</span>
                    </li>
                </ul>
            </div>
            <button onClick={() => setCurrentPage('MENU')} className="mt-12 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                <ArrowLeft size={20} /> Back to Menu
            </button>
        </div>
    );

    return (
        <div className="absolute inset-0 bg-[#F8FAFC] font-sans selection:bg-blue-100 overflow-y-auto">
            {currentPage === 'MENU' && renderMenu()}
            {currentPage === 'BLOCKS' && renderBlocks()}
            {currentPage === 'CHALLENGES' && renderChallenges()}
            {currentPage === 'STRUCTURE' && renderStructure()}
        </div>
    );
};

export default HelpCenter;
