
import React from 'react';
import { Wifi, HandMetal, Compass, Palette } from 'lucide-react';

interface SensorDashboardProps {
  distance: number;
  isTouching: boolean;
  gyroAngle: number;
  tiltAngle?: number;
  detectedColor: string;
  lightIntensity?: number;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({ 
  distance, 
  isTouching, 
  gyroAngle, 
  tiltAngle = 0,
  detectedColor,
  lightIntensity = 100
}) => {
  
  // Helper to get color code for display
  const getDisplayColor = (colorInput: string) => {
    if (!colorInput) return '#e5e7eb';
    if (colorInput.startsWith('#')) return colorInput;

    const normalized = colorInput.toLowerCase();
    switch(normalized) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'green': return '#22c55e';
      case 'yellow': return '#facc15';
      case 'magenta': return '#d946ef';
      case 'black': return '#1f2937';
      case 'white': return '#ffffff';
      default: return '#e5e7eb';
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-around z-10">
      
      {/* Ultrasonic / Distance */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Wifi size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Distance</span>
        </div>
        <div className="text-2xl font-mono font-bold text-slate-800">
            {distance < 255 ? distance : '> 255'} <span className="text-sm text-slate-400">cm</span>
        </div>
      </div>

      <div className="w-px h-10 bg-slate-300"></div>

      {/* Gyro (Angle and Tilt) */}
      <div className="flex flex-col items-center gap-1 min-w-[100px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Compass size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Gyro</span>
        </div>
        <div className="flex flex-col items-center leading-none">
            <div className="text-xl font-mono font-bold text-slate-800" title="Angle (0-360°)">
                <span className="text-[10px] text-slate-400 mr-1">Angle:</span>{gyroAngle}°
            </div>
            <div className={`text-sm font-mono font-bold ${Math.abs(tiltAngle) > 0.5 ? 'text-blue-600' : 'text-slate-500'}`} title="Tilt (Pitch)">
                <span className="text-[10px] text-slate-400 mr-1">Tilt:</span>{tiltAngle.toFixed(1)}°
            </div>
        </div>
      </div>

      <div className="w-px h-10 bg-slate-300"></div>

      {/* Touch Sensor */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            <HandMetal size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Touch</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
            isTouching 
                ? 'bg-red-100 text-red-600 border-red-200' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
        }`}>
            {isTouching ? 'PRESSED' : 'RELEASED'}
        </div>
      </div>

      <div className="w-px h-10 bg-slate-300"></div>

      {/* Color Sensor */}
      <div className="flex flex-col items-center gap-1 min-w-[140px] p-1 rounded-lg">
        <div className="flex items-center gap-2 mb-1 text-slate-500">
            <Palette size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Detected Color</span>
        </div>
        
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
                <div 
                    className="w-6 h-6 rounded-full border border-slate-300 shadow-sm transition-colors duration-200"
                    style={{ backgroundColor: getDisplayColor(detectedColor) }}
                />
                <span className="font-mono font-bold text-slate-700 text-sm">
                    {detectedColor.toUpperCase()}
                </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
                Intensity: {lightIntensity}%
            </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDashboard;
