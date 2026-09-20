/* Decorative CSS 3D scene and delegated card interactions. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const selector = '.quicklink-card,.contact-card,.dynamic-book-card,.portfolio-video-card,.video-card,.review-card,.item-group,.list > .item,.steplist > .step';
  const decorate = root => {
    root.querySelectorAll(selector).forEach(el => {
      if (!el.closest('.item-group') || el.classList.contains('item-group')) el.classList.add('depth-card');
    });
  };
  decorate(document);
  const list = document.querySelector('.list');
  if (list) new MutationObserver(() => decorate(list)).observe(list, {childList:true});
  const hero = document.querySelector('.hero');
  if (hero) {
    const scene = document.createElement('div');
    scene.className = 'depth-scene';
    scene.setAttribute('aria-hidden','true');
    scene.innerHTML = '<div class="depth-orbit"><i class="depth-ring"></i><i class="depth-ring"></i><i class="depth-ring"></i></div><div class="depth-sphere"></div>';
    hero.prepend(scene);
  }
  let active = null, frame = 0, x = 0, y = 0;
  const reset = () => {
    if (active) {
      active.style.removeProperty('--tilt-x');
      active.style.removeProperty('--tilt-y');
    }
    active = null;
  };
  document.addEventListener('pointermove', event => {
    if (motion.matches || !fine.matches) return;
    const card = event.target.closest('.depth-card');
    if (card !== active) { reset(); active = card; }
    if (!active) return;
    x = event.clientX; y = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!active) return;
      const r = active.getBoundingClientRect();
      const tilt = Math.max(-5,Math.min(5,((x-r.left)/r.width-.5)*6-((y-r.top)/r.height-.5)*4));
      active.style.setProperty('--tilt-y',tilt+'deg');
    });
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave',reset);
  window.addEventListener('blur',reset);
  motion.addEventListener('change',reset);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('motion-paused',document.hidden);
    if (document.hidden) reset();
  });
})();