// =========================================================
// 멘피디(서진원) 개인 홈페이지 — 기본 인터랙션
// =========================================================

// ---- 모바일 네비게이션 토글 ----
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('open');
  });

  siteNav.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => siteNav.classList.remove('open'));
  });
}

// ---- 자료실: 참가자 전용 코드 게이트 ----
// 강의 참가자 전체가 공유하는 단일 코드 방식입니다.
// 이 코드는 페이지 소스에 그대로 노출되므로 "진짜 보안"이 아니라
// 검색엔진·외부인 유입을 막는 정도의 가벼운 잠금장치로만 사용하세요.
// 코드를 바꾸려면 아래 RESTRICTED_ACCESS_CODE 값만 수정하면 됩니다.
const RESTRICTED_ACCESS_CODE = '여기에_참가자코드_입력';

const gateForm = document.getElementById('gateForm');
const gateInput = document.getElementById('gateInput');
const gateMessage = document.getElementById('gateMessage');
const restrictedBlock = document.getElementById('restrictedBlock');
const restrictedList = document.getElementById('restrictedList');

if (gateForm) {
  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = gateInput.value.trim();

    if (value.length === 0) {
      gateMessage.textContent = '코드를 입력해주세요.';
      gateMessage.className = 'gate-message error';
      return;
    }

    if (value === RESTRICTED_ACCESS_CODE) {
      gateMessage.textContent = '';
      restrictedBlock.classList.add('gate-unlocked');
      restrictedList.hidden = false;
    } else {
      gateMessage.textContent = '코드가 올바르지 않습니다. 강의 중 안내받은 코드를 다시 확인해주세요.';
      gateMessage.className = 'gate-message error';
    }
  });
}

// ---- 이미지가 아직 없을 때 자동 플레이스홀더 처리 ----
// index.html의 img 태그에 onerror가 이미 걸려있어 별도 스크립트 없이도 동작합니다.
// 실제 이미지를 images/ 폴더에 넣으면 자동으로 정상 표시됩니다.

// ---- 스크롤 리빌 애니메이션 ----
// .reveal(섹션 전체)과 .reveal-stagger(카드 그리드) 요소가 화면에 들어오면
// is-visible 클래스를 붙여 CSS 트랜지션(아래에서 살짝 올라오며 페이드인)을 트리거합니다.
// 위쪽(히어로)은 로드 즉시 보여야 하므로 대상에서 제외되어 있습니다.
const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');

if (revealTargets.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}
