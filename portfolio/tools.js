/* Editable, local product workbenches. Submission delegates to the local host. */
(function (root) {
  'use strict';
  const exampleHash = '9bbccce53718c7213570c964f4b5f89bc57316b4923c97ec002db755897c2d8f';
  const specs = {
    research: {
      title: '근거 브리프 · 출처와 주장을 연결하기',
      notice: '입력한 출처를 조회하거나 사실을 추론하지 않습니다. 원문 대조 상태는 미검증으로 기록합니다.',
      fields: [
        ['title', '브리프 제목', 'text', '한 문제를 검토하는 근거 브리프'],
        ['audience', '대상 독자', 'text', '한 가지 운영 결정을 앞둔 소규모 팀'],
        ['question', '검토할 질문', 'textarea', '어떤 조건과 한계를 확인한 뒤 이 자료를 사용할 것인가?'],
        ['sources', '원문 목록 · ID | 제목 | HTTPS URL | 확인일', 'textarea', 'S1 | 직접 대조할 원문 예시 | https://example.org/source | 2026-11-06'],
        ['claims', '주장 목록 · ID | 직접 입력한 주장 | 출처 ID(쉼표 구분)', 'textarea', 'C1 | 원문을 읽은 뒤 해당 자료로 뒷받침되는 문장을 여기에 입력하세요. | S1'],
      ],
    },
    affiliate: {
      title: '제휴 비교 · 고지와 순기여 가정',
      notice: '가격·계약·주문·지급은 미확인입니다. 비교 항목의 예상 수익을 동시에 발생한 매출로 합산하지 않습니다.',
      fields: [
        ['title', '비교 제목', 'text', '작업 도구 비교 초안'],
        ['currency', '같은 통화로 비교 · 환산 없음', 'select', 'KRW', ['KRW', 'USD']],
        ['orders', '항목별 가정 주문 수 · 실제 주문 아님', 'number', '0', [0, 10000, 1]],
        ['disclosure', '독자에게 표시할 제휴 고지 초안', 'textarea', '제휴 링크를 통한 구매가 발생하면 수수료를 받을 수 있습니다. 가격·조건과 제휴 계약은 확인 전입니다.'],
        ['items', '비교표 · 이름 | URL | 가격 | 수수료% | 건당비용 | 환불%', 'textarea', '도구 A 예시 | https://example.org/tool-a | 20000 | 5 | 100 | 10\n도구 B 예시 | https://example.org/tool-b | 30000 | 4 | 100 | 10'],
      ],
    },
    audio: {
      title: '음악 IP · 음열에서 MIDI와 미리듣기 만들기',
      notice: '입력한 음열을 순서대로 반복하는 단순 합성음입니다. 사람의 작곡·실연이나 권리 확보를 주장하지 않습니다. 미리듣기는 최대 6초입니다.',
      fields: [
        ['title', '프로젝트 제목', 'text', '작은 움직임 · 시퀀스 초안'],
        ['bpm', '템포 · BPM', 'number', '96', [40, 240, 1]],
        ['duration_seconds', 'MIDI 계획 길이 · 초', 'number', '8', [1, 30, 0.1]],
        ['notes', 'MIDI 음 번호 · 48–84, 쉼표 또는 공백으로 구분', 'textarea', '60, 64, 67, 72, 67, 64, 62, 60'],
      ],
    },
    persona: {
      title: '가상 인물 캠페인 · 연속성과 광고 고지',
      notice: '성인 가상 인물의 제작 설계입니다. 이미지·영상·계정·광고를 생성하거나 게시하지 않습니다.',
      fields: [
        ['campaign', '캠페인 제목', 'text', '작업 시작 전 책상 정리'],
        ['character', '성인 인물 · 나이 | 외형·의상·말투', 'textarea', '28 | 성인 가상 캐릭터. 짧은 검은 머리, 흰 셔츠, 차분한 말투.'],
        ['product', '제품·주제 · 실제 체험담은 확인 후', 'text', '가상의 수납 트레이'],
        ['disclosure', '가상 인물·광고 고지 초안', 'textarea', '가상 인물·광고 기획 초안. 실제 인물의 경험 또는 체결된 후원 계약을 주장하지 않습니다.'],
        ['shots', '콘티 · 장면 | 카메라 | 이전 컷과 대조할 설정', 'textarea', '정리 전 책상 전체를 보여 준다. | 고정 와이드 · 3초 | 흰 셔츠, 왼쪽 창문, 동일한 책상\n트레이에 작은 물건을 분류한다. | 손 디테일 · 천천히 돌리 인 | 제품 색상과 손 위치를 이전 컷과 대조\n정리 후 전체와 고지 문구를 보여 준다. | 첫 컷과 같은 고정 와이드 | 실제 성능·체험담·가격은 검증 전 사용하지 않음'],
      ],
    },
    subtitles: {
      title: '자막 납품 · 제공된 번역과 시간표 정리',
      notice: '번역을 자동 생성하지 않습니다. 입력한 원문·번역을 SRT와 대응표로 만들며, 실제 영상 동기화·번역 검수는 별도입니다.',
      fields: [
        ['title', '자막 프로젝트 제목', 'text', '작업 안내 자막'],
        ['language', '제공된 번역 언어', 'select', 'en', ['en', 'ko', 'ja', 'es', 'fr', 'de']],
        ['cues', '시간표 · 시작 | 종료 | 원문 | 제공된 번역', 'textarea', '00:00:00,000 | 00:00:02,000 | 예제 파일을 열어 보세요. | Open the example file.\n00:00:02,000 | 00:00:04,000 | 입력과 결과를 비교하세요. | Compare the input and the result.'],
      ],
    },
    drama: {
      title: '단편 영상 · 장면과 렌더 입력 설계',
      notice: '완성 영상이 아닌 콘티와 렌더 manifest를 만듭니다. 기존 로컬 영상 백엔드·장비·권리·실제 AV 검수 전 실행은 보류합니다.',
      fields: [
        ['title', '작품 제목', 'text', '문 앞의 메모'],
        ['logline', '한 줄 이야기', 'textarea', '작업실을 정리하던 인물이 자신이 남긴 메모를 발견하고 작은 약속을 실천한다.'],
        ['format', '화면비', 'select', '9:16', ['9:16', '16:9']],
        ['scenes', '장면표 · 장소 | 행동 | 대사 | 카메라 | 초', 'textarea', '작업실 입구 | 성인 주인공이 문 옆 메모를 발견한다. | 오늘은 하나만 끝내자. | 고정 미디엄 | 5\n같은 작업실 책상 | 남은 종이 한 장을 정리하고 창을 연다. | 작은 일부터. | 손 디테일에서 천천히 틸트 업 | 5'],
      ],
    },
    preflight: {
      title: '납품 전 점검 · 파일 출처와 검수 기록',
      notice: '입력한 메타데이터를 정리합니다. 실제 파일을 읽어 해시를 재계산하거나 AI 탐지·진위·권리·출시 적격성을 보장하지 않습니다.',
      fields: [
        ['title', '검토 제목', 'text', '출시 전 파일 검토'],
        ['files', '파일 목록 · 상대 경로 | SHA256 | 바이트 | 출처', 'textarea', 'example.txt | ' + exampleHash + ' | 23 | 직접 입력한 예제 메타데이터. 실제 파일의 해시를 별도로 대조하세요.'],
        ['checklist', '검수 진술 · 항목 | pending / passed / failed', 'textarea', '출처와 사용 권리 확인 | pending\n최종 크기에서 실제 사용·청취 검수 | pending'],
      ],
    },
  };
  function text(value, name, max = 2000) {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b-\u001f]/.test(value)) {
      throw Error(name + ': 비어 있지 않은 허용 길이의 내용을 입력하세요.');
    }
    return value.trim();
  }
  function number(value, name, low, high, integer = false) {
    if (typeof value === 'string' && !value.trim()) throw Error(name + ': 숫자를 입력하세요.');
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n) || n < low || n > high || (integer && !Number.isInteger(n))) {
      throw Error(name + ': 숫자 범위를 확인하세요.');
    }
    return n;
  }
  function url(value) {
    value = text(value, 'URL', 2048);
    let parsed;
    try { parsed = new URL(value); } catch (_) { throw Error('올바른 HTTPS URL을 입력하세요.'); }
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || /\s|\\/.test(value)) {
      throw Error('인증정보가 없는 HTTPS URL을 입력하세요.');
    }
    return value;
  }
  function lines(value, count, name, max = 30, min = 1) {
    const rows = text(value, name, 60000).split('\n').filter(line => line.trim()).map((line, i) => {
      const cells = line.split('|').map(s => s.trim());
      if (cells.length !== count || cells.some(s => !s)) throw Error(name + ' ' + (i + 1) + '행: | 구분과 빈 칸을 확인하세요.');
      return cells;
    });
    if (rows.length < min || rows.length > max) throw Error(name + ': ' + min + '–' + max + '행을 입력하세요.');
    return rows;
  }
  function identifier(value) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(value)) throw Error('참조 ID는 영문자로 시작하는 40자 이하 식별자여야 합니다.');
    return value;
  }
  function srtTime(value) {
    if (!/^\d{2}:[0-5]\d:[0-5]\d,\d{3}$/.test(value)) throw Error('시간은 HH:MM:SS,mmm 형식으로 입력하세요.');
    const [h, m, s, ms] = value.split(/[:,]/).map(Number);
    const result = ((h * 60 + m) * 60 + s) * 1000 + ms;
    if (result > 3600000) throw Error('자막 시간표는 1시간 이내로 입력하세요.');
    return result;
  }
  function defaults(kind) {
    if (!Object.hasOwn(specs, kind)) throw Error('지원하지 않는 작업기입니다.');
    return Object.fromEntries(specs[kind].fields.map(([key, , , value]) => [key, value]));
  }
  function parse(kind, fields) {
    if (!Object.hasOwn(specs, kind) || !fields || typeof fields !== 'object') throw Error('지원하지 않는 작업 입력입니다.');
    const title = kind === 'persona' ? undefined : text(fields.title, '제목', 160);
    if (kind === 'research') {
      const sources = lines(fields.sources, 4, '출처', 30).map(([id, name, link, date]) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw Error('확인일은 실제 YYYY-MM-DD 날짜로 입력하세요.');
        return {id: identifier(id), title: text(name, '출처 제목', 300), url: url(link), date};
      });
      const ids = new Set(sources.map(s => s.id));
      if (ids.size !== sources.length) throw Error('출처 ID가 중복되었습니다.');
      const claims = lines(fields.claims, 3, '주장', 60).map(([id, claim, refs]) => {
        const source_ids = refs.split(',').map(s => s.trim());
        if (new Set(source_ids).size !== source_ids.length || source_ids.some(s => !ids.has(s))) throw Error('주장의 출처 ID가 원문 목록과 일치하지 않습니다.');
        return {id: identifier(id), text: text(claim, '주장', 2000), source_ids};
      });
      if (new Set(claims.map(c => c.id)).size !== claims.length) throw Error('주장 ID가 중복되었습니다.');
      return {title, audience: text(fields.audience, '대상 독자', 500), question: text(fields.question, '질문', 1000), sources, claims};
    }
    if (kind === 'affiliate') {
      if (!['KRW', 'USD'].includes(fields.currency)) throw Error('비교 통화를 선택하세요.');
      const items = lines(fields.items, 6, '비교표', 12, 2).map(([name, link, price, commission, cost, refund]) => ({
        name: text(name, '항목 이름', 160), url: url(link), price: number(price, '가격', 0, 10000000),
        commission_percent: number(commission, '수수료%', 0, 100), cost_per_order: number(cost, '건당비용', 0, 10000000),
        refund_percent: number(refund, '환불%', 0, 100),
      }));
      return {title, currency: fields.currency, orders: number(fields.orders, '주문 가정', 0, 10000, true), disclosure: text(fields.disclosure, '고지', 1500), items};
    }
    if (kind === 'audio') {
      const notes = text(fields.notes, '음열', 1000).split(/[\s,]+/).map(v => number(v, 'MIDI 음 번호', 48, 84, true));
      if (!notes.length || notes.length > 64) throw Error('음열은 1–64개 음으로 입력하세요.');
      return {title, bpm: number(fields.bpm, 'BPM', 40, 240, true), duration_seconds: number(fields.duration_seconds, '길이', 1, 30), notes};
    }
    if (kind === 'persona') {
      const [age, character] = lines(fields.character, 2, '성인 인물', 1)[0];
      return {campaign: text(fields.campaign, '캠페인 제목', 160), character: text(character, '인물 설정', 2000),
        adult_age: number(age, '성인 나이', 18, 100, true), product: text(fields.product, '제품', 300),
        disclosure: text(fields.disclosure, '고지', 1500), shots: lines(fields.shots, 3, '콘티', 12)
          .map(([scene, camera, continuity]) => ({scene: text(scene, '장면', 1500), camera: text(camera, '카메라', 1500), continuity: text(continuity, '연속성', 1500)}))};
    }
    if (kind === 'subtitles') {
      if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(fields.language)) throw Error('번역 언어 코드를 확인하세요.');
      let previous = 0;
      const cues = lines(fields.cues, 4, '자막', 200).map(([start, end, source_text, target]) => {
        const a = srtTime(start), b = srtTime(end);
        if (b <= a || a < previous) throw Error('자막의 시작·종료 순서와 겹침을 확인하세요.');
        if (target.includes('-->')) throw Error('자막 본문에 시간 화살표를 넣지 마세요.');
        previous = b;
        return {start, end, source_text: text(source_text, '원문', 1200), text: text(target, '제공된 번역', 1200)};
      });
      return {title, language: fields.language, cues};
    }
    if (kind === 'drama') {
      if (!['9:16', '16:9'].includes(fields.format)) throw Error('화면비를 선택하세요.');
      const scenes = lines(fields.scenes, 5, '장면표', 12).map(([location, action, dialogue, camera, duration]) => ({
        location: text(location, '장소'), action: text(action, '행동'), dialogue: text(dialogue, '대사'), camera: text(camera, '카메라'),
        duration_seconds: number(duration, '장면 길이', 1, 30),
      }));
      if (scenes.reduce((n, scene) => n + scene.duration_seconds, 0) > 180) throw Error('전체 장면은 180초 이내로 구성하세요.');
      return {title, logline: text(fields.logline, '이야기', 1500), format: fields.format, scenes};
    }
    const files = lines(fields.files, 4, '파일 목록', 100).map(([name, sha256, bytes, provenance]) => {
      if (name.startsWith('/') || /[\\:]/.test(name) || name.split('/').some(part => ['', '.', '..'].includes(part))) throw Error('파일은 경로 이탈이 없는 상대 경로로 입력하세요.');
      if (!/^[a-f0-9]{64}$/.test(sha256)) throw Error('SHA256은 소문자 16진수 64자로 입력하세요.');
      return {name: text(name, '파일 경로', 200), sha256, bytes: number(bytes, '바이트', 0, 536870912, true), provenance: text(provenance, '출처', 2000)};
    });
    if (new Set(files.map(f => f.name)).size !== files.length) throw Error('파일 경로가 중복되었습니다.');
    const checklist = lines(fields.checklist, 2, '검수 목록', 30).map(([item, status]) => {
      if (!['pending', 'passed', 'failed'].includes(status)) throw Error('검수 진술은 pending / passed / failed 중 선택하세요.');
      return {item: text(item, '검수 항목', 1000), status};
    });
    return {title, files, checklist};
  }
  let serial = 0;
  function mount(container, {kind, onSubmit}) {
    if (!container || typeof container.replaceChildren !== 'function' || !Object.hasOwn(specs, kind) || typeof onSubmit !== 'function') {
      throw Error('작업기 종류·호스트·제출 동작을 확인하세요.');
    }
    const document = container.ownerDocument, spec = specs[kind], controls = new Map();
    const form = document.createElement('form'); form.className = 'portfolio-tool-form'; form.noValidate = true;
    const heading = document.createElement('h3'); heading.textContent = spec.title;
    const notice = document.createElement('p'); notice.className = 'portfolio-tool-hint'; notice.textContent = spec.notice;
    const grid = document.createElement('div'); grid.className = 'portfolio-tool-fields';
    for (const [key, label, type, value, options] of spec.fields) {
      const wrapper = document.createElement('label'); wrapper.className = 'portfolio-tool-field';
      const name = document.createElement('span'); name.textContent = label;
      const input = document.createElement(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
      input.id = 'portfolio-input-' + (++serial); input.name = key; input.required = true;
      wrapper.htmlFor = input.id;
      if (type === 'select') {
        for (const option of options) { const element = document.createElement('option'); element.value = option; element.textContent = option; input.append(element); }
      } else if (type === 'textarea') { input.rows = ['sources', 'claims', 'shots', 'cues', 'scenes', 'files', 'items'].includes(key) ? 5 : 3; input.maxLength = 60000; }
      else { input.type = type; if (type === 'number') [input.min, input.max, input.step] = options.map(String); else input.maxLength = 1000; }
      input.value = value; wrapper.append(name, input); grid.append(wrapper); controls.set(key, input);
    }
    const actions = document.createElement('div'); actions.className = 'portfolio-tool-actions';
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = '로컬 작업 패키지 만들기';
    const preset = document.createElement('button'); preset.type = 'button'; preset.textContent = '예제로 채우기';
    const error = document.createElement('p'); error.className = 'portfolio-tool-error'; error.setAttribute('role', 'alert'); error.hidden = true;
    const status = document.createElement('p'); status.className = 'portfolio-tool-status'; status.setAttribute('role', 'status'); status.textContent = '입력을 편집한 뒤 패키지를 생성하세요. 파일과 검수 상태를 함께 확인할 수 있습니다.';
    const read = () => {
      for (const input of controls.values()) if (!input.checkValidity() || !input.value.trim()) throw Error('빈 칸과 숫자 범위를 확인하세요.');
      return parse(kind, Object.fromEntries([...controls].map(([key, input]) => [key, input.value])));
    };
    const reset = () => { for (const [key, value] of Object.entries(defaults(kind))) controls.get(key).value = value; error.hidden = true; status.textContent = '예제입니다. 출처·권리·실제 사용 검수는 미확인입니다.'; };
    preset.addEventListener('click', reset);
    form.addEventListener('submit', async event => {
      event.preventDefault(); error.hidden = true;
      try {
        const payload = read(); submit.disabled = true; preset.disabled = true;
        status.textContent = '로컬에서 작업 패키지를 구성하고 있습니다…';
        await onSubmit(payload);
        status.textContent = '패키지를 구성했습니다. 결과 파일과 미검증 항목을 확인하세요. 게시·과금은 실행하지 않았습니다.';
      } catch (err) { error.hidden = false; error.textContent = err.message || String(err); status.textContent = '입력을 수정한 뒤 다시 시도하세요.'; }
      finally { submit.disabled = false; preset.disabled = false; }
    });
    actions.append(submit, preset); form.append(heading, notice, grid, actions, error, status); container.replaceChildren(form);
    return {read, reset, destroy: () => form.remove()};
  }
  const api = {mount, defaults, parse, kinds: Object.keys(specs)};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioTools = api;
})(typeof window === 'undefined' ? globalThis : window);
