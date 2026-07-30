import React, { useEffect, useRef, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { BbvaMark } from './ui/BbvaMark';

const ACCESS_KEY = 'site_access_granted';
const ENCODED_ACCESS_CODE = 'azdSOVdw';

export const AccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'locked' | 'granted'>('checking');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setStatus(window.localStorage.getItem(ACCESS_KEY) === 'true' ? 'granted' : 'locked');
  }, []);

  const verify = (value: string) => {
    if (window.btoa(value) === ENCODED_ACCESS_CODE) {
      window.localStorage.setItem(ACCESS_KEY, 'true');
      setStatus('granted');
      return;
    }
    setError(true);
    setCode(['', '', '', '', '', '']);
    window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  const updateDigit = (index: number, value: string) => {
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setError(false);
    if (next[index] && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').slice(0, 6).split('');
    const next = code.map((_, index) => pasted[index] ?? '');
    setCode(next);
    setError(false);
    if (next.every(Boolean)) verify(next.join(''));
  };

  if (status === 'checking') return <div className="min-h-screen bg-[#f7f8fa]" aria-label="Verificando acceso" />;
  if (status === 'granted') return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl shadow-slate-200/70 sm:p-10">
        <div className="mb-7 flex items-center justify-center gap-3">
          <BbvaMark className="size-12" />
          <div className="text-left">
            <p className="font-bold text-[#001391]">Analytics</p>
            <p className="text-xs text-slate-500">Estratega Life</p>
          </div>
        </div>
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0c6dff]">
          <LockKeyhole className="size-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Acceso restringido</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Ingresa el código de acceso para consultar el dashboard.</p>

        <div className="mt-7 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => { inputRefs.current[index] = element; }}
              aria-label={`Dígito ${index + 1}`}
              autoFocus={index === 0}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
              }}
              className={`size-11 rounded-xl border-2 text-center text-xl font-bold outline-none transition sm:size-13 ${
                error
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-slate-200 bg-white text-[#001391] focus:border-[#0c6dff] focus:ring-4 focus:ring-blue-100'
              }`}
            />
          ))}
        </div>
        <p className={`mt-4 min-h-5 text-sm font-medium ${error ? 'text-red-500' : 'text-transparent'}`}>
          Código incorrecto. Inténtalo nuevamente.
        </p>
        <button
          type="button"
          disabled={code.some((digit) => !digit)}
          onClick={() => verify(code.join(''))}
          className="mt-3 h-12 w-full rounded-xl bg-[#0c6dff] font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0759d6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Desbloquear dashboard
        </button>
      </section>
    </main>
  );
};
