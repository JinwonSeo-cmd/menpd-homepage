(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const visual = hero?.querySelector('.hero-visual');
  if (!hero || !visual) return;

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    visual.style.removeProperty('--ai-tilt-x');
    visual.style.removeProperty('--ai-tilt-y');
  };

  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (frame) return;

    frame = requestAnimationFrame(() => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (pointerX - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (pointerY - bounds.top) / bounds.height * 2 - 1));
      visual.style.setProperty('--ai-tilt-x', `${(-y * 2).toFixed(2)}deg`);
      visual.style.setProperty('--ai-tilt-y', `${(x * 3).toFixed(2)}deg`);
    });
  }, { passive: true });

  hero.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  reducedMotion.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
})();
