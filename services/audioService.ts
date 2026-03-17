
const CLICK_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

class AudioService {
  private clickAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.clickAudio = new Audio(CLICK_SOUND_URL);
      this.clickAudio.volume = 0.2;
      this.clickAudio.preload = 'auto';
    }
  }

  playClick() {
    if (this.clickAudio) {
      // Reset to start if already playing
      this.clickAudio.currentTime = 0;
      this.clickAudio.play().catch(e => console.debug('Audio play failed:', e));
    }
  }
}

export const audioService = new AudioService();
