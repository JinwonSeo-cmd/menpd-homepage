// 전체 페이지 공통 3D 신경망 배경 애니메이션 (Three.js)
// index.html / prep.html / resources.html / board.html 에서 공통으로 로드됨.
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  var prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  var isMobile =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 768px)').matches;

  var NODE_COUNT = isMobile ? 20 : 40;
  var CONNECT_DIST = 6.5;
  var GOLD = 0xc9a24b;
  var CREAM = 0xf5f1e8;
  var WOBBLE_AMP_MIN = 0.22;
  var WOBBLE_AMP_MAX = 0.4;
  var WOBBLE_FREQ_MIN = 0.12;
  var WOBBLE_FREQ_MAX = 0.3;
  var REPEL_RADIUS = 3.0;
  var REPEL_STRENGTH = 1.7;

  var canvas = document.createElement('canvas');
  canvas.id = 'neural-bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  // 음수 z-index: body 배경보다는 위, 사이트의 일반 콘텐츠(카드 등)보다는 아래에 그려짐
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  document.body.insertBefore(canvas, document.body.firstChild);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 12;

  var group = new THREE.Group();
  scene.add(group);

  var bounds = { x: 8, y: 5, z: 4 };
  function computeBounds() {
    var vFov = (camera.fov * Math.PI) / 180;
    var height = 2 * Math.tan(vFov / 2) * camera.position.z;
    var width = height * camera.aspect;
    var nx = (width / 2) * 0.9;
    var ny = (height / 2) * 0.9;
    // 뷰포트 크기를 아직 알 수 없는 시점(초기 레이아웃 이전 등)에는 aspect가
    // NaN/0이 될 수 있어, 그런 경우 직전 값을 유지하고 다음 resize에서 다시 계산함
    bounds = {
      x: isFinite(nx) && nx > 0 ? nx : bounds.x,
      y: isFinite(ny) && ny > 0 ? ny : bounds.y,
      z: 4
    };
  }
  computeBounds();

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  var nodes = [];
  var positions = new Float32Array(NODE_COUNT * 3);
  for (var i = 0; i < NODE_COUNT; i++) {
    var baseX = (Math.random() * 2 - 1) * bounds.x;
    var baseY = (Math.random() * 2 - 1) * bounds.y;
    var baseZ = (Math.random() * 2 - 1) * bounds.z;
    var p = {
      // 노드는 고정된 홈 위치(base) 주변에서만 아주 미세하게 흔들림 — 넓게 떠다니지 않음
      baseX: baseX,
      baseY: baseY,
      baseZ: baseZ,
      x: baseX,
      y: baseY,
      z: baseZ,
      ampX: randRange(WOBBLE_AMP_MIN, WOBBLE_AMP_MAX),
      ampY: randRange(WOBBLE_AMP_MIN, WOBBLE_AMP_MAX),
      ampZ: randRange(WOBBLE_AMP_MIN, WOBBLE_AMP_MAX) * 0.6,
      freqX: randRange(WOBBLE_FREQ_MIN, WOBBLE_FREQ_MAX),
      freqY: randRange(WOBBLE_FREQ_MIN, WOBBLE_FREQ_MAX),
      freqZ: randRange(WOBBLE_FREQ_MIN, WOBBLE_FREQ_MAX),
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2
    };
    nodes.push(p);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }

  var pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pointsMaterial = new THREE.PointsMaterial({
    color: GOLD,
    size: 0.24,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });
  var points = new THREE.Points(pointsGeometry, pointsMaterial);
  group.add(points);

  var maxSegments = NODE_COUNT * NODE_COUNT;
  var linePositions = new Float32Array(maxSegments * 2 * 3);
  var lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setDrawRange(0, 0);
  var lineMaterial = new THREE.LineBasicMaterial({
    color: CREAM,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });
  var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  group.add(lines);

  var renderX = new Float32Array(NODE_COUNT);
  var renderY = new Float32Array(NODE_COUNT);
  var mouseWorldX = 9999;
  var mouseWorldY = 9999;

  function updateGeometry() {
    var posAttr = pointsGeometry.attributes.position.array;

    // 렌더 위치 = 노드의 흔들림 위치 + 마우스 근접 시의 일시적 반발 오프셋
    for (var i = 0; i < NODE_COUNT; i++) {
      var n = nodes[i];
      var rx = n.x;
      var ry = n.y;
      var dxm = n.x - mouseWorldX;
      var dym = n.y - mouseWorldY;
      var distm = Math.sqrt(dxm * dxm + dym * dym);
      if (distm < REPEL_RADIUS && distm > 0.0001) {
        var push = ((REPEL_RADIUS - distm) / REPEL_RADIUS) * REPEL_STRENGTH;
        rx += (dxm / distm) * push;
        ry += (dym / distm) * push;
      }
      renderX[i] = rx;
      renderY[i] = ry;
      posAttr[i * 3] = rx;
      posAttr[i * 3 + 1] = ry;
      posAttr[i * 3 + 2] = n.z;
    }

    var lineIndex = 0;
    for (var a = 0; a < NODE_COUNT; a++) {
      for (var b = a + 1; b < NODE_COUNT; b++) {
        var dx = renderX[a] - renderX[b];
        var dy = renderY[a] - renderY[b];
        var dz = nodes[a].z - nodes[b].z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECT_DIST) {
          var o = lineIndex * 6;
          linePositions[o] = renderX[a];
          linePositions[o + 1] = renderY[a];
          linePositions[o + 2] = nodes[a].z;
          linePositions[o + 3] = renderX[b];
          linePositions[o + 4] = renderY[b];
          linePositions[o + 5] = nodes[b].z;
          lineIndex++;
        }
      }
    }
    pointsGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIndex * 2);
  }

  function stepNodes() {
    // 고정된 홈 위치를 중심으로 각 노드마다 다른 주기·위상으로 아주 작게 흔들림.
    // 이 미세한 흔들림만으로도 노드 간 거리가 CONNECT_DIST 경계를 오가며
    // 연결선이 서서히 생겼다 사라지는 효과가 자연스럽게 만들어짐.
    var t = performance.now() / 1000;
    for (var i = 0; i < NODE_COUNT; i++) {
      var n = nodes[i];
      n.x = n.baseX + Math.sin(t * n.freqX + n.phaseX) * n.ampX;
      n.y = n.baseY + Math.sin(t * n.freqY + n.phaseY) * n.ampY;
      n.z = n.baseZ + Math.sin(t * n.freqZ + n.phaseZ) * n.ampZ;
    }
  }

  var mouseX = 0;
  var mouseY = 0;
  var targetRotX = 0;
  var targetRotY = 0;
  window.addEventListener(
    'pointermove',
    function (e) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      // 화면 NDC를 노드가 사는 월드 영역 크기로 근사 변환 (반발 효과용)
      mouseWorldX = mouseX * bounds.x;
      mouseWorldY = -mouseY * bounds.y;
    },
    { passive: true }
  );
  document.addEventListener(
    'mouseout',
    function (e) {
      if (!e.relatedTarget) {
        mouseWorldX = 9999;
        mouseWorldY = 9999;
      }
    },
    { passive: true }
  );

  function onResize() {
    if (window.innerWidth <= 0 || window.innerHeight <= 0) return; // 아직 레이아웃 전이면 건너뜀
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    computeBounds();
  }
  window.addEventListener('resize', onResize);
  onResize();
  // 스크립트 실행 시점에 아직 뷰포트 크기를 알 수 없었던 경우(레이아웃 이전 등)를 대비해
  // 다음 틱에 한 번 더 재확인 — 정상 상황에서는 같은 값이라 아무 변화도 없음
  setTimeout(onResize, 0);

  // 패럴랙스: 배경(신경망)이 전경 콘텐츠보다 살짝 느리게(스크롤 속도의 75%) 따라오도록
  var PARALLAX_SPEED = 0.75;
  var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  window.addEventListener(
    'scroll',
    function () {
      scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    },
    { passive: true }
  );

  var rafId = null;
  function animate() {
    rafId = requestAnimationFrame(animate);
    stepNodes();
    updateGeometry();

    targetRotY = mouseX * 0.04;
    targetRotX = mouseY * 0.025;
    group.rotation.y += (targetRotY - group.rotation.y) * 0.02;
    group.rotation.x += (-targetRotX - group.rotation.x) * 0.02;

    // 화면 스크롤량(px)을 "카메라 한 화면 높이 = bounds.y" 기준의 월드 단위로 환산 후,
    // 배경이 앞쪽 콘텐츠(1x)보다 느리게 따라오도록 상한을 둬 부드럽게 이동시킴.
    // innerHeight가 아직 0인 시점(레이아웃 이전 등)에는 계산을 건너뛰어 NaN 전파를 막음
    if (window.innerHeight > 0) {
      var worldPerPixel = bounds.y / window.innerHeight;
      var rawOffset = scrollY * PARALLAX_SPEED * worldPerPixel;
      var maxOffset = bounds.y * 1.5;
      var targetGroupY = Math.min(rawOffset, maxOffset);
      group.position.y += (targetGroupY - group.position.y) * 0.04;
    }

    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      animate();
    }
  });

  animate();
})();
