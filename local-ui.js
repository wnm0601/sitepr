/* Local UI fallback for NeuraMotion AI
   Keeps hero/menu/accordion animations working even if remote Firebase module imports are blocked. */
(function () {
  if (window.__nmLocalUiLoaded) return;
  window.__nmLocalUiLoaded = true;

  function initHeroCycle() {
    if (window.__nmHeroCycleActive) return;
    const hero = document.querySelector('[data-smart-main-hero]');
    if (!hero) return;

    const status = hero.querySelector('#smartHeroStatus');
    const core = hero.querySelector('#smartHeroCore');
    const nodes = Array.from(hero.querySelectorAll('[data-smart-step]'));
    const minis = Array.from(hero.querySelectorAll('[data-smart-mini]'));
    if (!status || !core || !nodes.length) return;

    window.__nmHeroCycleActive = true;

    const steps = [
      { text: '<b>카메라·센서 데이터</b>로 현장을 인식합니다.', core: 'Collect' },
      { text: '<b>AI 비전</b>이 작업 대상을 판정합니다.', core: 'Inspect' },
      { text: '<b>로봇 제어</b>로 반복 작업을 실행합니다.', core: 'Execute' },
      { text: '<b>운영 플랫폼</b>에서 상태를 관리합니다.', core: 'Optimize' }
    ];

    let index = 0;
    let timer = 0;

    function render(next, instant) {
      index = ((next % steps.length) + steps.length) % steps.length;
      const update = function () {
        status.innerHTML = steps[index].text;
        core.textContent = steps[index].core;
        nodes.forEach(function (node, nodeIndex) {
          node.classList.toggle('active', nodeIndex === index);
        });
        minis.forEach(function (mini, miniIndex) {
          mini.classList.toggle('on', miniIndex === index);
        });
        status.style.opacity = '1';
        status.style.transform = 'translateY(0)';
      };

      if (instant) {
        update();
        return;
      }

      status.style.opacity = '0';
      status.style.transform = 'translateY(8px)';
      window.setTimeout(update, 180);
    }

    function start() {
      if (timer) return;
      timer = window.setInterval(function () {
        render(index + 1, false);
      }, 2600);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = 0;
    }

    nodes.forEach(function (node, nodeIndex) {
      node.style.cursor = 'pointer';
      node.addEventListener('click', function () {
        render(nodeIndex, false);
      });
    });

    render(0, true);
    start();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
  }

  function initNavDropdowns() {
    if (window.__nmNavDropdownActive) return;
    const groups = document.querySelectorAll('.nav-group');
    if (!groups.length) return;
    window.__nmNavDropdownActive = true;

    groups.forEach(function (group) {
      const toggle = group.querySelector('.nav-group-toggle');
      const dropdown = group.querySelector('.nav-dropdown');
      if (!toggle || !dropdown) return;

      toggle.addEventListener('click', function (event) {
        const isMobile = window.innerWidth <= 1080;
        if (!isMobile) return;
        event.preventDefault();
        const isOpen = dropdown.style.display === 'flex';
        dropdown.style.display = isOpen ? 'none' : 'flex';
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) {
        document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
          dropdown.style.display = '';
        });
        document.querySelectorAll('.nav-group-toggle').forEach(function (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });

    document.querySelectorAll('.nav-dropdown a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
          dropdown.style.display = '';
        });
      });
    });
  }

  function initAccordionCards() {
    if (window.__nmAccordionCardsActive) return;
    const groups = document.querySelectorAll('[data-accordion-group]');
    if (!groups.length) return;
    window.__nmAccordionCardsActive = true;

    function closeCard(card) {
      const trigger = card.querySelector('.accordion-card-trigger');
      const panel = card.querySelector('.accordion-panel');
      if (!trigger || !panel) return;
      card.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        if (!card.classList.contains('open')) panel.hidden = true;
      }, 340);
    }

    function openCard(card) {
      const trigger = card.querySelector('.accordion-card-trigger');
      const panel = card.querySelector('.accordion-panel');
      if (!trigger || !panel) return;
      panel.hidden = false;
      window.requestAnimationFrame(function () {
        card.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      });
    }

    groups.forEach(function (group) {
      const cards = Array.from(group.querySelectorAll('.accordion-card'));
      cards.forEach(function (card) {
        const trigger = card.querySelector('.accordion-card-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', function () {
          const isOpen = card.classList.contains('open');
          cards.forEach(function (item) {
            if (item !== card) closeCard(item);
          });
          if (isOpen) closeCard(card);
          else openCard(card);
        });
      });
    });
  }

  function initCompactProcess() {
    if (window.__nmCompactProcessActive) return;
    const pills = Array.from(document.querySelectorAll('[data-process-target]'));
    const panels = Array.from(document.querySelectorAll('[data-process-panel]'));
    if (!pills.length || !panels.length) return;
    window.__nmCompactProcessActive = true;

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        const target = pill.dataset.processTarget;
        pills.forEach(function (item) {
          item.classList.toggle('active', item === pill);
        });
        panels.forEach(function (panel) {
          const active = panel.dataset.processPanel === target;
          panel.hidden = !active;
          panel.classList.toggle('active', active);
        });
      });
    });
  }

  function init() {
    initHeroCycle();
    initNavDropdowns();
    initAccordionCards();
    initCompactProcess();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
