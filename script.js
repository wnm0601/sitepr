import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByGAmwh3wdEDMaeyUm3rQw7eJCXUMS5cc",
  authDomain: "sitepre-95adc.firebaseapp.com",
  projectId: "sitepre-95adc",
  storageBucket: "sitepre-95adc.firebasestorage.app",
  messagingSenderId: "112022806733",
  appId: "1:112022806733:web:81f0f04a842233959b4984"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

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

const categoryMap = {
  "Robotics": "프로젝트 공유",
  "Vision AI": "기술 질문",
  "Sensor Data": "기술 질문",
  "Consulting": "아이디어 제안",
  "Maintenance": "기술 질문",
  "로봇 자동화": "프로젝트 공유",
  "비전 AI": "기술 질문",
  "센서 데이터": "기술 질문",
  "도입 상담": "아이디어 제안",
  "AI 고장 예측": "기술 질문"
};

let posts = [];
let unsubscribePosts = null;
let boardReady = false;

function normalizeCategory(category) {
  return categoryMap[category] || category || "기술 질문";
}

function translateSavedText(value) {
  return String(value ?? "")
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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatPostDate(value) {
  if (!value) return "방금 전";
  try {
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "방금 전";
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch (error) {
    return "방금 전";
  }
}

function showBoardMessage(message) {
  if (postList) {
    postList.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }
}

function renderPosts() {
  if (!postList || !postCount || !postSearch || !categoryFilter) return;
  const keyword = postSearch.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedNormalizedCategory = normalizeCategory(selectedCategory);
  const filtered = posts.filter((post) => {
    const category = normalizeCategory(post.category);
    const matchesKeyword = `${post.title} ${post.body} ${category}`.toLowerCase().includes(keyword);
    const matchesCategory = selectedCategory === "all" || category === selectedCategory || category === selectedNormalizedCategory;
    return matchesKeyword && matchesCategory;
  });

  postCount.textContent = `게시글 ${filtered.length}개`;

  if (!filtered.length) {
    postList.innerHTML = '<div class="empty-state">검색 조건에 맞는 게시글이 없습니다.</div>';
    return;
  }

  postList.innerHTML = filtered.map((post) => {
    const category = normalizeCategory(post.category);
    const fileText = post.fileName ? `첨부: ${escapeHtml(post.fileName)}` : "첨부 파일 없음";
    const createdAt = formatPostDate(post.createdAt);

    return `
      <article class="post-card" data-post-id="${escapeHtml(post.id)}">
        <div class="post-meta">
          <span class="category-pill">${escapeHtml(category)}</span>
          <span>${escapeHtml(createdAt)}</span>
          <span>${fileText}</span>
        </div>
        <h3>${escapeHtml(translateSavedText(post.title))}</h3>
        <p>${escapeHtml(translateSavedText(post.body))}</p>
      </article>
    `;
  }).join("");
}

function subscribePosts() {
  if (!postList || unsubscribePosts) return;
  showBoardMessage("게시글을 불러오는 중입니다...");
  const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
    posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      category: normalizeCategory(doc.data().category)
    }));
    boardReady = true;
    renderPosts();
  }, (error) => {
    console.error("게시글 조회 실패:", error);
    showBoardMessage("게시글을 불러오지 못했습니다. Firebase 설정과 보안 규칙을 확인해주세요.");
  });
}

async function initializeFirebaseBoard() {
  if (!postList) return;
  showBoardMessage("Firebase 게시판에 연결하는 중입니다...");
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        subscribePosts();
      }
    });
    await signInAnonymously(auth);
  } catch (error) {
    console.error("익명 로그인 실패:", error);
    showBoardMessage("익명 로그인이 실패했습니다. Firebase Authentication의 Anonymous 사용 설정을 확인해주세요.");
  }
}

function openModal() {
  if (!postModal || !postForm) return;
  postModal.classList.add("open");
  postModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("postTitle")?.focus();
}

function closeModal() {
  if (!postModal || !postForm) return;
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

const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

revealItems.forEach((element) => revealObserver.observe(element));

window.setTimeout(() => {
  revealItems.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      element.classList.add("visible");
    }
  });
}, 120);

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

if (postForm) postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const titleInput = document.getElementById("postTitle");
  const categoryInput = document.getElementById("postCategory");
  const bodyInput = document.getElementById("postBody");
  const fileInput = document.getElementById("postFile");
  const submitButton = postForm.querySelector('button[type="submit"]');

  const title = titleInput?.value.trim() || "";
  const category = categoryInput?.value || "기술 질문";
  const body = bodyInput?.value.trim() || "";
  const file = fileInput?.files?.[0];

  if (!title || !body) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  if (!auth.currentUser) {
    alert("Firebase 로그인 연결 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "저장 중...";
    }

    await addDoc(collection(db, "posts"), {
      title,
      category,
      body,
      fileName: file ? file.name : "",
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    closeModal();
  } catch (error) {
    console.error("게시글 저장 실패:", error);
    alert("게시글 저장에 실패했습니다. Firestore Rules와 네트워크 상태를 확인해주세요.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "게시글 저장";
    }
  }
});

if (postSearch) postSearch.addEventListener("input", renderPosts);
if (categoryFilter) categoryFilter.addEventListener("change", renderPosts);

if (resetDemoPosts) {
  resetDemoPosts.textContent = "새로고침";
  resetDemoPosts.addEventListener("click", () => {
    if (postSearch) postSearch.value = "";
    if (categoryFilter) categoryFilter.value = "all";
    renderPosts();
  });
}

if (fileDemo) fileDemo.addEventListener("change", () => {
  const file = fileDemo.files[0];
  fileDemoName.textContent = file ? `${file.name} 선택됨` : "이미지, 자료, 로그 파일을 첨부할 수 있습니다.";
});

if (contactForm) contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "문의가 접수된 것처럼 표시됩니다. 실제 전송 기능은 백엔드 연동 시 활성화됩니다.";
  contactForm.reset();
});

initializeFirebaseBoard();

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

function nmFastScroll(delta) {
  if (!delta || document.querySelector(".modal.open")) return;
  const scroller = document.scrollingElement || document.documentElement;
  const max = Math.max(0, scroller.scrollHeight - window.innerHeight);
  scroller.scrollTop = Math.max(0, Math.min(max, scroller.scrollTop + delta));
}

window.addEventListener("wheel", (event) => {
  if (document.querySelector(".modal.open")) return;
  event.preventDefault();
  nmFastScroll(event.deltaY * 0.9);
}, { passive: false, capture: true });

let nmFastTouchY = 0;
window.addEventListener("touchstart", (event) => {
  nmFastTouchY = event.touches[0]?.clientY || 0;
}, { passive: true, capture: true });

window.addEventListener("touchmove", (event) => {
  if (document.querySelector(".modal.open")) return;
  const current = event.touches[0]?.clientY || nmFastTouchY;
  nmFastScroll((nmFastTouchY - current) * 2.2);
  nmFastTouchY = current;
}, { passive: true, capture: true });




