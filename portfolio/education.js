(function () {
  'use strict';
  const descriptions = {
    teacher_pack: ['교사용 수업팩', '30분 진행안, 학습자 활동지, 역할 카드, 예시 답안과 관찰 루브릭을 한 단원으로 제작합니다.'],
    course: ['영어 실습 코스', '7개 여행 상황을 순서대로 학습하고, 이해 확인과 진행 기록을 파일로 보관합니다.'],
    workbook: ['말하기 워크북', '대화, 답안 작성 공간, 역할 활동, 예시 답안을 인쇄 가능한 학습 자료로 제작합니다.'],
    game: ['상황 영어 복습 게임', '뜻에 맞는 영어 표현을 선택하고, 틀린 표현을 다시 확인하는 짧은 오프라인 활동입니다.']
  };
  const topics = [['all', '전체 7개 여행 상황'], ['airport', '공항에서 첫 요청'], ['hotel', '호텔 예약 확인'], ['cafe', '카페 주문'], ['restaurant', '식당에서 요청'], ['transport', '교통과 이동'], ['shopping', '쇼핑과 확인'], ['help', '도움 요청']];
  function mount(container, options) {
    if (!container || !options || typeof options.onSubmit !== 'function') throw new Error('교육 제작 폼에 제출 처리가 필요합니다.');
    const kind = options.kind;
    if (!descriptions[kind]) throw new Error('지원하지 않는 교육 형식입니다.');
    const form = document.createElement('form');
    form.className = 'portfolio-form education-form';
    const heading = document.createElement('h3');
    heading.textContent = descriptions[kind][0];
    const description = document.createElement('p');
    description.textContent = descriptions[kind][1];
    form.append(heading, description);
    function field(labelText, element) {
      const label = document.createElement('label');
      label.style.display = 'grid'; label.style.gap = '6px'; label.style.margin = '14px 0';
      const text = document.createElement('span'); text.textContent = labelText;
      label.append(text, element); form.append(label); return element;
    }
    function select(values, selected) {
      const element = document.createElement('select');
      values.forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; option.selected = value === selected; element.append(option); });
      return element;
    }
    const title = field('자료 제목 · 비우면 기본 제목 사용', document.createElement('input'));
    title.type = 'text'; title.maxLength = 140; title.placeholder = descriptions[kind][0];
    const topicValues = kind === 'teacher_pack' ? topics.slice(1) : topics;
    const topic = field('학습 상황', select(topicValues, kind === 'teacher_pack' ? 'airport' : 'all'));
    const level = field('목표 수준', select([['A1', 'A1 · 지원 문장을 보며 연습'], ['A2', 'A2 · 정보를 바꾸어 재시도']], 'A2'));
    const paper = field('인쇄 용지', select([['A4', 'A4 · 210 × 297 mm'], ['Letter', 'US Letter · 8.5 × 11 in']], 'A4'));
    const note = document.createElement('p'); note.className = 'muted';
    note.textContent = '원본 J&J 여행 대화를 재구성합니다. 수준은 목표 표기이며 교사 검토와 학습 효과 검증은 대기 중입니다. 코스·게임은 인터넷 없이 실행하고 진행 파일을 내보낼 수 있습니다.';
    form.append(note);
    if (kind === 'teacher_pack') { const sku = document.createElement('small'); sku.textContent = '상품 ID: EDU-TEACHER-01 · 기존 JJ02 출장 학습팩과 별도'; form.append(sku); }
    if (kind === 'workbook') { const printNote = document.createElement('p'); printNote.textContent = 'A4/Letter 인쇄본과 무재단 여백 메타데이터를 제공합니다. PDF 출력 검수와 출판 플랫폼 등록 자격 확인은 별도로 진행합니다.'; form.append(printNote); }
    const advanced = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = '직접 편집한 수업 JSON 사용';
    const custom = document.createElement('textarea'); custom.rows = 5; custom.maxLength = 400000;
    custom.setAttribute('aria-label', '편집한 수업 JSON'); custom.placeholder = '{"lessons":[...]} — source.json의 lessons 형식';
    const customNote = document.createElement('p'); customNote.textContent = '사용할 권리가 있는 대화·연습 자료만 넣으세요. 자료를 넣으면 전체 주제를 선택해 입력 순서를 유지합니다.';
    advanced.append(summary, customNote, custom); form.append(advanced);
    const status = document.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const button = document.createElement('button'); button.type = 'submit'; button.className = 'primary'; button.textContent = '학습 자료 제작';
    form.append(button, status);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); status.textContent = ''; button.disabled = true;
      try {
        const payload = { level: level.value, topic: topic.value, paper: paper.value, title: title.value.trim() };
        if (custom.value.trim()) {
          const parsed = JSON.parse(custom.value);
          if (!parsed || !Array.isArray(parsed.lessons)) throw new Error('JSON에 lessons 배열이 필요합니다.');
          payload.lessons = parsed.lessons; payload.topic = 'all';
        }
        await options.onSubmit(payload);
      } catch (error) { status.textContent = error.message || '자료를 확인한 뒤 다시 시도하세요.'; }
      finally { button.disabled = false; }
    });
    container.replaceChildren(form);
    return { destroy() { if (form.parentElement === container) form.remove(); } };
  }
  window.PortfolioEducation = { mount, kinds: Object.keys(descriptions), defaults: { level: 'A2', topic: 'all', paper: 'A4', title: '' } };
})();
