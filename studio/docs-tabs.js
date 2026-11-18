/* 07·08 문서 탭 — /studio-plan/ 과 venture-os-v3 를 대시보드 안 iframe 으로 열고,
   서버가 알려주는 파일 mtime(/api/studio/docs-revision)이 바뀌면 그 iframe 만 바로 새로고침한다.
   noir.js 가 window.switchTab 을 먼저 감싸므로(defer 순서) 여기서는 그 결과를 다시 감싼다. */
(() => {
  const VIEWS = {
    plan: { frame: 'plan-frame', src: '/studio-plan/?embed=1' },
    venture: { frame: 'venture-frame', src: '/docs/operating-plan/venture-os-v3/index.html?embed=1' },
  };
  const seen = {};
  const prev = window.switchTab;
  window.switchTab = (tab) => {
    prev(tab);
    const view = VIEWS[tab];
    if (!view) return;
    const frame = document.getElementById(view.frame);
    if (frame && !frame.getAttribute('src')) frame.src = view.src; // 처음 열 때만 로드
    // 문서 탭은 히어로 아래에 있어 전환만으로는 안 보인다 — 탭 머리로 내려간다(.tab-content 의 scroll-margin 이 고정 헤더를 피한다)
    document.getElementById(tab + '-tab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  function stamp(key, t) {
    const el = document.querySelector(`[data-doc-updated="${key}"]`);
    if (el && t) el.textContent = '· 소스 갱신 ' + new Date(t * 1000).toLocaleString('ko-KR', { hour12: false });
  }
  async function poll() {
    let rev;
    try {
      const r = await fetch('/api/studio/docs-revision', { cache: 'no-store' });
      if (!r.ok) return;
      rev = await r.json();
    } catch { return; }
    for (const key in VIEWS) {
      const t = rev[key];
      if (seen[key] !== undefined && t !== seen[key]) {
        const frame = document.getElementById(VIEWS[key].frame);
        if (frame && frame.getAttribute('src')) frame.contentWindow?.location.reload();
      }
      seen[key] = t;
      stamp(key, t);
    }
  }
  poll();
  setInterval(poll, 3000);
  if (location.hash === '#plan' || location.hash === '#venture') window.switchTab(location.hash.slice(1));
})();
