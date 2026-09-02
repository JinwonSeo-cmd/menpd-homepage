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
  var CONNECT_DIST = 4.0;
  var GOLD = 0xc9a24b;
  var CREAM = 0xf5f1e8;
  var DRIFT_SPEED = 0.0035;

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
    bounds = { x: (width / 2) * 0.9, y: (height / 2) * 0.9, z: 4 };
  }
  computeBounds();

  var nodes = [];
  var positions = new Float32Array(NODE_COUNT * 3);
  for (var i = 0; i < NODE_COUNT; i++) {
    var p = {
      x: (Math.random() * 2 - 1) * bounds.x,
      y: (Math.random() * 2 - 1) * bounds.y,
      z: (Math.random() * 2 - 1) * bounds.z,
      vx: (Math.random() * 2 - 1) * DRIFT_SPEED,
      vy: (Math.random() * 2 - 1) * DRIFT_SPEED,
      vz: (Math.random() * 2 - 1) * DRIFT_SPEED
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
    size: 0.16,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.22,
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
    opacity: 0.16,
    depthWrite: false
  });
  var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  group.add(lines);

  function updateGeometry() {
    var posAttr = pointsGeometry.attributes.position.array;
    var lineIndex = 0;
    for (var a = 0; a < NODE_COUNT; a++) {
      var na = nodes[a];
      posAttr[a * 3] = na.x;
      posAttr[a * 3 + 1] = na.y;
      posAttr[a * 3 + 2] = na.z;

      for (var b = a + 1; b < NODE_COUNT; b++) {
        var nb = nodes[b];
        var dx = na.x - nb.x;
        var dy = na.y - nb.y;
        var dz = na.z - nb.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECT_DIST) {
          var o = lineIndex * 6;
          linePositions[o] = na.x;
          linePositions[o + 1] = na.y;
          linePositions[o + 2] = na.z;
          linePositions[o + 3] = nb.x;
          linePositions[o + 4] = nb.y;
          linePositions[o + 5] = nb.z;
          lineIndex++;
        }
      }
    }
    pointsGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIndex * 2);
  }

  function stepNodes() {
    for (var i = 0; i < NODE_COUNT; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.z += n.vz;
      if (n.x > bounds.x || n.x < -bounds.x) n.vx *= -1;
      if (n.y > bounds.y || n.y < -bounds.y) n.vy *= -1;
      if (n.z > bounds.z || n.z < -bounds.z) n.vz *= -1;
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
    },
    { passive: true }
  );

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    computeBounds();
  }
  window.addEventListener('resize', onResize);
  onResize();

  var rafId = null;
  function animate() {
    rafId = requestAnimationFrame(animate);
    stepNodes();
    updateGeometry();

    targetRotY = mouseX * 0.08;
    targetRotX = mouseY * 0.05;
    group.rotation.y += (targetRotY - group.rotation.y) * 0.02;
    group.rotation.x += (-targetRotX - group.rotation.x) * 0.02;

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
