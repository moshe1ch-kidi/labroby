 import React, { useState, useEffect, useRef } from 'react';
import { Delete, Check, X } from 'lucide-react';

interface NumpadProps {
  isOpen: boolean;
  initialValue: string | number;
  onClose: () => void;
  onConfirm: (value: number) => void;
  position: DOMRect | null;
}

const Numpad: React.FC<NumpadProps> = ({ isOpen, initialValue, onClose, onConfirm, position }) => {
  const [display, setDisplay] = useState('0');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [style, setStyle] = useState({});
  const padRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplay(String(initialValue));
      setHasStartedTyping(false);
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (isOpen && position && padRef.current) {
      const padRect = padRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      
      let top = position.bottom + 8; // Default below
      if (top + padRect.height > screenHeight - 10) {
        top = position.top - padRect.height - 8; // Place above if not enough space below
      }

      let left = position.left + position.width / 2 - padRect.width / 2;
      left = Math.max(10, Math.min(left, window.innerWidth - padRect.width - 10));

      setStyle({ top: `${top}px`, left: `${left}px` });
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleNumber = (num: string) => {
    if (!hasStartedTyping) {
      if (num === '.') setDisplay('0.');
      else setDisplay(num);
      setHasStartedTyping(true);
    } else {
      if (display === '0' && num !== '.') setDisplay(num);
      else {
        if (num === '.' && display.includes('.')) return;
        setDisplay(display + num);
      }
    }
  };

  const handleBackspace = () => {
    setHasStartedTyping(true);
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
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
  
  const handleWrapperClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  };

  const scratchColors = {
    blue: '#4C97FF', green: '#59C059', orange: '#FFAB19', red: '#FF6680', text: '#575E75', buttonBg: '#F0F3F8'
  };

  return (
    <div className="fixed inset-0 z-[300000]" onPointerDown={handleWrapperClick}>
      <div 
        ref={padRef}
        className="absolute bg-white p-3 rounded-[12px] shadow-2xl w-[280px] border-2 animate-in zoom-in-95 duration-100" 
        style={{ ...style, borderColor: scratchColors.blue }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-100 p-3 rounded-[8px] mb-3 text-right border border-slate-200 shadow-inner">
          <span className="text-3xl font-bold tracking-wider block h-9 overflow-hidden" style={{ color: scratchColors.text }}>
            {display}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['7', '8', '9'].map(n => <button key={n} onClick={() => handleNumber(n)} className="text-xl font-bold py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all hover:bg-slate-200" style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>{n}</button>)}
          <button onClick={handleBackspace} className="flex items-center justify-center py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all text-white hover:opacity-90" style={{ backgroundColor: scratchColors.orange }}><Delete size={24} /></button>
          
          {['4', '5', '6'].map(n => <button key={n} onClick={() => handleNumber(n)} className="text-xl font-bold py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all hover:bg-slate-200" style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>{n}</button>)}
          <button onClick={onClose} className="py-3 row-span-2 rounded-[10px] flex items-center justify-center shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all text-white hover:opacity-90" style={{ backgroundColor: scratchColors.red }}><X size={28} /></button>
          
          {['1', '2', '3'].map(n => <button key={n} onClick={() => handleNumber(n)} className="text-xl font-bold py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all hover:bg-slate-200" style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>{n}</button>)}

          <button onClick={handleToggleSign} className="text-2xl font-bold py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all hover:bg-slate-200" style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>-</button>
          <button onClick={() => handleNumber('0')} className="text-xl font-bold py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all hover:bg-slate-200" style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>0</button>
          <button onClick={() => handleNumber('.')} className="text-2xl font-bold py-3 rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all hover:bg-slate-200" style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>.</button>
          <button onClick={handleConfirm} className="py-3 rounded-[10px] col-span-full flex items-center justify-center shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all text-white hover:opacity-90" style={{ backgroundColor: scratchColors.green }}><Check size={28} strokeWidth={3} /></button>
        </div>
      </div>
    </div>
  );
};

export default Numpad;
