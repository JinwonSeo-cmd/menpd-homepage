#!/usr/bin/env node
/**
 * 짧은 URL 정적 페이지 생성기 (GitHub Pages용, 서버 불필요)
 *
 * 사용법:
 *   1) data/shortlinks.json 에 { "슬러그": "강의id" } 추가
 *   2) node scripts/gen-shortlink.js 실행
 *   3) c/<슬러그>/index.html 이 자동 생성됨 → 커밋 & 푸시
 *
 * 강의 시작 시 menpd.com/c/<슬러그> 로 접속 (또는 QR)
 *   → 0.1초 내 class-template.html?id=<강의id> 로 이동
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const shortlinksPath = path.join(ROOT, "data", "shortlinks.json");

function redirectHtml(classId, slug) {
  const target = `/class-template.html?id=${classId}`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta http-equiv="refresh" content="0; url=${target}" />
<link rel="canonical" href="${target}" />
<script>location.replace(${JSON.stringify(target)});</script>
<title>이동 중...</title>
</head>
<body>
<p>강의 페이지로 이동 중입니다. 자동으로 이동하지 않으면 <a href="${target}">여기를 클릭</a>하세요.</p>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(shortlinksPath)) {
    console.error("data/shortlinks.json 이 없습니다.");
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(shortlinksPath, "utf-8"));
  const created = [];

  Object.entries(map).forEach(([slug, classId]) => {
    const dir = path.join(ROOT, "c", slug);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "index.html");
    fs.writeFileSync(filePath, redirectHtml(classId, slug), "utf-8");
    created.push(`c/${slug}/index.html -> ${classId}`);
  });

  console.log(`${created.length}개 짧은 URL 페이지 생성 완료:`);
  created.forEach((line) => console.log("  " + line));
}

main();
