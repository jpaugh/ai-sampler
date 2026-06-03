import { useRef, useEffect, useState } from 'react';
import { unlocks } from '../game/progression';

export default function CheatUI() {
  type ProgressionType = {
    unlockedUnlocks?: string[];
    [key: string]: unknown;
  };
  const [progression, setProgression] = useState<ProgressionType | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    iframeRef.current = document.querySelector('iframe') as HTMLIFrameElement | null;
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'cheat-request-progression' }, '*');
    }

    const handler = (event: MessageEvent) => {
      if (
        iframe &&
        event.source === iframe.contentWindow &&
        event.data &&
        event.data.type === 'progression-update'
      ) {
        setProgression(event.data.progression);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleUnlock = () => {
    const iframe = iframeRef.current;
    if (!progression || !iframe || !iframe.contentWindow) return;
    const unlocked = (progression && progression.unlockedUnlocks) ? progression.unlockedUnlocks : [];
    const nextUnlockMeta = unlocks.find(u => !unlocked.includes(u.unlock));
    if (nextUnlockMeta) {
      const newProgression = {
        ...(progression as object),
        unlockedUnlocks: [...unlocked, nextUnlockMeta.unlock]
      };
      iframe.contentWindow.postMessage({ type: 'cheat-set-progression', progression: newProgression }, '*');
    }
  };

  if (!progression) {
    return <div className="border-2 border-dashed border-slate-500 p-4 mt-4">Waiting for game state...</div>;
  }

  const unlocked = progression.unlockedUnlocks || [];
  const nextUnlockMeta = unlocks.find(u => !unlocked.includes(u.unlock));

  return (
    <div className="border-2 border-dashed border-slate-500 p-4 mt-4">
      <h3>Cheat UI (Development Only)</h3>
      {nextUnlockMeta ? (
        <button
          className="mt-2 px-3 py-1 text-sm font-medium bg-slate-200 text-slate-700 border border-slate-300 rounded hover:bg-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
          onClick={handleUnlock}
        >
          <span className="inline-block align-middle mr-1">🔓</span>
          Unlock next: <span className="font-semibold text-slate-800">{nextUnlockMeta.unlock}</span> <span className="text-xs text-slate-400">({nextUnlockMeta.playerTitle})</span>
        </button>
      ) : (
        <span>All unlocks granted!</span>
      )}
    </div>
  );
}
