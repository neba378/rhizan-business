import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Lock, Delete, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const unlockWithPin = useAuthStore((s) => s.unlockWithPin);
  const navigate = useNavigate();

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4 || isSuccess) return;

      const newPin = pin + digit;
      setPin(newPin);
      setIsError(false);

      if (newPin.length === 4) {
        // Automatically verify on 4th digit
        setTimeout(() => {
          const success = unlockWithPin(newPin);
          if (success) {
            setIsSuccess(true);
            toast.success('Workspace Unlocked');
            setTimeout(() => {
              navigate('/');
            }, 300);
          } else {
            setIsError(true);
            toast.error('Incorrect PIN. Try again.');
            setTimeout(() => {
              setPin('');
              setIsError(false);
            }, 600);
          }
        }, 100);
      }
    },
    [pin, isSuccess, unlockWithPin, navigate]
  );

  const handleDelete = useCallback(() => {
    if (pin.length > 0 && !isSuccess) {
      setPin((prev) => prev.slice(0, -1));
      setIsError(false);
    }
  }, [pin, isSuccess]);

  const handleClear = useCallback(() => {
    setPin('');
    setIsError(false);
  }, []);

  // Keyboard listener for desktop/hardware keyboards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'];

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-between bg-surface-bg px-4 py-8 sm:justify-center sm:gap-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-2 pt-4 sm:pt-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-white font-bold text-2xl shadow-lg shadow-brand-primary/20">
          R
        </div>
        <h1 className="text-xl font-bold tracking-tight text-content-primary">
          RHIZAN Technologies
        </h1>
        <p className="text-xs text-content-secondary max-w-xs">
          Enter 4-digit security PIN to unlock workspace
        </p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="flex flex-col items-center space-y-6 my-auto sm:my-0">
        <div
          className={`flex items-center gap-4 transition-transform ${
            isError ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full transition-all duration-200 ${
                  isSuccess
                    ? 'bg-state-success scale-110 shadow-md shadow-state-success/30'
                    : isError
                    ? 'bg-state-danger scale-95 shadow-md shadow-state-danger/30'
                    : isFilled
                    ? 'bg-brand-primary scale-110 shadow-sm shadow-brand-primary/20'
                    : 'border-2 border-border bg-white'
                }`}
              >
                {isSuccess && <Check className="h-3 w-3 text-white" />}
              </div>
            );
          })}
        </div>

        {isError && (
          <p className="text-xs font-semibold text-state-danger animate-fade-in">
            Incorrect PIN. Try again.
          </p>
        )}
      </div>

      {/* Mobile-Friendly Number Keypad */}
      <div className="w-full max-w-[280px] sm:max-w-[300px] space-y-4 pb-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {keys.map((k) => {
            if (k === 'C') {
              return (
                <button
                  key={k}
                  onClick={handleClear}
                  type="button"
                  className="flex h-14 w-14 sm:h-16 sm:w-16 mx-auto items-center justify-center rounded-full text-xs font-semibold text-content-secondary hover:bg-surface-hover active:bg-gray-200 transition-colors select-none"
                >
                  Clear
                </button>
              );
            }

            if (k === 'DEL') {
              return (
                <button
                  key={k}
                  onClick={handleDelete}
                  type="button"
                  aria-label="Delete last digit"
                  className="flex h-14 w-14 sm:h-16 sm:w-16 mx-auto items-center justify-center rounded-full text-content-secondary hover:bg-surface-hover active:bg-gray-200 transition-colors select-none"
                >
                  <Delete className="h-5 w-5" />
                </button>
              );
            }

            return (
              <button
                key={k}
                onClick={() => handleDigit(k)}
                type="button"
                className="flex h-14 w-14 sm:h-16 sm:w-16 mx-auto items-center justify-center rounded-full border border-border bg-white text-xl font-bold text-content-primary shadow-sm hover:bg-surface-hover active:scale-95 active:bg-brand-primary/10 active:border-brand-primary/40 transition-all select-none"
              >
                {k}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-content-tertiary">
          <ShieldCheck className="h-3.5 w-3.5 text-state-success" />
          <span>Local Device Security Active</span>
        </div>
      </div>
    </div>
  );
}
