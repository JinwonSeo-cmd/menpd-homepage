// 강의 진행 공통 컴포넌트: 프롬프트, 자료, 진도 저장

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} 로드 실패`);
  return res.json();
}

function escapeHtml(value = "") {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
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
  const card = document.createElement("article");
  card.className = "prompt-card";
  card.innerHTML = `
    <div class="prompt-card-head">
      <span class="prompt-category">${escapeHtml(prompt.category)}</span>
      <span class="prompt-tool">${escapeHtml(prompt.tool)}</span>
    </div>
    <h4 class="prompt-title">${escapeHtml(prompt.title)}</h4>
    <pre class="prompt-body">${escapeHtml(prompt.prompt)}</pre>
    <button class="copy-btn" type="button">프롬프트 복사</button>
  `;
  card.querySelector(".copy-btn").addEventListener("click", (event) => copyToClipboard(prompt.prompt, event.currentTarget));
  return card;
}

function renderPromptsByIds(promptMap, ids, container) {
  ids.forEach((id) => {
    const prompt = promptMap[id];
    if (prompt) container.appendChild(renderPromptCard(prompt));
  });
}

function renderLinkList(items, className) {
  const wrap = document.createElement("div");
  wrap.className = className;
  items.forEach((item) => {
    const link = document.createElement("a");
    const isDownload = item.download || item.url?.endsWith(".md");
    link.className = `${className === "resource-list" ? "resource-link" : "tool-link"}${isDownload ? " download" : ""}`;
    link.href = item.url;
    link.textContent = item.label;
    if (isDownload) link.setAttribute("download", "");
    else { link.target = "_blank"; link.rel = "noopener"; }
    wrap.appendChild(link);
  });
  return wrap;
}

function renderDownloadCard(file) {
  const link = document.createElement("a");
  link.className = "download-card";
  link.href = file.url;
  if (file.download || file.url?.endsWith(".md")) link.setAttribute("download", "");
  else { link.target = "_blank"; link.rel = "noopener"; }
  const kind = (file.type || "FILE").toUpperCase();
  link.innerHTML = `
    <span><strong>${escapeHtml(file.label)}</strong><small>${escapeHtml(file.note || "새 창에서 자료를 확인합니다.")}</small></span>
    <span class="file-type${kind === "DRIVE" ? " drive" : ""}">${escapeHtml(kind)}</span>
  `;
  return link;
}

function partStorageKey(classId, part, index) {
  return `menpd-class:${classId}:${part.slug || part.partNo || index}`;
}

function renderPart({ part, index, classId, promptMap, onProgressChange }) {
  const section = document.createElement("section");
  const partId = `part-${part.slug || String(part.partNo).replace(/[^a-zA-Z0-9가-힣_-]/g, "-")}`;
  const label = part.label || `Part ${part.partNo}`;
  const storageKey = partStorageKey(classId, part, index);
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{"done":false,"tasks":[]}');
  section.className = `class-part${index === 0 ? " open" : ""}${saved.done ? " is-complete" : ""}`;
  section.id = partId;
  section.dataset.storageKey = storageKey;
  section.innerHTML = `
    <div class="part-head" role="button" tabindex="0" aria-expanded="${index === 0}">
      <span class="part-number">${escapeHtml(label)}</span>
      <div><p class="part-kicker">STEP ${String(index + 1).padStart(2, "0")}</p><h3 class="part-title">${escapeHtml(part.title)}</h3><p class="part-summary">${escapeHtml(part.summary)}</p></div>
      <span class="part-toggle" aria-hidden="true">+</span>
    </div>
    <div class="part-body"><div class="part-body-inner"></div></div>
  `;

  const body = section.querySelector(".part-body-inner");
  if (part.tasks?.length) {
    const block = document.createElement("div");
    block.className = "part-block";
    block.innerHTML = '<h4 class="part-block-title">지금 할 일</h4>';
    const list = document.createElement("ul");
    list.className = "task-list";
    part.tasks.forEach((task, taskIndex) => {
      const li = document.createElement("li");
      li.innerHTML = `<label><input type="checkbox" ${saved.tasks?.[taskIndex] ? "checked" : ""}><span>${escapeHtml(task)}</span></label>`;
      li.querySelector("input").addEventListener("change", () => {
        const state = JSON.parse(localStorage.getItem(storageKey) || '{"done":false,"tasks":[]}');
        state.tasks = Array.from(list.querySelectorAll("input")).map((input) => input.checked);
        localStorage.setItem(storageKey, JSON.stringify(state));
      });
      list.appendChild(li);
    });
    block.appendChild(list);
    body.appendChild(block);
  }

  if (part.prompts?.length) {
    const block = document.createElement("div");
    block.className = "part-block";
    block.innerHTML = '<h4 class="part-block-title">복사해서 바로 쓰는 프롬프트</h4>';
    const grid = document.createElement("div");
    grid.className = "prompt-grid";
    renderPromptsByIds(promptMap, part.prompts, grid);
    block.appendChild(grid);
    body.appendChild(block);
  }

  if (part.resources?.length) {
    const block = document.createElement("div");
    block.className = "part-block";
    block.innerHTML = '<h4 class="part-block-title">실습 자료</h4>';
    block.appendChild(renderLinkList(part.resources, "resource-list"));
    body.appendChild(block);
  }

  if (part.tools?.length) {
    const block = document.createElement("div");
    block.className = "part-block";
    block.innerHTML = '<h4 class="part-block-title">사용 도구 열기</h4>';
    block.appendChild(renderLinkList(part.tools, "tool-list"));
    body.appendChild(block);
  }

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = `part-complete${saved.done ? " done" : ""}`;
  completeButton.textContent = saved.done ? "완료됨 ✓" : "이 단계 완료";
  completeButton.addEventListener("click", () => {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{"done":false,"tasks":[]}');
    state.done = !state.done;
    localStorage.setItem(storageKey, JSON.stringify(state));
    section.classList.toggle("is-complete", state.done);
    completeButton.classList.toggle("done", state.done);
    completeButton.textContent = state.done ? "완료됨 ✓" : "이 단계 완료";
    onProgressChange();
  });
  body.appendChild(completeButton);

  const head = section.querySelector(".part-head");
  const togglePart = () => {
    section.classList.toggle("open");
    head.setAttribute("aria-expanded", section.classList.contains("open"));
  };
  head.addEventListener("click", togglePart);
  head.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); togglePart(); }
  });
  return section;
}

async function renderClassPage(classId) {
  try {
    const [classData, promptsArr] = await Promise.all([loadJSON(`data/classes/${classId}.json`), loadJSON("data/prompts.json")]);
    const promptMap = Object.fromEntries(promptsArr.map((prompt) => [prompt.id, prompt]));
    document.title = `${classData.title} | 멘피디 AI`;
    document.querySelector("h1[data-class-title]").textContent = classData.title;
    document.querySelector("[data-class-subtitle]").textContent = classData.subtitle || "";
    document.querySelector("[data-class-meta]").textContent = `${classData.instructor} · ${classData.duration} · ${classData.parts.length}단계`;

    if (classData.shortUrl) {
      const fullUrl = `https://menpd.com/${classData.shortUrl}`;
      document.querySelector("[data-class-qr]").innerHTML = `<p class="short-url">${fullUrl}</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullUrl)}" alt="강의 페이지 QR 코드" width="130" height="130">`;
    }

    if (classData.downloads?.length) {
      const downloadSection = document.querySelector("[data-download-section]");
      const downloadRoot = document.querySelector("[data-class-downloads]");
      downloadSection.hidden = false;
      classData.downloads.forEach((file) => downloadRoot.appendChild(renderDownloadCard(file)));
    }

    const partsRoot = document.querySelector("[data-parts]");
    const toc = document.querySelector("[data-toc]");
    const updateProgress = () => {
      const parts = Array.from(partsRoot.querySelectorAll(".class-part"));
      const completed = parts.filter((part) => part.classList.contains("is-complete")).length;
      const percent = parts.length ? Math.round((completed / parts.length) * 100) : 0;
      document.querySelector("[data-progress-percent]").textContent = `${percent}%`;
      document.querySelector("[data-progress-copy]").textContent = completed === parts.length ? "모든 단계를 완료했습니다" : `${completed}/${parts.length}단계 완료`;
      document.querySelector("[data-progress-bar]").style.width = `${percent}%`;
      parts.forEach((part, index) => toc.children[index]?.classList.toggle("complete", part.classList.contains("is-complete")));
    };

    classData.parts.forEach((part, index) => {
      const section = renderPart({ part, index, classId, promptMap, onProgressChange: updateProgress });
      partsRoot.appendChild(section);
      const anchor = document.createElement("a");
      anchor.href = `#${section.id}`;
      anchor.textContent = `${index + 1}. ${part.title}`;
      toc.appendChild(anchor);
    });

    document.querySelector("[data-next-step]").addEventListener("click", () => {
      const next = Array.from(partsRoot.querySelectorAll(".class-part")).find((part) => !part.classList.contains("is-complete"));
      if (next) {
        next.classList.add("open");
        next.querySelector(".part-head").setAttribute("aria-expanded", "true");
        next.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    updateProgress();
  } catch (error) {
    document.querySelector("[data-parts]").innerHTML = '<div class="class-part open"><div class="part-head"><div><h3 class="part-title">강의 자료를 불러오지 못했습니다.</h3><p class="part-summary">잠시 후 새로고침하거나 강사에게 알려주세요.</p></div></div></div>';
    console.error(error);
  }
}
