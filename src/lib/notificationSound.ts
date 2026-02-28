/**
 * Play a short sine-wave "plink" via Web Audio API (880 Hz, 0.1 s, low gain).
 * No audio file; works without user gesture after context is resumed.
 */
export function playNotificationPlink(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}
