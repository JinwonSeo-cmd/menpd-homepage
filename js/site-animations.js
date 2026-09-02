// 전체 페이지 공통 등장 애니메이션 (스크롤 리빌 + 히어로 헤드라인 시퀀스)
// index.html / prep.html / resources.html / board.html 에서 공통으로 로드됨.
(function () {
  'use strict';

  var prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =======================================================
  // 1) 스크롤 리빌 — 카드/항목이 뷰포트에 들어오면 한 번만 fade+slide-up
  // =======================================================
  (function scrollReveal() {
    if (prefersReducedMotion) return; // CSS의 reduced-motion 규칙이 즉시 보이는 상태를 보장함
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal-stagger, .item-group, .list > .item')
        .forEach(function (el) { el.classList.add('is-visible', 'reveal'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // 한 번 나타나면 다시 사라지지 않음
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    var STAGGER_MS = 100;
    var MAX_STAGGER_STEPS = 6;

    function tagSequence(elements) {
      elements.forEach(function (el, i) {
        if (el.hasAttribute('data-reveal-tagged')) return;
        el.setAttribute('data-reveal-tagged', '1');
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS + 'ms';
        observer.observe(el);
      });
    }

    // 이미 마크업에 .reveal / .reveal-stagger 가 붙어있는 요소(index.html 섹션 등)
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
      observer.observe(el);
    });

    // prep.html — 그룹(01/02/03)별 준비물 카드(.item-group)와,
    // 아코디언이 없는 첫 스텝 목록(크롬/카카오톡)을 순서대로 스태거
    document.querySelectorAll('.group').forEach(function (group) {
      var seq = [];
      group.querySelectorAll(':scope > .steplist > .step').forEach(function (el) { seq.push(el); });
      group.querySelectorAll(':scope > .item-group').forEach(function (el) { seq.push(el); });
      if (seq.length) tagSequence(seq);
    });

    // board.html / resources.html — 게시판·자료 목록(#list 안의 .item)은
    // fetch로 비동기 렌더링되므로 MutationObserver로 재생성될 때마다 다시 태깅
    var list = document.querySelector('.list');
    if (list) {
      var tagListItems = function () {
        var items = list.querySelectorAll(':scope > .item');
        tagSequence(Array.prototype.slice.call(items));
      };
      tagListItems();
      var listObserver = new MutationObserver(tagListItems);
      listObserver.observe(list, { childList: true });
    }
  })();

  // =======================================================
  // 2) 히어로 헤드라인 등장 시퀀스 (index.html 전용)
  // =======================================================
  (function heroSequence() {
    var headline = document.querySelector('.hero-headline');
    if (!headline) return; // 히어로가 없는 페이지에서는 아무 것도 하지 않음

    if (prefersReducedMotion) return; // CSS reduced-motion 규칙이 즉시 보이는 상태를 보장함

    var lines = headline.querySelectorAll('.headline-serif, .headline-script');
    lines.forEach(function (line) {
      var words = line.textContent.split(/\s+/).filter(Boolean);
      line.innerHTML = words
        .map(function (w) { return '<span class="word-reveal">' + w + '</span>'; })
        .join(' ');
    });
    headline.classList.add('js-ready');

    var wordEls = headline.querySelectorAll('.word-reveal');
    var WORD_STAGGER = 130;
    wordEls.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('is-visible'); }, i * WORD_STAGGER + 80);
    });

    var afterHeadline = wordEls.length * WORD_STAGGER + 300;
    var followUps = [
      document.querySelector('.hero-bio'),
      document.querySelector('.hero-emphasis'),
      document.querySelector('.hero-cta-group')
    ];
    followUps.forEach(function (el, i) {
      if (!el) return;
      setTimeout(function () { el.classList.add('is-visible'); }, afterHeadline + i * 150);
    });
  })();
})();
