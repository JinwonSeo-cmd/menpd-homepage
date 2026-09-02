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

// ---- 스크롤 리빌 / 히어로 등장 애니메이션 ----
// js/site-animations.js (전체 페이지 공통 스크립트)에서 처리합니다.
