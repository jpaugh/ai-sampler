/**
 * Audio Theme System
 * 
 * Manages loading and caching of themed audio files.
 * Each theme consists of 4 sound effects:
 * - move-weapon: Plays when weapon moves between areas
 * - atmosphere: Background ambient loop
 * - progression: Plays when longest name record is beaten
 * - enchant: Plays when enchanting a weapon
 */

export type SoundName = 'move-weapon' | 'atmosphere' | 'progression' | 'enchant';

export interface AudioTheme {
  name: string;
  sounds: Record<SoundName, string>;
}

export function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}${path.replace(/^\/+/, '')}`;
}

const themes: Record<string, AudioTheme> = {
  unlicensed: {
    name: 'unlicensed',
    sounds: {
      'move-weapon': publicAssetUrl('assets/audio-theme/unlicensed/move-weapon.mp3'),
      'atmosphere': publicAssetUrl('assets/audio-theme/unlicensed/atmosphere.mp3'),
      'progression': publicAssetUrl('assets/audio-theme/unlicensed/progression.mp3'),
      'enchant': publicAssetUrl('assets/audio-theme/unlicensed/enchant.mp3'),
    },
  },
};

class AudioThemeManager {
  private currentTheme: string = 'unlicensed';
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  /**
   * Load or retrieve cached audio element for a sound
   */
  getSound(soundName: SoundName): HTMLAudioElement {
    const theme = themes[this.currentTheme];
    if (!theme) {
      throw new Error(`Audio theme '${this.currentTheme}' not found`);
    }

    const soundPath = theme.sounds[soundName];
    const cacheKey = `${this.currentTheme}:${soundName}`;

    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const audio = new Audio(soundPath);
    audio.preload = 'auto';
    this.audioCache.set(cacheKey, audio);

    return audio;
  }

  /**
   * Change the active audio theme (clears cache)
   */
  setTheme(themeName: string): void {
    if (!themes[themeName]) {
      throw new Error(`Audio theme '${themeName}' not found`);
    }

    this.currentTheme = themeName;
    this.audioCache.clear();
  }

  /**
   * Get the current theme name
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Preload all sounds for the current theme
   */
  preloadTheme(): void {
    const theme = themes[this.currentTheme];
    if (!theme) return;

    Object.keys(theme.sounds).forEach((soundName) => {
      this.getSound(soundName as SoundName);
    });
  }
}

export const audioThemeManager = new AudioThemeManager();
