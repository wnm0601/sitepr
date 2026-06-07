const buttons = document.querySelectorAll('.tabs-nav button');
const panels = document.querySelectorAll('.tabs-panel');
buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.panel;
    buttons.forEach((item) => item.classList.toggle('active', item === button));
    panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === target));
  });
});