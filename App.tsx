import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Delete, Check, X } from 'lucide-react';

// Define a plain object type for position to avoid passing live DOMRect objects as props
type PlainDOMRect = { top: number, bottom: number, left: number, right: number, width: number, height: number };

interface NumpadProps {
  isOpen: boolean;
  initialValue: string | number;
  onClose: () => void;
  onConfirm: (value: number) => void;
  position: PlainDOMRect | null;
}

const Numpad: React.FC<NumpadProps> = ({ isOpen, initialValue, onClose, onConfirm, position }) => {
  const [display, setDisplay] = useState('0');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  // Start with visibility: 'hidden' to ensure it's in the DOM for measurement without being seen.
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const padRef = useRef<HTMLDivElement>(null);

  // Effect to update the display value when the numpad is opened
  useEffect(() => {
    if (isOpen) {
      setDisplay(String(initialValue));
      setHasStartedTyping(false);
    }
  }, [isOpen, initialValue]);

  // This effect runs after the component is rendered but before the browser paints.
  // It measures the numpad's size and calculates its correct position to avoid any flicker.
  useLayoutEffect(() => {
    if (isOpen && position && padRef.current) {
      const padRect = padRef.current.getBoundingClientRect();
      
      // A crucial guard: if for some reason the component's size is 0 (e.g., timing issue),
      // we abort positioning to prevent it from appearing at an incorrect spot or causing errors.
      if (padRect.width === 0 || padRect.height === 0) {
        return;
      }
      
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      let top = position.bottom + 8; // Default: position below the target element
      // If it doesn't fit below, position it above
      if (top + padRect.height > screenHeight - 10) {
        top = position.top - padRect.height - 8;
      }

      // Center it horizontally relative to the target element
      let left = position.left + position.width / 2 - padRect.width / 2;
      
      // Prevent it from going off-screen
      left = Math.max(10, Math.min(left, screenWidth - padRect.width - 10));
      top = Math.max(10, top);

      // Apply the calculated position and make it visible.
      setStyle({
        top: `${top}px`,
        left: `${left}px`,
        visibility: 'visible',
      });
    } else if (!isOpen) {
      // When closed, reset to hidden state for the next time it opens.
      setStyle({ visibility: 'hidden' });
    }
  }, [isOpen, position]);

  // If the numpad is not supposed to be open, render nothing.
  if (!isOpen) {
    return null;
  }

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

  const baseButtonClass = "font-bold rounded-[10px] shadow-[0_3px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center";
  const numberButtonClass = `${baseButtonClass} text-xl py-3 hover:bg-slate-200`;
  const symbolButtonClass = `${baseButtonClass} text-2xl py-3 hover:bg-slate-200`;
  const operationButtonClass = `${baseButtonClass} text-white hover:opacity-90`;

  return (
    <div className="fixed inset-0 z-[300000]" onPointerDown={handleWrapperClick}>
      <div 
        ref={padRef}
        className="absolute bg-white p-3 rounded-[12px] shadow-2xl w-[250px] border-2" 
        style={{ ...style, borderColor: scratchColors.blue }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-100 p-3 rounded-[8px] mb-3 text-right border border-slate-200 shadow-inner">
          <span className="text-3xl font-bold tracking-wider block h-9 overflow-hidden" style={{ color: scratchColors.text }}>
            {display}
          </span>
        </div>
        
        <div className="flex gap-2 mb-2">
          {/* Numbers and symbols grid */}
          <div className="grid grid-cols-3 gap-2 flex-grow">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(n => (
              <button key={n} onClick={() => handleNumber(n)} className={numberButtonClass} style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>{n}</button>
            ))}
            <button onClick={handleToggleSign} className={symbolButtonClass} style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>-</button>
            <button onClick={() => handleNumber('0')} className={numberButtonClass} style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>0</button>
            <button onClick={() => handleNumber('.')} className={symbolButtonClass} style={{ backgroundColor: scratchColors.buttonBg, color: scratchColors.text }}>.</button>
          </div>

          {/* Operations column */}
          <div className="flex flex-col gap-2" style={{width: '58px'}}>
            <button onClick={handleBackspace} className={`${operationButtonClass} h-[46px]`} style={{ backgroundColor: scratchColors.orange }}><Delete size={24} /></button>
            <button onClick={onClose} className={`${operationButtonClass} flex-grow`} style={{ backgroundColor: scratchColors.red }}><X size={28} /></button>
          </div>
        </div>
        
        {/* Confirm button */}
        <button onClick={handleConfirm} className={`${operationButtonClass} w-full py-3`} style={{ backgroundColor: scratchColors.green }}><Check size={28} strokeWidth={3} /></button>
      </div>
    </div>
  );
};

export default Numpad;
