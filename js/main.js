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

// ---- 연락처 카드 flip (이메일 / 전화) ----
// 카드 자체가 mailto:/tel: 링크라 클릭하면 메일 앱·전화 앱이 열리는 것과 별개로,
// 같은 클릭에서 뒷면(실제 주소/번호)이 보이도록 3D flip 애니메이션도 함께 재생합니다.
document.querySelectorAll('.contact-card-flip').forEach((card) => {
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
  });
});

// ---- 이미지가 아직 없을 때 자동 플레이스홀더 처리 ----
// index.html의 img 태그에 onerror가 이미 걸려있어 별도 스크립트 없이도 동작합니다.
// 실제 이미지를 images/ 폴더에 넣으면 자동으로 정상 표시됩니다.

// ---- 스크롤 리빌 애니메이션 (양방향) ----
// .reveal(섹션 전체)과 .reveal-stagger(카드 그리드) 요소가 화면에 들어오면
// is-visible 클래스를 붙여 등장(fade + slide-up)시키고, 뷰포트를 벗어나면
// 클래스를 다시 떼어내 퇴장시킵니다. 아래로 스크롤하며 재진입하면 다시 등장합니다.
// 위쪽(히어로)은 로드 즉시 보여야 하므로 대상에서 제외되어 있습니다.
const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');

if (revealTargets.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}
