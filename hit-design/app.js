(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab, focus = false) => {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    if (focus) tab.focus();
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const i = tabs.indexOf(tab);
      const next = {ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1}[event.key];
      if (next !== undefined) {event.preventDefault(); select(tabs[next], true);}
    });
  }
  for (const button of document.querySelectorAll('button[data-mode]')) {
    button.addEventListener('click', () => {
      document.body.dataset.mode = button.dataset.mode;
      for (const other of document.querySelectorAll('button[data-mode]')) other.setAttribute('aria-pressed', String(other === button));
    });
  }
})();
