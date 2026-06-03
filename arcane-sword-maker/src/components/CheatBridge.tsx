import { useAppSelector, useAppDispatch } from '../store/store';
import { useEffect, useRef } from 'react';

export default function CheatBridge() {
  const dispatch = useAppDispatch();
  const progression = useAppSelector(state => state.game.progression);
  const lastProgression = useRef(progression);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === "cheat-set-progression") {
        dispatch({ type: 'game/setProgression', payload: event.data.progression });
      }
      if (event.data && event.data.type === "cheat-request-progression") {
        window.parent.postMessage({ type: "progression-update", progression }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [dispatch, progression]);

  useEffect(() => {
    if (lastProgression.current !== progression) {
      window.parent.postMessage({ type: "progression-update", progression }, "*");
      lastProgression.current = progression;
    }
  }, [progression]);

  return null;
}
