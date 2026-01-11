
import React, { useState, useEffect, useMemo } from 'react';
import { Delete, Check, X } from 'lucide-react';
import { NumpadPosition } from '../types';

interface NumpadProps {
  isOpen: boolean;
  initialValue: string | number;
  position?: NumpadPosition;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

const Numpad: React.FC<NumpadProps> = ({ isOpen, initialValue, position, onClose, onConfirm }) => {
  const [display, setDisplay] = useState('0');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplay(String(initialValue));
      setHasStartedTyping(false);
    }
  }, [isOpen, initialValue]);

  // Calculate dynamic position to keep it near the field but within window bounds
  const floatingStyle = useMemo(() => {
    if (!position) return {};
    
    const width = 180; // Compact width
    const height = 240; // Compact height
    
    let top = position.y + position.height + 8;
    let left = position.x;

    // Check bottom boundary
    if (top + height > window.innerHeight) {
        top = position.y - height - 8;
    }
    
    // Check right boundary
    if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 16;
    }

    return {
        top: Math.max(8, top),
        left: Math.max(8, left),
        width: `${width}px`
    };
  }, [position]);

  if (!isOpen) return null;

  const handleNumber = (num: string) => {
    if (!hasStartedTyping) {
      if (num === '.') {
        setDisplay('0.');
      } else {
        setDisplay(num);
      }
      setHasStartedTyping(true);
    } else {
      if (display === '0' && num !== '.') {
        setDisplay(num);
      } else {
        if (num === '.' && display.includes('.')) return;
        setDisplay(display + num);
      }
    }
  };

  const handleBackspace = () => {
    setHasStartedTyping(true);
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    setHasStartedTyping(true);
    if (display.startsWith('-')) {
      setDisplay(display.substring(1));
    } else {
      if (display !== '0' && display !== '') {
        setDisplay('-' + display);
      } else if (display === '0') {
        setDisplay('-');
      }
    }
  };

  const handleConfirm = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      onConfirm(val);
    } else if (display === '-') {
      onConfirm(0);
    }
    onClose();
  };

  const scratchColors = {
    blue: '#4C97FF',
    green: '#59C059',
    orange: '#FFAB19',
    red: '#FF6680',
    text: '#575E75',
    bg: '#FFFFFF'
  };

  return (
    <div 
        className="fixed inset-0 z-[300000] pointer-events-none"
        onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
    >
      <div 
        className="absolute pointer-events-auto bg-white p-3 rounded-2xl shadow-2xl border-4 animate-in zoom-in duration-100 ease-out flex flex-col gap-2" 
        style={{ 
            ...floatingStyle,
            borderColor: scratchColors.blue,
            zIndex: 300001
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Compact Display */}
        <div className="bg-slate-50 p-2 rounded-xl text-right border-2 border-slate-100 shadow-inner">
          <span 
            className="text-xl font-bold tracking-tight block h-7 overflow-hidden text-ellipsis" 
            style={{ color: scratchColors.text, fontFamily: '"Rubik", sans-serif' }}
          >
            {display}
          </span>
        </div>

        {/* Small Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(String(num))}
              className="text-lg font-bold py-2 rounded-lg bg-slate-100 text-slate-600 shadow-sm active:shadow-none active:translate-y-[1px] transition-all hover:bg-slate-200"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={() => handleNumber('.')}
            className="text-lg font-bold py-2 rounded-lg bg-slate-100 text-slate-600 shadow-sm transition-all hover:bg-slate-200"
          >
            .
          </button>
          
          <button
            onClick={() => handleNumber('0')}
            className="text-lg font-bold py-2 rounded-lg bg-slate-100 text-slate-600 shadow-sm transition-all hover:bg-slate-200"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="flex items-center justify-center py-2 rounded-lg text-white shadow-sm active:shadow-none active:translate-y-[1px] transition-all hover:opacity-90"
            style={{ backgroundColor: scratchColors.orange }}
          >
            <Delete size={18} />
          </button>
        </div>

        {/* Small Action Row */}
        <div className="grid grid-cols-3 gap-1.5 mt-1">
            <button
                onClick={handleToggleSign}
                className="text-xl font-bold py-2 rounded-lg flex items-center justify-center text-white shadow-sm active:shadow-none active:translate-y-[1px] transition-all hover:opacity-90"
                style={{ backgroundColor: scratchColors.blue }}
            >
                -
            </button>
            <button
                onClick={onClose}
                className="py-2 rounded-lg flex items-center justify-center text-white shadow-sm active:shadow-none active:translate-y-[1px] transition-all hover:opacity-90"
                style={{ backgroundColor: scratchColors.red }}
            >
                <X size={18} />
            </button>
            <button
                onClick={handleConfirm}
                className="py-2 rounded-lg flex items-center justify-center text-white shadow-sm active:shadow-none active:translate-y-[1px] transition-all hover:opacity-90"
                style={{ backgroundColor: scratchColors.green }}
            >
                <Check size={22} strokeWidth={3} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Numpad;
