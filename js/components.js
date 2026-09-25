// 강의 진행 공통 컴포넌트: 프롬프트, 자료, 진도 저장

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} 로드 실패`);
  return res.json();
}

async function loadOptionalJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path} 로드 실패`);
  return res.json();
}

function applyClassVariant(classData, variant) {
  if (!variant) return classData;
  const overrides = new Map((variant.parts || []).map((part) => [part.slug, part]));
  return {
    ...classData,
    ...(variant.class || {}),
    variantId: variant.id,
    variantLabel: variant.label,
    parts: classData.parts.map((part) => ({ ...part, ...(overrides.get(part.slug) || {}) })),
  };
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
  const card = document.createElement("article");
  card.className = "download-card";
  const link = document.createElement("a");
  link.className = "download-card-link";
  link.href = file.url;
  if (file.download || file.url?.endsWith(".md")) link.setAttribute("download", "");
  else { link.target = "_blank"; link.rel = "noopener"; }
  const kind = (file.type || "FILE").toUpperCase();
  link.innerHTML = `
    <span><strong>${escapeHtml(file.label)}</strong><small>${escapeHtml(file.note || "새 창에서 자료를 확인합니다.")}</small></span>
    <span class="file-type${kind === "DRIVE" ? " drive" : ""}">${escapeHtml(kind)}</span>
  `;
  card.appendChild(link);
  if (file.copyable || file.url?.endsWith(".md")) {
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "download-copy-btn";
    copyBtn.textContent = "MD 내용 복사";
    copyBtn.addEventListener("click", async () => {
      copyBtn.disabled = true;
      try {
        const res = await fetch(file.url, { cache: "no-store" });
        if (!res.ok) throw new Error("파일을 불러오지 못했습니다.");
        copyToClipboard(await res.text(), copyBtn);
      } catch (error) {
        copyBtn.textContent = "복사 실패";
        setTimeout(() => { copyBtn.textContent = "MD 내용 복사"; }, 1500);
      } finally {
        copyBtn.disabled = false;
      }
    });
    card.appendChild(copyBtn);
  }
  return card;
}

function renderGuideCards(cards) {
  const grid = document.createElement("div");
  grid.className = "guide-card-grid";
  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "guide-card";
    article.innerHTML = `<h5>${escapeHtml(card.title)}</h5>${card.body ? `<p>${escapeHtml(card.body)}</p>` : ""}`;
    if (card.example) {
      const example = document.createElement("blockquote");
      example.className = "guide-example";
      example.textContent = card.example;
      article.appendChild(example);
    }
    if (card.point) {
      const point = document.createElement("p");
      point.className = "guide-point";
      point.textContent = card.point;
      article.appendChild(point);
    }
    if (card.keywords?.length) {
      const keywords = document.createElement("div");
      keywords.className = "guide-keywords";
      card.keywords.forEach((keyword) => {
        const chip = document.createElement("span");
        chip.textContent = keyword;
        keywords.appendChild(chip);
      });
      article.appendChild(keywords);
    }
    if (card.steps?.length) {
      const steps = document.createElement("ol");
      steps.className = "guide-steps";
      card.steps.forEach((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        steps.appendChild(item);
      });
      article.appendChild(steps);
    }
    grid.appendChild(article);
  });
  return grid;
}

function renderLearningChapters(chapters, storageKey) {
  const wrap = document.createElement("div");
  wrap.className = "learning-chapters";
  const progressKey = `${storageKey}:chapter-checks`;
  const savedChecks = JSON.parse(localStorage.getItem(progressKey) || "{}");
  const totalChecks = chapters.reduce((total, chapter) => total + (chapter.checklist?.length || 0), 0);

  const nav = document.createElement("nav");
  nav.className = "chapter-mini-nav";
  nav.setAttribute("aria-label", "PE7 챕터 바로가기");
  chapters.forEach((chapter, chapterIndex) => {
    const link = document.createElement("a");
    link.href = `#${storageKey.replace(/[^a-zA-Z0-9_-]/g, "-")}-chapter-${chapterIndex + 1}`;
    link.textContent = `${chapter.number} ${chapter.navTitle || chapter.title}`;
    nav.appendChild(link);
  });
  wrap.appendChild(nav);

  const progress = document.createElement("div");
  progress.className = "chapter-progress";
  progress.innerHTML = `<div class="chapter-progress-row"><strong>전체 학습 진행</strong><span></span></div><div class="chapter-progress-track"><i></i></div>`;
  wrap.appendChild(progress);

  const updateProgress = () => {
    const completed = Object.values(savedChecks).filter(Boolean).length;
    progress.querySelector("span").textContent = `${completed} / ${totalChecks} 항목 완료`;
    progress.querySelector("i").style.width = `${totalChecks ? (completed / totalChecks) * 100 : 0}%`;
  };

  chapters.forEach((chapter, chapterIndex) => {
    const article = document.createElement("article");
    article.className = "learning-chapter";
    article.id = `${storageKey.replace(/[^a-zA-Z0-9_-]/g, "-")}-chapter-${chapterIndex + 1}`;
    article.innerHTML = `
      <header class="learning-chapter-head">
        <span>${escapeHtml(chapter.number || "")}</span>
        <div><h5>${escapeHtml(chapter.title)}</h5>${chapter.summary ? `<p>${escapeHtml(chapter.summary)}</p>` : ""}</div>
      </header>
    `;

    if (chapter.cards?.length) {
      const cards = renderGuideCards(chapter.cards);
      cards.classList.add("chapter-card-grid");
      article.appendChild(cards);
    }

    if (chapter.comparison?.length) {
      const comparison = document.createElement("div");
      comparison.className = "prompt-comparison";
      chapter.comparison.forEach((item) => {
        const card = document.createElement("section");
        card.className = `comparison-card ${item.tone === "good" ? "good" : "bad"}`;
        card.innerHTML = `<strong>${escapeHtml(item.label)}</strong><blockquote>${escapeHtml(item.prompt)}</blockquote>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}`;
        comparison.appendChild(card);
      });
      article.appendChild(comparison);
    }

    if (chapter.examplePrompt) {
      const example = document.createElement("div");
      example.className = "assembled-prompt";
      example.innerHTML = `<strong>실전 PE7+ 조립 예시</strong><pre>${escapeHtml(chapter.examplePrompt)}</pre>`;
      article.appendChild(example);
    }

    if (chapter.callout) {
      const callout = document.createElement("p");
      callout.className = "chapter-callout";
      callout.textContent = chapter.callout;
      article.appendChild(callout);
    }

    if (chapter.checklist?.length) {
      const checklist = document.createElement("div");
      checklist.className = "chapter-checklist";
      const checklistHead = document.createElement("div");
      checklistHead.className = "chapter-checklist-head";
      checklistHead.innerHTML = `<strong>챕터 체크리스트</strong><span></span>`;
      checklist.appendChild(checklistHead);
      const updateChapterCount = () => {
        const checked = checklist.querySelectorAll("input:checked").length;
        checklistHead.querySelector("span").textContent = `${checked} / ${chapter.checklist.length} 완료`;
      };
      chapter.checklist.forEach((item, itemIndex) => {
        const key = `${chapterIndex}-${itemIndex}`;
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" ${savedChecks[key] ? "checked" : ""}><span>${escapeHtml(item)}</span>`;
        const input = label.querySelector("input");
        input.addEventListener("change", () => {
          savedChecks[key] = input.checked;
          localStorage.setItem(progressKey, JSON.stringify(savedChecks));
          updateChapterCount();
          updateProgress();
        });
        checklist.appendChild(label);
      });
      updateChapterCount();
      article.appendChild(checklist);
    }

    if (chapter.quiz) {
      const quiz = document.createElement("section");
      quiz.className = "chapter-quiz";
      quiz.innerHTML = `<strong>🧩 퀴즈</strong><p>${escapeHtml(chapter.quiz.question)}</p><div class="quiz-options"></div><button type="button" class="quiz-submit">채점하기</button><p class="quiz-result" aria-live="polite"></p>`;
      const optionsRoot = quiz.querySelector(".quiz-options");
      let selected = null;
      (chapter.quiz.options || []).forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-option";
        button.textContent = option;
        button.addEventListener("click", () => {
          optionsRoot.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
          button.classList.add("selected");
          selected = option;
        });
        optionsRoot.appendChild(button);
      });
      quiz.querySelector(".quiz-submit").addEventListener("click", () => {
        const result = quiz.querySelector(".quiz-result");
        optionsRoot.querySelectorAll("button").forEach((button) => {
          button.classList.toggle("correct", button.textContent === chapter.quiz.answer);
          button.classList.toggle("wrong", button.textContent === selected && selected !== chapter.quiz.answer);
        });
        if (!selected) result.textContent = "먼저 답을 선택하세요.";
        else if (selected === chapter.quiz.answer) result.textContent = `정답입니다. ${chapter.quiz.explanation || ""}`.trim();
        else result.textContent = `다시 확인해보세요. 정답은 ${chapter.quiz.answer}입니다. ${chapter.quiz.explanation || ""}`.trim();
      });
      article.appendChild(quiz);
    }

    wrap.appendChild(article);
  });

  updateProgress();
  return wrap;
}

function partStorageKey(classId, part, index) {
  return `menpd-class:${classId}:${part.slug || part.partNo || index}`;
}

async function hashAccessPassword(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function classAccessStorageKey(classId, variantId) {
  return `menpd-class-access:${classId}:${variantId}`;
}

async function ensureClassAccess({ classId, variantId, variant, classData }) {
  const access = variant?.access;
  if (!access?.enabled) return true;

  const expiresAt = Date.parse(access.expiresAt);
  const now = Date.now();
  const storageKey = classAccessStorageKey(classId, variantId);
  const savedUntil = Number(localStorage.getItem(storageKey) || 0);
  if (savedUntil > now && savedUntil === expiresAt) return true;

  localStorage.removeItem(storageKey);
  document.body.classList.add("class-access-locked");
  document.title = `${access.displayName || variant.label || classData.title} | 수강생 전용`;
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.appendChild(robots);
  }
  robots.content = "noindex, nofollow";

  const gate = document.createElement("main");
  gate.className = "class-access-gate";
  const isExpired = Number.isFinite(expiresAt) && now > expiresAt;
  gate.innerHTML = `
    <section class="access-gate-card" aria-labelledby="access-gate-title">
      <div class="access-lock" aria-hidden="true">🔒</div>
      <p class="access-kicker">STUDENT MATERIALS</p>
      <h1 id="access-gate-title">${escapeHtml(access.displayName || variant.label || classData.title)}</h1>
      <p class="access-description">${isExpired ? "이 교안의 복습 기간이 종료되었습니다." : "수강생에게 안내된 비밀번호를 입력하면 교안이 열립니다."}</p>
      ${isExpired ? `<p class="access-expiry">복습 종료일 · ${escapeHtml(access.expiryLabel || access.expiresAt)}</p>` : `
        <form class="access-form">
          <label for="class-access-password">교안 비밀번호</label>
          <div class="access-input-row">
            <input id="class-access-password" name="password" type="password" autocomplete="current-password" spellcheck="false" placeholder="비밀번호 입력" required>
            <button type="submit">교안 열기</button>
          </div>
          <p class="access-message" aria-live="polite"></p>
        </form>
        <p class="access-expiry">${escapeHtml(access.expiryLabel || access.expiresAt)}까지 복습할 수 있습니다.</p>
      `}
      <a class="access-home-link" href="index.html#live-class">← 홈페이지로 돌아가기</a>
    </section>
  `;
  document.querySelector(".class-nav").after(gate);

  if (isExpired) return false;

  return new Promise((resolve) => {
    const form = gate.querySelector(".access-form");
    const input = gate.querySelector("#class-access-password");
    const message = gate.querySelector(".access-message");
    const button = gate.querySelector("button[type='submit']");
    input.focus();
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      button.disabled = true;
      message.classList.remove("error");
      message.textContent = "비밀번호를 확인하고 있습니다.";
      const candidateHash = await hashAccessPassword(input.value.trim());
      if (candidateHash === access.passwordHash) {
        localStorage.setItem(storageKey, String(expiresAt));
        gate.remove();
        document.body.classList.remove("class-access-locked");
        resolve(true);
        return;
      }
      message.textContent = "비밀번호가 맞지 않습니다. 다시 확인해 주세요.";
      message.classList.add("error");
      input.value = "";
      input.focus();
      button.disabled = false;
    });
  });
}

function renderPart({ part, index, classId, promptMap }) {
  const section = document.createElement("section");
  const partId = `part-${part.slug || String(part.partNo).replace(/[^a-zA-Z0-9가-힣_-]/g, "-")}`;
  const label = part.label || `Part ${part.partNo}`;
  const storageKey = partStorageKey(classId, part, index);
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{"tasks":[]}');
  section.className = `class-part${index === 0 ? " open" : ""}`;
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
        const state = JSON.parse(localStorage.getItem(storageKey) || '{"tasks":[]}');
        state.tasks = Array.from(list.querySelectorAll("input")).map((input) => input.checked);
        localStorage.setItem(storageKey, JSON.stringify(state));
      });
      list.appendChild(li);
    });
    block.appendChild(list);
    body.appendChild(block);
  }

  if (part.guideCards?.length) {
    const block = document.createElement("div");
    block.className = "part-block";
    block.innerHTML = '<h4 class="part-block-title">핵심 내용</h4>';
    block.appendChild(renderGuideCards(part.guideCards));
    body.appendChild(block);
  }

  if (part.chapters?.length) {
    const block = document.createElement("div");
    block.className = "part-block";
    block.innerHTML = '<h4 class="part-block-title">PE7+ 프롬프트 엔지니어링 핵심 교안</h4>';
    block.appendChild(renderLearningChapters(part.chapters, storageKey));
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

async function renderClassPage(classId, variantId = "") {
  try {
    const [baseClassData, promptsArr, variant] = await Promise.all([
      loadJSON(`data/classes/${classId}.json`),
      loadJSON("data/prompts.json"),
      variantId ? loadOptionalJSON(`data/classes/variants/${classId}/${variantId}.json`) : Promise.resolve(null),
    ]);
    const classData = applyClassVariant(baseClassData, variant);
    const accessGranted = await ensureClassAccess({ classId, variantId, variant, classData });
    if (!accessGranted) return;
    const promptMap = Object.fromEntries(promptsArr.map((prompt) => [prompt.id, prompt]));
    document.title = `${classData.title} | 멘피디 AI`;
    document.querySelector("h1[data-class-title]").textContent = classData.title;
    document.querySelector("[data-class-subtitle]").textContent = classData.subtitle || "";
    document.querySelector("[data-class-meta]").textContent = `${classData.instructor} · ${classData.duration} · ${classData.parts.length}단계${classData.variantLabel ? ` · ${classData.variantLabel}` : ""}`;
    const promptCount = classData.parts.reduce((total, part) => total + (part.prompts?.length || 0), 0);
    const mdCount = (classData.downloads || []).filter((file) => file.type?.toUpperCase() === "MD" || file.url?.endsWith(".md")).length;
    document.querySelector("[data-class-step-count]").textContent = `${classData.parts.length}단계`;
    document.querySelector("[data-class-prompt-count]").textContent = `프롬프트 ${promptCount}개`;
    document.querySelector("[data-class-md-count]").textContent = `MD 실습자료 ${mdCount}종`;

    if (classData.downloads?.length) {
      const downloadSection = document.querySelector("[data-download-section]");
      const downloadRoot = document.querySelector("[data-class-downloads]");
      downloadSection.hidden = false;
      classData.downloads.forEach((file) => downloadRoot.appendChild(renderDownloadCard(file)));
    }

    const partsRoot = document.querySelector("[data-parts]");
    const toc = document.querySelector("[data-toc]");
    classData.parts.forEach((part, index) => {
      const section = renderPart({ part, index, classId, promptMap });
      partsRoot.appendChild(section);
      const anchor = document.createElement("a");
      anchor.href = `#${section.id}`;
      anchor.textContent = `${index + 1}. ${part.title}`;
      toc.appendChild(anchor);
    });

    document.querySelector("[data-course-start]").addEventListener("click", () => {
      const first = partsRoot.querySelector(".class-part");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } catch (error) {
    document.querySelector("[data-parts]").innerHTML = '<div class="class-part open"><div class="part-head"><div><h3 class="part-title">강의 자료를 불러오지 못했습니다.</h3><p class="part-summary">잠시 후 새로고침하거나 강사에게 알려주세요.</p></div></div></div>';
    console.error(error);
  }
}
