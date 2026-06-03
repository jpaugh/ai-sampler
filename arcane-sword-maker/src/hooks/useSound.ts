/**
 * useSound Hook
 * 
 * Custom React hook for playing themed sound effects.
 * Automatically respects mute state and handles cleanup.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { audioThemeManager, type SoundName } from '../utils/audioTheme';
import { useAppSelector } from '../store/store';

type AudioChannel = 'sfx' | 'ambience';

export interface UseSoundOptions {
  volume?: number;
  loop?: boolean;
  onEnded?: () => void;
  channel?: AudioChannel;
}

export interface SoundControls {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
}

/**
 * Hook for playing themed sound effects
 * 
 * @param soundName - Name of the sound to play
 * @param options - Playback options (volume, loop, onEnded callback)
 * @returns Sound controls (play, stop, isPlaying)
 */
export function useSound(
  soundName: SoundName,
  options: UseSoundOptions = {}
): SoundControls {
  const { volume = 1.0, loop = false, onEnded, channel = 'sfx' } = options;
  const isSfxMuted = useAppSelector((state) => state.settings.isSfxMuted);
  const isAmbienceMuted = useAppSelector((state) => state.settings.isAmbienceMuted);
  const isAmbienceAutoMuted = useAppSelector((state) => state.settings.isAmbienceAutoMuted);
  const isChannelMuted =
    channel === 'ambience' ? isAmbienceMuted || isAmbienceAutoMuted : isSfxMuted;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const audio = audioThemeManager.getSound(soundName);
    audioRef.current = audio;

    audio.volume = volume;
    audio.loop = loop;

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [soundName, volume, loop]);

  useEffect(() => {
    if (audioRef.current && isChannelMuted && isPlaying) {
      audioRef.current.pause();
    }
  }, [isChannelMuted, isPlaying]);

  const play = useCallback(() => {
    if (!audioRef.current || isChannelMuted) return;

    if (!loop) {
      audioRef.current.currentTime = 0;
    }

    audioRef.current.play().catch((error) => {
      console.warn(`Failed to play sound '${soundName}':`, error);
    });
  }, [isChannelMuted, loop, soundName]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    if (channel !== 'ambience') {
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [channel]);

  return { play, stop, isPlaying };
}
