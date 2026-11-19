import confetti from "canvas-confetti";

function hapticCelebrate() {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate([12, 36, 12]);
  } catch {
    /* ignore */
  }
}

export function celebrateConfirmedSale() {
  if (typeof window === "undefined") return;

  hapticCelebrate();

  const end = Date.now() + 700;
  const colors = ["#3b82f6", "#22c55e", "#fafafa"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      disableForReducedMotion: true,
      zIndex: 9999,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      disableForReducedMotion: true,
      zIndex: 9999,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
