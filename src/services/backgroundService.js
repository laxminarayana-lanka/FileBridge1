// Background execution keep-alive and alert notification service

class BackgroundAlertService {
  constructor() {
    this.wakeLock = null;
    this.audioCtx = null;
    this.silentOscillator = null;
    this.originalTitle = typeof document !== 'undefined' ? document.title : 'FileBridge';
  }

  // --- 1. SYSTEM NOTIFICATIONS ---
  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch (e) {
        console.warn('Notification permission request notice:', e);
      }
    }
    return false;
  }

  sendCompletionAlert({ role = 'sender', fileName = 'File', fileSize = 0 }) {
    // 1. Play synthesized audio chime
    this.playCompletionChime();

    // 2. Trigger vibration on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {
        // ignore
      }
    }

    // 3. System desktop / mobile push notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const isSender = role === 'sender';
        const title = isSender ? '✅ File Sent Successfully!' : '📥 File Received Successfully!';
        const body = isSender
          ? `"${fileName}" was delivered to the receiver.`
          : `"${fileName}" is ready and saved to your device.`;

        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'filebridge-transfer-completed',
          renotify: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }

    // 4. Update tab title
    if (typeof document !== 'undefined') {
      document.title = `✅ Complete! ${fileName} | Files`;
      setTimeout(() => {
        document.title = this.originalTitle;
      }, 8000);
    }
  }

  // --- 2. AUDIO SYNTHESIZER CHIME (Offline, zero asset dependency) ---
  playCompletionChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Pleasant modern chime (two-tone: 587.33 Hz [D5] -> 880 Hz [A5])
      const now = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (higher tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);

      setTimeout(() => {
        try { ctx.close(); } catch {}
      }, 1000);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  // --- 3. BACKGROUND EXECUTION KEEP-ALIVE ---
  // On mobile browsers and background tabs, Web Audio keep-alive prevents the OS from suspending the tab
  startBackgroundKeepAlive() {
    this.acquireWakeLock();

    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
          // Create silent oscillator (gain 0.0001, inaudible)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          gain.gain.value = 0.0001; // inaudible
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          this.silentOscillator = osc;
        }
      }
    } catch (e) {
      console.warn('Background audio keep-alive notice:', e);
    }
  }

  stopBackgroundKeepAlive() {
    this.releaseWakeLock();

    try {
      if (this.silentOscillator) {
        this.silentOscillator.stop();
        this.silentOscillator.disconnect();
        this.silentOscillator = null;
      }
      if (this.audioCtx) {
        this.audioCtx.close();
        this.audioCtx = null;
      }
    } catch (e) {
      // ignore
    }

    if (typeof document !== 'undefined') {
      document.title = this.originalTitle;
    }
  }

  // --- 4. SCREEN WAKE LOCK API ---
  async acquireWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('WakeLock notice:', err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  // --- 5. BACKGROUND TAB TITLE PROGRESS ---
  updateTabProgress(progress, fileName) {
    if (typeof document !== 'undefined') {
      const pct = Math.floor(progress);
      document.title = `(${pct}%) ${fileName || 'Transferring'} | FileBridge`;
    }
  }
}

export const backgroundAlertService = new BackgroundAlertService();
