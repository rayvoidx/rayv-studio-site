(function () {
  'use strict';
  const PATH = '/api/portfolio/reminders';
  async function localApi(path, method = 'GET', body = null) {
    const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || '일정 요청을 완료하지 못했습니다.');
    return data;
  }
  function mount(container, { api = localApi } = {}) {
    if (!container || typeof api !== 'function') throw new Error('일정 관리 화면의 API가 필요합니다.');
    let alive = true;
    let overview = { schedules: [], outbox: [], channel_gates: {} };
    const root = document.createElement('section'); root.className = 'reminder-app';
    const style = document.createElement('style'); style.textContent = '.reminder-app{font:inherit;line-height:1.6}.reminder-app h3{font-size:24px;margin:12px 0}.reminder-app .reminder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 20px}.reminder-app label{display:grid;gap:6px}.reminder-app input,.reminder-app select{font:inherit;min-width:0;max-width:100%;padding:10px;border:1px solid #777;border-radius:8px;background:transparent;color:inherit}.reminder-app button{font:inherit;min-height:44px;padding:10px 14px;border:1px solid #888;border-radius:8px;background:transparent;color:inherit;cursor:pointer}.reminder-app button:disabled{opacity:.45;cursor:default}.reminder-app button:focus-visible,.reminder-app input:focus-visible{outline:3px solid currentColor;outline-offset:3px}.reminder-app .reminder-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.reminder-app .reminder-table{width:100%;border-collapse:collapse}.reminder-app th,.reminder-app td{padding:10px;border-bottom:1px solid #777;text-align:left;vertical-align:top}.reminder-app .reminder-scroll{overflow:auto}.reminder-app pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;margin:12px 0}.reminder-app article{border:1px solid #777;border-radius:12px;padding:18px;margin:12px 0}.reminder-app .reminder-status:empty{display:none}.reminder-app .reminder-status{padding:10px;border-left:3px solid currentColor;white-space:pre-line}.reminder-app small{opacity:.75}.reminder-app .reminder-metrics{display:flex;gap:20px;flex-wrap:wrap;margin:16px 0}.reminder-app .reminder-metrics strong{font-size:24px}.reminder-app details{margin:16px 0}.reminder-app summary{cursor:pointer;min-height:44px;padding:8px 0}@media(max-width:700px){.reminder-app .reminder-grid{grid-template-columns:1fr}.reminder-app table,.reminder-app tbody,.reminder-app tr,.reminder-app td{display:block}.reminder-app thead{display:none}.reminder-app tr{border:1px solid #777;border-radius:10px;margin:12px 0;padding:10px}.reminder-app td{border:0;padding:6px}.reminder-app td:before{content:attr(data-label);display:block;font-size:11px;opacity:.7}.reminder-app .reminder-scroll{overflow:visible}}';
    const heading = document.createElement('h3'); heading.textContent = '수업 일정 · 사전 안내 관리';
    const intro = document.createElement('p'); intro.textContent = '변경된 수업 일정을 고정하고 시작 1시간 이내의 안내 원고를 준비합니다. 학부모·강사 메시지는 전송하지 않습니다. 기존 학원 고객 DB와 분리된 로컬 장부입니다.';
    const status = document.createElement('p'); status.className = 'reminder-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const metrics = document.createElement('div'); metrics.className = 'reminder-metrics';
    const form = document.createElement('form'); form.className = 'reminder-form';
    const grid = document.createElement('div'); grid.className = 'reminder-grid';
    const controls = {};
    const definitions = [
      ['schedule_id', '일정 ID · 변경 시 같은 ID 사용', 'text', 'lesson-001'],
      ['start_at', '수업 시작 · 한국 시간 KST', 'datetime-local', ''],
      ['duration_minutes', '수업 시간 · 분', 'number', '30'],
      ['student_label', '학습자 표시 이름 · 가명 권장', 'text', '학습자 A'],
      ['parent_label', '학부모 표시 이름 · 연락처 입력 불필요', 'text', '보호자 A'],
      ['teacher_label', '강사 고유 표시 이름 · 같은 이름으로 일정 겹침 검사', 'text', 'Teacher A'],
      ['teacher_timezone', '강사 IANA 시간대', 'text', 'Asia/Manila']
    ];
    function defaultID() { return 'lesson-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6); }
    function defaultStart() { return new Date(Date.now() + 2 * 3600000 + 9 * 3600000).toISOString().slice(0, 16); }
    for (const [key, text, type, placeholder] of definitions) {
      const label = document.createElement('label'); const title = document.createElement('span'); title.textContent = text;
      const input = document.createElement('input'); input.name = key; input.type = type; input.required = true;
      input.placeholder = placeholder; input.autocomplete = 'off';
      if (type === 'text') input.maxLength = key === 'teacher_timezone' ? 64 : 80;
      if (type === 'number') { input.min = '1'; input.max = '480'; input.step = '1'; input.value = '30'; }
      if (key === 'teacher_timezone') input.value = 'Asia/Manila';
      if (key === 'start_at') { input.step = '60'; input.value = defaultStart(); }
      if (key === 'schedule_id') { input.pattern = '[A-Za-z0-9][A-Za-z0-9_-]{0,79}'; input.value = defaultID(); }
      controls[key] = input; label.append(title, input); grid.append(label);
    }
    const zones = document.createElement('datalist'); zones.id = 'rayv-reminder-zones';
    ['Asia/Manila', 'Asia/Seoul', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'UTC'].forEach(value => { const option = document.createElement('option'); option.value = value; zones.append(option); });
    controls.teacher_timezone.setAttribute('list', zones.id);
    const formButtons = document.createElement('div'); formButtons.className = 'reminder-toolbar';
    const save = document.createElement('button'); save.type = 'submit'; save.textContent = '일정 저장 / 변경';
    const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = '새 일정 입력';
    clear.onclick = () => { controls.schedule_id.readOnly = false; controls.schedule_id.value = defaultID(); controls.start_at.value = defaultStart(); controls.student_label.value = ''; controls.parent_label.value = ''; status.textContent = '새 일정 ID로 입력합니다. 기존 일정 변경은 아래 변경 버튼을 사용하세요.'; };
    formButtons.append(save, clear); form.append(grid, zones, formButtons);
    const actions = document.createElement('div'); actions.className = 'reminder-toolbar';
    const refresh = document.createElement('button'); refresh.type = 'button'; refresh.textContent = '일정 새로고침';
    const tick = document.createElement('button'); tick.type = 'button'; tick.textContent = '현재 시각으로 안내 원고 준비';
    const download = document.createElement('button'); download.type = 'button'; download.textContent = '일정 · 원고 JSON 내려받기';
    actions.append(refresh, tick, download);
    const tableWrap = document.createElement('div'); tableWrap.className = 'reminder-scroll';
    const table = document.createElement('table'); table.className = 'reminder-table';
    const thead = document.createElement('thead'); const hr = document.createElement('tr');
    ['일정 / 버전', '학습자 / 학부모', '강사', '한국 / 현지 시각', '상태 / 관리'].forEach(text => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; hr.append(th); });
    const tbody = document.createElement('tbody'); thead.append(hr); table.append(thead, tbody); tableWrap.append(table);
    const outboxHeading = document.createElement('h3'); outboxHeading.textContent = '발송 전 검토 원고';
    const outbox = document.createElement('div');
    const gates = document.createElement('details'); const gateTitle = document.createElement('summary'); gateTitle.textContent = '실제 발송 연결에 필요한 별도 설정';
    const gateText = document.createElement('p'); gateText.textContent = '카카오는 공식 비즈니스 알림 경로의 자격·템플릿·수신자 처리·인증을, Messenger는 공식 Page/App 권한·수신자·메시지 적격성을 확인해야 합니다. 개인 계정 자동 발송은 구현하지 않았습니다. 현재 상태는 원고 준비이며 발송 완료가 아닙니다. 백그라운드 실행도 등록하지 않습니다.';
    gates.append(gateTitle, gateText);
    root.append(style, heading, intro, status, metrics, form, actions, tableWrap, outboxHeading, outbox, gates); container.replaceChildren(root);
    async function load() {
      const data = await api(PATH, 'GET'); if (!alive) return;
      if (!data || !Array.isArray(data.schedules) || !Array.isArray(data.outbox)) throw new Error('일정 응답 형식을 확인해 주세요.');
      overview = data; render();
    }
    async function mutate(body, message) {
      const result = await api(PATH, 'POST', body);
      if (!alive) return result;
      await load(); status.textContent = message; return result;
    }
    function td(text, label) { const cell = document.createElement('td'); cell.dataset.label = label; cell.style.whiteSpace = 'pre-line'; cell.textContent = text; return cell; }
    function render() {
      metrics.replaceChildren();
      for (const [name, value] of [['활성 수업', overview.schedules.filter(x => x.status === 'active').length], ['준비 원고', overview.outbox.filter(x => x.status === 'prepared').length], ['대체 원고', overview.outbox.filter(x => x.status === 'superseded').length]]) {
        const metric = document.createElement('div'); const number = document.createElement('strong'); number.textContent = String(value); const label = document.createElement('small'); label.textContent = ' ' + name; metric.append(number, label); metrics.append(metric);
      }
      tbody.replaceChildren();
      if (!overview.schedules.length) { const tr = document.createElement('tr'); const cell = td('아직 일정이 없습니다. 위에서 가명으로 첫 일정을 입력하세요.', '일정'); cell.colSpan = 5; tr.append(cell); tbody.append(tr); }
      for (const row of overview.schedules) {
        const tr = document.createElement('tr');
        tr.append(td(row.schedule_id + '\nr' + row.revision, '일정 / 버전'), td(row.student_label + '\n' + row.parent_label, '학습자 / 학부모'), td(row.teacher_label, '강사'), td(row.korea_time + '\n' + row.teacher_local_time, '한국 / 현지 시각'));
        const manage = td(row.status === 'cancelled' ? '취소' : '활성', '상태 / 관리');
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = row.status === 'cancelled' ? '다시 예약' : '변경';
        edit.onclick = () => { for (const key of Object.keys(controls)) if (key !== 'start_at') controls[key].value = row[key]; controls.start_at.value = new Date(new Date(row.start_at).getTime() + 9 * 3600000).toISOString().slice(0, 16); controls.schedule_id.readOnly = true; controls.start_at.focus(); status.textContent = row.schedule_id + '의 같은 ID로 저장하면 새 버전으로 고정됩니다.'; form.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = '취소'; cancel.disabled = row.status === 'cancelled';
        cancel.onclick = async () => { cancel.disabled = true; try { await mutate({ action: 'cancel', schedule_id: row.schedule_id }, '일정을 취소하고 기존 준비 원고를 대체 처리했습니다.'); } catch (error) { status.textContent = error.message; cancel.disabled = false; } };
        const buttons = document.createElement('div'); buttons.className = 'reminder-toolbar'; buttons.append(edit, cancel); manage.append(buttons); tr.append(manage); tbody.append(tr);
      }
      outbox.replaceChildren();
      if (!overview.outbox.length) { const empty = document.createElement('p'); empty.textContent = '준비한 원고가 없습니다. 수업 시작까지 1시간 이내일 때 원고 준비를 실행하세요.'; outbox.append(empty); }
      for (const draft of [...overview.outbox].reverse()) {
        const card = document.createElement('article'); const title = document.createElement('strong');
        title.textContent = (draft.audience === 'parent' ? '학부모 · 한국어' : '강사 · English') + ' / ' + draft.schedule_id + ' r' + draft.revision;
        const expired = Date.now() >= new Date(draft.start_at).getTime();
        const meta = document.createElement('p'); meta.textContent = draft.status === 'prepared' ? (expired ? '수업 시작이 지난 원고 · 원고 준비를 다시 실행하세요' : '준비 원고 · 발송 안 됨') : '대체된 원고 · 현재 일정에 사용하지 마세요';
        meta.textContent += ' · 준비 시각: ' + new Date(draft.prepared_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) + ' KST';
        const body = document.createElement('pre'); body.textContent = draft.body;
        const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = '원고 복사'; copy.disabled = draft.status !== 'prepared' || expired;
        copy.onclick = async () => { try { if (!navigator.clipboard) throw new Error('이 브라우저에서는 본문을 직접 선택해 복사하세요.'); await navigator.clipboard.writeText(draft.body); status.textContent = '원고를 복사했습니다. 실제 발송 전 시간과 수신자를 확인하세요.'; } catch (error) { status.textContent = error.message; } };
        card.append(title, meta, body, copy); outbox.append(card);
      }
    }
    form.addEventListener('submit', async event => {
      event.preventDefault(); save.disabled = true;
      try {
        const body = { action: 'upsert' };
        for (const [key, control] of Object.entries(controls)) body[key] = control.value.trim();
        body.start_at += '+09:00'; body.duration_minutes = Number(body.duration_minutes);
        await mutate(body, '일정을 저장했습니다. 변경 전 준비 원고는 대체 처리됩니다.');
      } catch (error) { status.textContent = error.message; }
      finally { save.disabled = false; }
    });
    refresh.onclick = async () => { try { await load(); status.textContent = '로컬 장부를 새로 읽었습니다.'; } catch (error) { status.textContent = error.message; } };
    tick.onclick = async () => { tick.disabled = true; try { await mutate({ action: 'tick' }, '현재 시각의 수업을 확인했습니다. 준비 원고만 만들며 메시지는 보내지 않습니다.'); } catch (error) { status.textContent = error.message; } finally { tick.disabled = false; } };
    download.onclick = async () => { try { await load(); const blob = new Blob([JSON.stringify(overview, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'rayv-class-reminders.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = '현재 일정과 준비 원고를 JSON으로 저장했습니다.'; } catch (error) { status.textContent = error.message; } };
    load().catch(error => { if (alive) status.textContent = error.message; });
    return { refresh: load, destroy() { alive = false; if (root.parentElement === container) root.remove(); } };
  }
  window.PortfolioReminders = { mount };
})();
