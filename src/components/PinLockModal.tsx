import React, { useState } from 'react';
import { Lock, Delete, X, ShieldCheck, KeyRound } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  isSettingUp: boolean;
  savedPin: string | null;
  onUnlockSuccess: () => void;
  onSetPinSuccess: (pin: string | null) => void;
  onClose?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  isSettingUp,
  savedPin,
  onUnlockSuccess,
  onSetPinSuccess,
  onClose,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmPin, setConfirmPin] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + num;
    setEnteredPin(newPin);
    setErrorMsg(null);

    if (newPin.length === 4) {
      if (isSettingUp) {
        if (!confirmPin) {
          // First step of setup
          setConfirmPin(newPin);
          setEnteredPin('');
        } else {
          // Confirm step
          if (confirmPin === newPin) {
            onSetPinSuccess(newPin);
            setEnteredPin('');
            setConfirmPin(null);
          } else {
            setErrorMsg('PINs did not match. Please try again.');
            setConfirmPin(null);
            setEnteredPin('');
          }
        }
      } else {
        // Unlock verification
        if (savedPin && newPin === savedPin) {
          onUnlockSuccess();
          setEnteredPin('');
        } else {
          setErrorMsg('Incorrect PIN. Please try again.');
          setEnteredPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl flex flex-col items-center">
        {onClose && (
          <button
            onClick={onClose}
            className="self-end -mt-2 -mr-2 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 mt-1">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {isSettingUp
            ? confirmPin
              ? 'Confirm Security PIN'
              : 'Set 4-Digit Security PIN'
            : 'Enter Security PIN'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {isSettingUp
            ? confirmPin
              ? 'Re-enter your 4-digit PIN to confirm'
              : 'Protect your local ledger with an offline PIN'
            : 'Easy Money Ledger is locked'}
        </p>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => {
            const filled = i < enteredPin.length;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  filled ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50' : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 font-medium mb-4 animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((val, idx) => {
            if (val === '') {
              return <div key={idx} />;
            }
            if (val === 'DEL') {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={handleDelete}
                  className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center transition active:scale-95 border border-slate-700/50"
                >
                  <Delete className="w-5 h-5" />
                </button>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleKeyPress(val)}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xl flex items-center justify-center transition active:scale-95 border border-slate-700/50"
              >
                {val}
              </button>
            );
          })}
        </div>

        {/* Option to Disable PIN if currently set up and editing */}
        {isSettingUp && savedPin && (
          <button
            type="button"
            onClick={() => onSetPinSuccess(null)}
            className="text-xs text-rose-400 hover:underline mt-2 font-medium"
          >
            Disable PIN Lock
          </button>
        )}
      </div>
    </div>
  );
};
