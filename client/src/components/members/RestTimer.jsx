import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const DEFAULT_REST = 60; // seconds

// A rest countdown shown as a fixed bar at the bottom of the screen.
// The parent starts it imperatively via a ref: restRef.current.start(seconds).
// When it reaches 0 it plays a short beep (Web Audio, no asset needed) and
// vibrates on phones that support it. Adjust ±15s live, or dismiss with ✕.
const RestTimer = forwardRef(function RestTimer(_props, ref) {
  const { t } = useLanguage();
  const tr = t.tracker;
  const [visible, setVisible] = useState(false);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(DEFAULT_REST);
  const tickRef = useRef(null);
  const doneRef = useRef(null);
  const audioRef = useRef(null);

  const ensureAudio = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!audioRef.current && AC) audioRef.current = new AC();
      if (audioRef.current && audioRef.current.state === "suspended") audioRef.current.resume();
    } catch { /* audio not available — timer still works, just silent */ }
  };

  const beep = () => {
    const ctx = audioRef.current;
    try {
      if (ctx) {
        const now = ctx.currentTime;
        [0, 0.22, 0.44].forEach((offset) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.0001, now + offset);
          g.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
          o.start(now + offset);
          o.stop(now + offset + 0.2);
        });
      }
    } catch { /* ignore */ }
    try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
  };

  const clearTimers = () => {
    clearInterval(tickRef.current); tickRef.current = null;
    clearTimeout(doneRef.current); doneRef.current = null;
  };

  const start = (seconds = DEFAULT_REST) => {
    ensureAudio();
    clearTimers();
    setTotal(seconds);
    setRemaining(seconds);
    setRunning(true);
    setVisible(true);
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tickRef.current); tickRef.current = null;
          setRunning(false);
          beep();
          doneRef.current = setTimeout(() => setVisible(false), 4000); // auto-hide after the alarm
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const dismiss = () => { clearTimers(); setRunning(false); setVisible(false); setRemaining(0); };
  const adjust = (delta) => setRemaining((r) => Math.max(0, r + delta));

  useImperativeHandle(ref, () => ({ start }));
  useEffect(() => () => clearTimers(), []);

  if (!visible) return null;

  const finished = remaining === 0;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = total ? (remaining / total) * 100 : 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[120] px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto max-w-[680px] mx-auto bg-forest text-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-white/15">
          <div className="h-full bg-terracotta transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-[0.68rem] uppercase tracking-[0.12em] text-sage-light font-semibold shrink-0">{tr.restLabel}</span>
          {finished ? (
            <span className="text-[1.05rem] font-bold text-sage-light">⏰ {tr.restDone}</span>
          ) : (
            <span className="text-[1.6rem] font-bold tabular-nums leading-none">{mm}:{ss}</span>
          )}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {!finished && (
              <>
                <button type="button" onClick={() => adjust(-15)} className="text-[0.8rem] font-semibold bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1.5">−15</button>
                <button type="button" onClick={() => adjust(15)} className="text-[0.8rem] font-semibold bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1.5">+15</button>
              </>
            )}
            <button type="button" onClick={dismiss} aria-label={tr.videoClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 text-xl leading-none">×</button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RestTimer;
