// 공통 컴포넌트: 프롬프트 카드 렌더링 + 복사버튼 + 진도바
// class-template.html, prompts.html 에서 공통으로 사용

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} 로드 실패`);
  return res.json();
}

function copyToClipboard(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btnEl.textContent;
    btnEl.textContent = "복사됨 ✓";
    btnEl.classList.add("copied");
    setTimeout(() => {
      btnEl.textContent = original;
      btnEl.classList.remove("copied");
    }, 1500);
  });
}

function renderPromptCard(prompt) {
  const card = document.createElement("div");
  card.className = "prompt-card";
  card.innerHTML = `
    <div class="prompt-card-head">
      <span class="prompt-category">${prompt.category}</span>
      <span class="prompt-tool">${prompt.tool}</span>
    </div>
    <h4 class="prompt-title">${prompt.title}</h4>
    <pre class="prompt-body">${escapeHtml(prompt.prompt)}</pre>
    <button class="copy-btn" type="button">프롬프트 복사</button>
  `;
  card.querySelector(".copy-btn").addEventListener("click", (e) => {
    copyToClipboard(prompt.prompt, e.target);
  });
  return card;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderPromptsByIds(promptMap, ids, container) {
  container.innerHTML = "";
  ids.forEach((id) => {
    const p = promptMap[id];
    if (p) container.appendChild(renderPromptCard(p));
  });
}

// 아코디언 (도구 가이드 등에서 사용)
function initAccordions(root = document) {
  root.querySelectorAll(".accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
  });
}

// 강의 진행 페이지: 파트 목록 렌더링 + 진행 중 파트 스크롤 하이라이트
async function renderClassPage(classId) {
  const [classData, promptsArr] = await Promise.all([
    loadJSON(`data/classes/${classId}.json`),
    loadJSON(`data/prompts.json`),
  ]);
  const promptMap = Object.fromEntries(promptsArr.map((p) => [p.id, p]));

  document.querySelector("[data-class-title]").textContent = classData.title;
  document.querySelector("[data-class-subtitle]").textContent = classData.subtitle || "";
  document.querySelector("[data-class-meta]").textContent =
    `${classData.instructor} · ${classData.duration}`;

  if (classData.shortUrl) {
    const fullUrl = `https://menpd.com/${classData.shortUrl}`;
    const qrBox = document.querySelector("[data-class-qr]");
    if (qrBox) {
      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullUrl)}`;
      qrBox.innerHTML = `
        <p class="short-url">${fullUrl}</p>
        <img src="${qrImgUrl}" alt="QR 코드" width="140" height="140" />
      `;
    }
  }

  const partsRoot = document.querySelector("[data-parts]");
  partsRoot.innerHTML = "";

  classData.parts.forEach((part) => {
    const section = document.createElement("section");
    section.className = "class-part";
    section.id = `part-${part.partNo}`;
    section.innerHTML = `
      <h3>Part ${part.partNo}. ${part.title}</h3>
      <p class="part-summary">${part.summary}</p>
      <div class="part-prompts"></div>
    `;
    if (part.prompts && part.prompts.length) {
      renderPromptsByIds(promptMap, part.prompts, section.querySelector(".part-prompts"));
    }
    partsRoot.appendChild(section);
  });
}
