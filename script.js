const header = document.getElementById("header");
const nav = document.getElementById("nav");
const menuToggle = document.getElementById("menuToggle");
const postList = document.getElementById("postList");
const postCount = document.getElementById("postCount");
const postSearch = document.getElementById("postSearch");
const categoryFilter = document.getElementById("categoryFilter");
const postModal = document.getElementById("postModal");
const postForm = document.getElementById("postForm");
const openPostModal = document.getElementById("openPostModal");
const resetDemoPosts = document.getElementById("resetDemoPosts");
const fileDemo = document.getElementById("fileDemo");
const fileDemoName = document.getElementById("fileDemoName");
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const STORAGE_KEY = "neuramotion-hub-posts-preview";

const categoryMap = {
  "Robotics": "로봇 자동화",
  "Vision AI": "비전 AI",
  "Sensor Data": "센서 데이터",
  "Consulting": "도입 상담",
  "Maintenance": "AI 고장 예측"
};

function normalizeCategory(category) {
  return categoryMap[category] || category;
}

function translateSavedText(value) {
  return String(value)
    .replaceAll("Vision AI", "비전 AI")
    .replaceAll("Sensor Data", "센서 데이터")
    .replaceAll("Robotics", "로봇 자동화")
    .replaceAll("Maintenance", "AI 고장 예측")
    .replaceAll("Consulting", "도입 상담")
    .replaceAll("LiDAR", "라이다")
    .replaceAll("SLAM", "지도 작성")
    .replaceAll("YOLO", "객체 인식 모델")
    .replaceAll("PoC", "실증");
}

const demoPosts = [
  {
    id: "demo-1",
    title: "모바일 로봇용 라이다 데이터 분석 실증",
    category: "로봇 자동화",
    body: "실내 주행 로봇에서 수집한 라이다 로그를 기반으로 장애물 패턴과 경로 안정성을 분석하고 싶습니다.",
    createdAt: "2026-05-17",
    fileName: "라이다_예시_데이터.csv",
    comments: ["지도 작성 품질 지표와 경로 이탈률을 같이 보면 좋겠습니다."]
  },
  {
    id: "demo-2",
    title: "비전 AI 기반 불량 감지 자동화",
    category: "비전 AI",
    body: "카메라 이미지로 표면 결함을 탐지하고 작업자에게 실시간 알림을 주는 시스템을 검토 중입니다.",
    createdAt: "2026-05-17",
    fileName: "결함_이미지_예시.zip",
    comments: ["객체 인식 모델과 분류 모델을 함께 쓰는 구조를 제안합니다."]
  },
  {
    id: "demo-3",
    title: "진동 센서 기반 AI 고장 예측 대시보드",
    category: "AI 고장 예측",
    body: "모터 진동과 온도 데이터를 활용해 이상 징후를 조기에 발견하는 대시보드를 만들고 싶습니다.",
    createdAt: "2026-05-17",
    fileName: "",
    comments: []
  }
];

let posts = loadPosts();

function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPosts));
      return [...demoPosts];
    }
    return JSON.parse(saved).map((post) => ({
      ...post,
      title: translateSavedText(post.title),
      body: translateSavedText(post.body),
      category: normalizeCategory(post.category),
      comments: (post.comments || []).map((comment) => translateSavedText(comment))
    }));
  } catch (error) {
    return [...demoPosts];
  }
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderPosts() {
  const keyword = postSearch.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const filtered = posts.filter((post) => {
    const category = normalizeCategory(post.category);
    const matchesKeyword = `${post.title} ${post.body} ${category}`.toLowerCase().includes(keyword);
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    return matchesKeyword && matchesCategory;
  });

  postCount.textContent = `게시글 ${filtered.length}개`;

  if (!filtered.length) {
    postList.innerHTML = '<div class="empty-state">검색 조건에 맞는 협업 글이 없습니다.</div>';
    return;
  }

  postList.innerHTML = filtered.map((post) => {
    const comments = post.comments.map((comment) => `<div>· ${escapeHtml(translateSavedText(comment))}</div>`).join("");
    const category = normalizeCategory(post.category);
    const fileText = post.fileName ? "첨부 파일 있음" : "첨부 파일 없음";

    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-meta">
          <span class="category-pill">${escapeHtml(category)}</span>
          <span>${escapeHtml(post.createdAt)}</span>
          <span>${fileText}</span>
        </div>
        <h3>${escapeHtml(translateSavedText(post.title))}</h3>
        <p>${escapeHtml(translateSavedText(post.body))}</p>
        <div class="comment-list">${comments || "<div>아직 댓글이 없습니다.</div>"}</div>
        <form class="comment-box" data-comment-form>
          <input type="text" placeholder="댓글을 입력하세요" aria-label="댓글 입력" required>
          <button type="submit">댓글 등록</button>
        </form>
      </article>
    `;
  }).join("");
}

function openModal() {
  postModal.classList.add("open");
  postModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("postTitle").focus();
}

function closeModal() {
  postModal.classList.remove("open");
  postModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  postForm.reset();
}

window.addEventListener("scroll", () => {
  if (header) header.classList.toggle("scrolled", window.scrollY > 24);
});

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (nav && menuToggle) {
  nav.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      nav.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

if (openPostModal) openPostModal.addEventListener("click", openModal);

if (postModal) postModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && postModal && postModal.classList.contains("open")) {
    closeModal();
  }
});

if (postForm) postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const file = document.getElementById("postFile").files[0];
  const newPost = {
    id: `post-${Date.now()}`,
    title: document.getElementById("postTitle").value.trim(),
    category: document.getElementById("postCategory").value,
    body: document.getElementById("postBody").value.trim(),
    createdAt: new Date().toISOString().slice(0, 10),
    fileName: file ? file.name : "",
    comments: []
  };

  posts = [newPost, ...posts];
  savePosts();
  if (postList && postCount && postSearch && categoryFilter) renderPosts();
  closeModal();
});

if (postList) postList.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-comment-form]")) {
    return;
  }

  event.preventDefault();
  const card = event.target.closest(".post-card");
  const input = event.target.querySelector("input");
  const post = posts.find((item) => item.id === card.dataset.postId);
  const comment = input.value.trim();

  if (!post || !comment) {
    return;
  }

  post.comments.push(comment);
  savePosts();
  renderPosts();
});

if (postSearch) postSearch.addEventListener("input", renderPosts);
if (categoryFilter) categoryFilter.addEventListener("change", renderPosts);

if (resetDemoPosts) resetDemoPosts.addEventListener("click", () => {
  posts = [...demoPosts];
  savePosts();
  postSearch.value = "";
  categoryFilter.value = "all";
  renderPosts();
});

if (fileDemo) fileDemo.addEventListener("change", () => {
  const file = fileDemo.files[0];
  fileDemoName.textContent = file ? `${file.name} 선택됨` : "데이터셋, 이미지, 로그 파일을 첨부할 수 있습니다.";
});

if (contactForm) contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "문의가 접수된 것처럼 표시됩니다. 실제 전송 기능은 백엔드 연동 시 활성화됩니다.";
  contactForm.reset();
});

function setupNetworkCanvas() {
  const canvas = document.getElementById("networkCanvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const points = [];
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let resizeTimer = 0;
  let lastFrame = 0;
  let isAnimating = false;
  let isHeroVisible = true;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frameDuration = 1000 / 30;

  function getPixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  function resize() {
    const pixelRatio = getPixelRatio();
    width = canvas.width = Math.floor(window.innerWidth * pixelRatio);
    height = canvas.height = Math.floor(canvas.offsetHeight * pixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    points.length = 0;

    const isSmallScreen = window.innerWidth < 720;
    const count = Math.min(isSmallScreen ? 34 : 56, Math.floor(window.innerWidth / (isSmallScreen ? 20 : 24)));
    for (let index = 0; index < count; index += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22 * pixelRatio,
        vy: (Math.random() - 0.5) * 0.22 * pixelRatio,
        radius: (Math.random() * 1.4 + 0.8) * pixelRatio
      });
    }
  }

  function drawFrame() {
    const pixelRatio = getPixelRatio();
    const connectionLimit = 135 * pixelRatio;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(63, 255, 215, 0.68)";
    context.strokeStyle = "rgba(77, 163, 255, 0.13)";
    context.lineWidth = pixelRatio;

    points.forEach((point, index) => {
      if (!reduceMotion) {
        point.x += point.vx;
        point.y += point.vy;
      }

      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;

      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();

      let connections = 0;
      for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
        const next = points[nextIndex];
        const distance = Math.hypot(point.x - next.x, point.y - next.y);

        if (distance < connectionLimit) {
          context.globalAlpha = Math.min(0.78, 1 - distance / connectionLimit);
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(next.x, next.y);
          context.stroke();
          context.globalAlpha = 1;

          connections += 1;
          if (connections >= 4) {
            break;
          }
        }
      }
    });
  }

  function animate(timestamp) {
    if (!isAnimating) {
      return;
    }

    if (timestamp - lastFrame >= frameDuration) {
      lastFrame = timestamp;
      drawFrame();
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function start() {
    if (reduceMotion || isAnimating || document.hidden || !isHeroVisible) {
      return;
    }

    isAnimating = true;
    animationFrame = requestAnimationFrame(animate);
  }

  function stop() {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
  }

  resize();
  drawFrame();
  start();

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      stop();
      resize();
      drawFrame();
      start();
    }, 160);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  if ("IntersectionObserver" in window) {
    const networkObserver = new IntersectionObserver((entries) => {
      isHeroVisible = entries[0].isIntersecting;
      if (isHeroVisible) {
        start();
      } else {
        stop();
      }
    }, { threshold: 0.08 });

    networkObserver.observe(canvas);
  }
}

setupNetworkCanvas();
if (postList && postCount && postSearch && categoryFilter) renderPosts();

// NeuraMotion OS Interface preview module
function nmAnimateCount(element, duration) {
  const target = Number(element.dataset.nmTarget || 0);
  const decimals = Number(element.dataset.nmDecimals || 0);
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = (target * eased).toFixed(decimals);
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function nmInitOsInterface() {
  const section = document.querySelector("#nm-os-interface");
  if (!section) return;

  let started = false;
  const counts = section.querySelectorAll(".nm-count");
  const rows = section.querySelectorAll(".nm-fleet-row:not(.nm-fleet-head)");
  const states = ["운영 중", "스캔 중", "충전 중", "대기 중"];

  function startInterface() {
    if (started) return;
    started = true;
    section.classList.add("nm-active");
    counts.forEach((count) => nmAnimateCount(count, 1400));

    window.setInterval(() => {
      rows.forEach((row, index) => {
        const stateCell = row.children[1];
        if (!stateCell) return;
        const current = states[(Date.now() / 2400 + index) % states.length | 0];
        const dotClass = current === "충전 중" ? "nm-state-dot nm-warn" : "nm-state-dot";
        stateCell.innerHTML = `<i class="${dotClass}"></i>${current}`;
      });
    }, 4200);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        startInterface();
        observer.disconnect();
      }
    }, { threshold: 0.28 });
    observer.observe(section);
  } else {
    startInterface();
  }
}

nmInitOsInterface();



function nmInitPlatformTabs() {
  const tabs = document.querySelectorAll("[data-platform-tab]");
  const panels = document.querySelectorAll("[data-platform-panel]");
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.platformTab;
      tabs.forEach((item) => item.classList.toggle("active", item === tab));
      panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.platformPanel === target));
    });
  });
}

nmInitPlatformTabs();

