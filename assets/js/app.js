/* The Roots of Capitalism — interactive visual study. Vanilla JS + D3. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n) => new Intl.NumberFormat('en-US').format(n);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (p) => fetch(p).then(r => { if(!r.ok) throw new Error(p+' '+r.status); return r.json(); });

/* ---------- theme ---------- */
function initTheme(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';
  $('#themeToggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next; localStorage.setItem('theme', next);
  });
}

/* ---------- progress + reveal + nav active ---------- */
function initScroll(){
  const bar = $('#progress'); const span = bar?.querySelector('span');
  const back = $('#backToTop');
  const sections = $$('main section[id]');
  const navLinks = $$('.nav a');
  function onScroll(){
    const h = document.documentElement;
    const pct = h.scrollHeight - h.clientHeight > 0 ? (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 : 0;
    if (span){ span.style.width = pct + '%'; bar.setAttribute('aria-valuenow', Math.round(pct)); }
    back?.classList.toggle('show', h.scrollTop > 600);
    // active nav
    let current = '';
    for (const s of sections){ if (s.getBoundingClientRect().top <= 120) current = s.id; }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  back?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  // reveal
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-anim], .reveal').forEach(el => io.observe(el));
}

/* ---------- count up ---------- */
function countUp(el){
  const target = parseFloat(el.dataset.count); const prefix = el.dataset.prefix || ''; const suffix = el.dataset.suffix || '';
  if (reduceMotion){ el.textContent = prefix + fmt(target) + suffix; return; }
  const dur = 1400; const start = performance.now();
  function step(t){
    const k = Math.min(1, (t - start) / dur); const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = prefix + fmt(Math.round(target * eased)) + suffix;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function initCounts(){
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){ if (e.isIntersecting){ countUp(e.target); io.unobserve(e.target); } }
  }, { threshold: 0.4 });
  $$('.stat-num[data-count]').forEach(el => io.observe(el));
}

/* ---------- myth vs fact ---------- */
async function initMyths(){
  const data = await load('assets/data/myths.json');
  const grid = $('#mythGrid');
  grid.innerHTML = data.map((m, i) => `
    <article class="myth-card reveal" data-id="${esc(m.id)}">
      <button class="flip" aria-expanded="false" aria-controls="myth-${i}-fact" id="myth-${i}-btn">
        <span class="face myth show" id="myth-${i}-myth">
          <span class="myth-tag myth">Myth</span>
          <p class="q">“${esc(m.myth)}”</p>
          <span class="myth-toggle-hint">Tap to reveal what the record says →</span>
        </span>
        <span class="face fact" id="myth-${i}-fact">
          <span class="myth-tag fact">Fact</span>
          <p class="a">${esc(m.fact)}</p>
          <span class="myth-toggle-hint">← Tap to return to the myth</span>
        </span>
      </button>
      <div class="meta"><span>Conventional narrative vs. historical record</span><span class="page-ref">p.${m.page}</span></div>
    </article>`).join('');
  $$('.myth-card .flip', grid).forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('.myth-card');
    const myth = $('.face.myth', card), fact = $('.face.fact', card);
    const showFact = !fact.classList.contains('show');
    myth.classList.toggle('show', !showFact); fact.classList.toggle('show', showFact);
    btn.setAttribute('aria-expanded', String(showFact));
  }));
  observeReveal(grid);
}

/* ---------- quotes carousel ---------- */
async function initQuotes(){
  const quotes = await load('assets/data/quotes.json');
  const box = $('#quoteCarousel'); let i = 0;
  function render(){
    const q = quotes[i];
    box.innerHTML = `<blockquote class="blockquote quote-enter"><p>“${esc(q.text)}”</p><footer>— ${esc(q.by)}${q.role ? ' · ' + esc(q.role) : ''} · <span class="page-ref">p.${q.page}</span></footer></blockquote>`;
  }
  render();
  $('#quotePrev')?.addEventListener('click', () => { i = (i - 1 + quotes.length) % quotes.length; render(); });
  $('#quoteNext')?.addEventListener('click', () => { i = (i + 1) % quotes.length; render(); });
}

/* ---------- timeline ---------- */
const THEME_LABELS = { sugar:'Sugar', slavery:'Slavery', resistance:'Resistance', colonialism:'Colonialism', genocide:'Genocide', labour:'Labour', finance:'Finance', technology:'Technology' };
async function initTimeline(){
  const events = (await load('assets/data/timeline.json')).sort((a, b) => a.year - b.year);
  const themes = [...new Set(events.map(e => e.theme))];
  const regions = [...new Set(events.map(e => e.region))];
  const state = { theme: null, region: null };
  const track = $('#timelineTrack'); const detail = $('#timelineDetail');
  $('#themeFilters').innerHTML = themes.map(t => `<button class="chip" data-theme="${t}" aria-pressed="false">${THEME_LABELS[t] || t}</button>`).join('');
  $('#regionFilters').innerHTML = regions.map(r => `<button class="chip" data-region="${esc(r)}" aria-pressed="false">${esc(r)}</button>`).join('');
  function render(){
    const list = events.filter(e => (!state.theme || e.theme === state.theme) && (!state.region || e.region === state.region));
    $('#timelineCount').textContent = `${list.length} of ${events.length} events`;
    track.innerHTML = list.map((e, i) => `
      <button class="tl-event" role="listitem" aria-pressed="false" data-i="${i}" data-theme="${e.theme}">
        <span class="dot" aria-hidden="true"></span>
        <span class="card ${i % 2 === 0 ? 'top' : 'bottom'}">
          <span class="tl-year">${e.year}</span>
          <span class="tl-title">${esc(e.title)}</span>
          <span class="tl-region">${esc(e.region)} · p.${e.page}</span>
        </span>
      </button>`).join('');
    $$('.tl-event', track).forEach(btn => btn.addEventListener('click', () => select(+btn.dataset.i, list)));
    track._list = list;
  }
  function select(i, list){
    const e = list[i]; if (!e) return;
    $$('.tl-event', track).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    detail.innerHTML = `<h4>${e.year} · ${esc(e.title)}</h4>
      <p><span class="page-ref">${esc(e.region)}</span> · ${esc(THEME_LABELS[e.theme] || e.theme)} · <span class="page-ref">p.${e.page}</span></p>
      <p>${esc(e.detail)}</p>`;
  }
  $$('#themeFilters .chip').forEach(c => c.addEventListener('click', () => { state.theme = state.theme === c.dataset.theme ? null : c.dataset.theme; syncChips(); render(); }));
  $$('#regionFilters .chip').forEach(c => c.addEventListener('click', () => { state.region = state.region === c.dataset.region ? null : c.dataset.region; syncChips(); render(); }));
  function syncChips(){
    $$('#themeFilters .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.theme === state.theme)));
    $$('#regionFilters .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.region === state.region)));
  }
  $('#timelineReset')?.addEventListener('click', () => { state.theme = null; state.region = null; syncChips(); render(); });
  // keyboard
  track.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight' && ev.key !== 'Enter') return;
    const list = track._list || []; const cur = $$('.tl-event', track).findIndex(b => b === document.activeElement);
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight'){
      ev.preventDefault(); const next = ev.key === 'ArrowRight' ? Math.min(list.length - 1, cur + 1) : Math.max(0, cur - 1);
      $$('.tl-event', track)[next]?.focus(); select(next, list);
    }
  });
  render();
}

/* ---------- Caribbean colonial powers ---------- */
const CARIB = [
  { territory:'Hispaniola', power:'Spain', start:1492, end:1697, note:'Spanish capture 1490s–early 1600s' },
  { territory:'Hispaniola (western third)', power:'France', start:1697, end:1804, note:'Treaty of Rijswijk 1697 → Saint-Domingue; now Haiti' },
  { territory:'Jamaica', power:'Spain', start:1494, end:1655, note:'Captured by Spain 1490s' },
  { territory:'Jamaica', power:'England', start:1655, end:1900, note:'Seized from Spain 1655' },
  { territory:'Trinidad', power:'Spain', start:1498, end:1900, note:'Captured by Spain 1490s–early 1600s' },
  { territory:'Puerto Rico', power:'Spain', start:1493, end:1900, note:'Captured by Spain 1490s–early 1600s' },
  { territory:'Cuba', power:'Spain', start:1492, end:1900, note:'Spanish' },
  { territory:'Barbados', power:'England', start:1625, end:1900, note:'Claimed 1625; settled 1627' },
  { territory:'Guadeloupe', power:'France', start:1635, end:1900, note:'French colony 1635' },
  { territory:'Martinique', power:'France', start:1635, end:1900, note:'French colony 1635' },
  { territory:'Essequibo', power:'Netherlands', start:1616, end:1900, note:'Dutch colony from 1616 (Guiana coast)' },
  { territory:'Suriname', power:'Netherlands', start:1667, end:1900, note:'Dutch Guiana' },
  { territory:'Berbice', power:'Netherlands', start:1627, end:1900, note:'Dutch Guiana coast' },
  { territory:'Curaçao', power:'Netherlands', start:1634, end:1900, note:'Dutch slave-trade network' }
];
const POWERS = ['Spain','Portugal','England','France','Netherlands'];
function initCaribbean(){
  const slider = $('#caribYear'); const out = $('#caribYearOut'); const list = $('#caribbeanList'); const play = $('#caribPlay');
  let timer = null;
  function render(){
    const year = +slider.value; out.value = year; out.textContent = year;
    const active = CARIB.filter(c => year >= c.start && year < c.end);
    list.innerHTML = POWERS.map(p => {
      const items = active.filter(c => c.power === p);
      return `<div class="power-card"><h4>${p}<span>${items.length}</span></h4>
        <ul>${items.length ? items.map(c => `<li class="active" title="${esc(c.note)}">${esc(c.territory)} <span class="muted">· ${c.start}</span></li>`).join('') : '<li class="muted">—</li>'}</ul></div>`;
    }).join('') + `<div class="power-card"><h4>Note</h4><p class="muted" style="font-size:12.5px;margin:0">Five main colonial powers (p.24). Portugal: Brazil &amp; Atlantic islands. Control shifts noted where the study gives dates. Simplified.</p></div>`;
  }
  slider.addEventListener('input', render);
  play.addEventListener('click', () => {
    if (timer){ clearInterval(timer); timer = null; play.setAttribute('aria-pressed','false'); play.textContent='▶ Play'; return; }
    play.setAttribute('aria-pressed','true'); play.textContent='⏸ Pause';
    timer = setInterval(() => { let y = +slider.value; y = y >= 1800 ? 1490 : y + 5; slider.value = y; render(); }, reduceMotion ? 120 : 60);
  });
  render();
}

/* ---------- sugar flow ---------- */
async function initSugarFlow(){
  const steps = await load('assets/data/sugarFlow.json');
  const flow = $('#sugarFlow'); const detail = $('#sugarFlowDetail');
  flow.innerHTML = steps.map((s, i) => `<li data-i="${i}"><h4>${esc(s.title)}</h4><p>${esc(s.detail.slice(0, 90))}${s.detail.length > 90 ? '…' : ''}</p></li>`).join('');
  function select(i){
    $$('li', flow).forEach(li => li.classList.toggle('active', +li.dataset.i === i));
    const s = steps[i];
    detail.innerHTML = `<span class="stage-tag">${esc(s.stage)} · step ${i + 1}/${steps.length}</span><p style="margin:8px 0 0">${esc(s.detail)}</p>`;
  }
  $$('li', flow).forEach(li => li.addEventListener('click', () => select(+li.dataset.i)));
  select(0);
  // gang
  const g = await load('assets/data/stats.json');
  const gang = g.gangSystem;
  $('#gangGrid').innerHTML = `
    <div class="gang-card"><h4>First gang</h4><p>${esc(gang.firstGang)}</p></div>
    <div class="gang-card"><h4>Second gang</h4><p>${esc(gang.secondGang)}</p></div>
    <div class="gang-card"><h4>Third gang (“grass gang”)</h4><p>${esc(gang.thirdGang)}</p></div>
    <div class="gang-card"><h4>Daily output</h4><p>${esc(gang.holesPerDay)}</p></div>
    <div class="gang-card"><h4>Hours</h4><p>${esc(gang.shifts)}</p></div>
    <div class="gang-card"><h4>Mortality &amp; replacement</h4><p>${esc(gang.mortality)}</p></div>
    <div class="gang-card"><h4>vs. task system</h4><p>Sugar uses the gang system; rice/indigo regions (coastal SC &amp; GA) use a daily-quota “task system.” (p.27)</p></div>`;
  // tech
  const tech = await load('assets/data/tech.json');
  $('#techList').innerHTML = tech.map(t => `<li><span class="when">${esc(t.when)}</span><span class="what">${esc(t.what)}</span></li>`).join('');
}

/* ---------- charts ---------- */
function barChart(series, { valueKey = 'value', labelKey = 'period', xLabelKey = null } = {}){
  const W = 320, H = 180, pad = 34, max = Math.max(...series.map(s => s[valueKey])) * 1.12 || 1;
  const bw = (W - pad * 1.5) / series.length;
  const label = (s) => esc(String(s[xLabelKey || labelKey] ?? s.year ?? s.period ?? ''));
  const bars = series.map((s, i) => {
    const h = (s[valueKey] / max) * (H - pad - 16); const x = pad + i * bw + bw * 0.12; const y = H - pad - h;
    return `<rect class="bar" x="${x}" y="${y}" width="${bw * 0.76}" height="${h}" rx="3"><title>${label(s)}: ${fmt(s[valueKey])}</title></rect>
      <text class="bar-value" x="${x + bw * 0.38}" y="${y - 4}" text-anchor="middle">${compact(s[valueKey])}</text>
      <text class="bar-label" x="${x + bw * 0.38}" y="${H - pad + 14}" text-anchor="middle">${label(s)}</text>`;
  }).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img"><line class="axis" x1="${pad}" y1="${H - pad}" x2="${W - 8}" y2="${H - pad}"/>${bars}</svg>`;
}
function lineChart(series, { valueKey = 'value' } = {}){
  const W = 320, H = 180, pad = 34; const xs = series.map((_, i) => i);
  const max = Math.max(...series.map(s => s[valueKey])) * 1.1 || 1; const min = 0;
  const X = i => pad + (i / (series.length - 1 || 1)) * (W - pad - 10);
  const Y = v => H - pad - ((v - min) / (max - min)) * (H - pad - 14);
  const pts = series.map((s, i) => [X(i), Y(s[valueKey])]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `M${pts[0][0]},${H - pad} ` + pts.map(p => 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + ` L${pts[pts.length-1][0]},${H - pad} Z`;
  const dots = series.map((s, i) => `<circle class="dot-pt" cx="${X(i)}" cy="${Y(s[valueKey])}" r="4"><title>${esc(String(s.year ?? s.period ?? ''))}: ${fmt(s[valueKey])}</title></circle><text class="bar-label" x="${X(i)}" y="${H - pad + 14}" text-anchor="middle">${esc(String(s.year ?? s.period ?? ''))}</text>`).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img"><line class="axis" x1="${pad}" y1="${H - pad}" x2="${W - 8}" y2="${H - pad}"/><path class="area-path" d="${area}"/><path class="line-path" d="${path}"/>${dots}</svg>`;
}
function compact(n){ if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(n % 1e3 ? 1 : 0) + 'k'; return fmt(n); }

async function initCharts(){
  const s = await load('assets/data/stats.json'); const grid = $('#chartGrid');
  const cards = [];
  function card(title, sub, svg, note, page, tableRows){
    const id = 'c' + cards.length;
    const table = tableRows ? `<table class="data-table" id="${id}-t"><thead><tr><th>Label</th><th>Value</th></tr></thead><tbody>${tableRows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table>` : '';
    return `<div class="chart-card reveal"><h3>${esc(title)}</h3><p class="chart-sub">${esc(sub)}</p>${svg}
      <div class="chart-foot"><span class="chart-note">${esc(note || '')} ${page ? `<span class="page-ref">p.${page}</span>` : ''}</span>${tableRows ? `<button class="toggle-data" data-target="${id}-t" aria-pressed="false">View data</button>` : ''}</div>${table}</div>`;
  }
  // sugar production
  cards.push(card('Sugar production in the Americas', s.sugarProductionAmericas.unit, lineChart(s.sugarProductionAmericas.series), s.sugarProductionAmericas.note, s.sugarProductionAmericas.page, s.sugarProductionAmericas.series.map(d => [d.year, d.label || d.value])));
  // british imports (tonnes view)
  const bi = s.britishSugarImports.series.map(d => ({ ...d, value: d.tonnes }));
  cards.push(card('British sugar imports', 'metric tonnes', lineChart(bi), s.britishSugarImports.note, s.britishSugarImports.page, s.britishSugarImports.series.map(d => [d.year, d.label])));
  // barbados share
  cards.push(card('Barbados: sugar share of exports', '%', barChart(s.barbadosSugarShare.series, { labelKey: 'period' }), 'Sugar products dominate Barbados exports.', s.barbadosSugarShare.page, s.barbadosSugarShare.series.map(d => [d.period, d.value + '%'])));
  // value added
  cards.push(card('Value added to British economy', '£ million', barChart(s.britishValueAdded.series, { labelKey: 'period' }), s.britishValueAdded.note, s.britishValueAdded.page, s.britishValueAdded.series.map(d => [d.period, '£' + d.value + 'm'])));
  // jamaican surplus
  cards.push(card('Jamaican planter surplus', '% of subsistence', lineChart(s.jamaicanSurplus.series), s.jamaicanSurplus.note, s.jamaicanSurplus.page, s.jamaicanSurplus.series.map(d => [d.year, d.value + '%'])));
  // muskets
  cards.push(card('Muskets per enslaved person', 'muskets', barChart(s.musketExchange.series, { labelKey: 'period' }), s.musketExchange.note, s.musketExchange.page, s.musketExchange.series.map(d => [d.period, d.value])));
  // barter terms
  cards.push(card('Barter terms with Africa', 'index (1701–1750=100)', lineChart(s.barterTerms.series), s.barterTerms.note, s.barterTerms.page, s.barterTerms.series.map(d => [d.year, d.value])));
  // factor concentration
  const jf = s.jamaicaFactorConcentration;
  cards.push(card('Jamaica factor concentration', `${jf.arrived} arrived · ${jf.ships} ships`, barChart([{period:'3 firms',value:jf.topThreeShare},{period:'other 6',value:100-jf.topThreeShare}], {labelKey:'period'}), jf.note + ` → ${jf.topThreeShare}% handled by 3 firms.`, jf.page, [['ships', jf.ships],['arrived', jf.arrived],['firms', jf.firms],['top-3 share', jf.topThreeShare + '%']]));
  // jamaica population
  cards.push(card('Enslaved population, Jamaican sugar parishes', '×', barChart([{period:'1720s',value:1},{period:'1788',value:6}], {labelKey:'period'}), s.jamaicaEnslavedPop.note, s.jamaicaEnslavedPop.page, [['1720s','1×'],['1788','6×+']]));
  grid.innerHTML = cards.join('');
  $$('.toggle-data', grid).forEach(b => b.addEventListener('click', () => { const t = document.getElementById(b.dataset.target); const show = t.classList.toggle('show'); b.setAttribute('aria-pressed', String(show)); b.textContent = show ? 'Hide data' : 'View data'; }));
  observeReveal(grid);

  // key figures
  const F = [
    [fmt(s.britishTransatlantic.total), 'British‑transported Africans, 1640–1807', 40],
    ['≥' + fmt(s.enslavedSeizedTotal.landed), 'Africans landed in Americas & Caribbean', 11],
    ['14–20m', 'Africans seized in total (incl. died)', 11],
    ['~70%', 'Portugal + Britain share of trade', 40],
    ['40%', 'British capital from slavery profits, 1770', 37],
    ['5%', 'Of British national income', 37],
    ['4–7×', 'Colonial vs mother‑country profitability', 37],
    ['£0.5m→£5.5m', 'Value added to British economy', 38],
    ['40→100%', 'Jamaican surplus vs subsistence', 38],
    ['4×', 'Muscovado vs refined sugar price', 38],
    ['3.2×', 'Caribbean planter receipts, 1713→1775', 39],
    ['50k→200k', 'Sugar, Americas tonnes 1700→1800', 39],
    ['7×', 'British sugar imports 1700→1800', 39],
    ['80%', 'Spanish‑American silver, world supply', 46],
    ['83%', 'Jamaica arrivals → top 3 factors', 42],
    ['£25m', 'Value of Jamaica’s enslaved people', 41],
    ['2→15', 'Muskets per enslaved person', 43],
    ['225 days', 'Author’s incarceration', 5]
  ];
  $('#figureGrid').innerHTML = F.map(([num, cap, pg]) => `<div class="figure reveal"><span class="num">${num}</span><span class="cap">${esc(cap)}</span><span class="pg">p.${pg}</span></div>`).join('');
  observeReveal($('#figureGrid'));
}

/* ---------- glossary ---------- */
async function initGlossary(){
  const g = await load('assets/data/glossary.json');
  $('#glossaryList').innerHTML = g.map(t => `<div class="term"><dt>${esc(t.term)}</dt><dd>${esc(t.def)} <span class="page-ref">p.${t.page}</span></dd></div>`).join('');
}

/* ---------- gallery ---------- */
async function initGallery(){
  const g = await load('assets/data/gallery.json');
  $('#gallery').innerHTML = g.map(x => `<figure class="reveal"><img loading="lazy" src="${x.img}" alt="${esc(x.caption)}"><figcaption>${esc(x.caption)}</figcaption></figure>`).join('');
  observeReveal($('#gallery'));
}

/* ---------- methods + palette ---------- */
async function initMethods(){
  const m = await load('assets/data/methods.json'); const p = await load('assets/data/palette.json');
  $('#methodsGrid').innerHTML = m.map(x => `<div class="method reveal"><h3>${esc(x.title)}</h3><p class="reflects">reflects: ${esc(x.reflects)}</p><p class="detail">${esc(x.detail)}</p></div>`).join('');
  $('#palette').innerHTML = p.map(c => `<div class="swatch"><span class="chip-color" style="background:${c.hex}"></span><span class="meta"><b>${esc(c.name)}</b>${c.hex} · ${esc(c.role)}</span></div>`).join('');
  observeReveal($('#methodsGrid'));
}

/* ---------- notes + ack ---------- */
async function initSources(){
  const notes = await load('assets/data/notes.json');
  const list = $('#notesList');
  function render(filter = ''){ const f = filter.toLowerCase(); const items = notes.filter(n => !f || n.text.toLowerCase().includes(f) || String(n.n).includes(f));
    list.innerHTML = items.map(n => `<li id="note-${n.n}"><span class="n">${n.n}</span><span>${linkify(esc(n.text))}</span></li>`).join('');
    $('#notesCount').textContent = `${items.length} notes`;
  }
  render(); $('#notesFilter')?.addEventListener('input', e => render(e.target.value));
  $('#ack').innerHTML = `<h3 style="margin-top:0">Acknowledgements</h3><p>Many contributed. First, Professor <strong>Sumangala Damodaran</strong> research &amp; writing. Second, those who developed the <strong>maps</strong> “which bring out data in ways that writing and tables do not.” Maps converted <strong>Mercator → Mollweide</strong>; “each projection carries its own ideological bias, Mercator more than others.” Editors incl. <strong>Githa Hariharan</strong>, who deciphered hand‑scribbles from jail; other unnamed editors who validated &amp; suggested modifications. <span class="page-ref">p.49</span></p>`;
}
function linkify(s){ return s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" rel="noopener" target="_blank">$1</a>'); }

/* ---------- share ---------- */
function initShare(){
  const url = location.href; const title = document.title;
  $$('[data-share]').forEach(el => {
    const kind = el.dataset.share;
    if (kind === 'twitter') el.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    if (kind === 'facebook') el.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (kind === 'linkedin') el.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    if (kind === 'whatsapp') el.href = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
    if (kind === 'copy') el.addEventListener('click', async () => { try { await navigator.clipboard.writeText(url); $('#shareStatus').textContent = 'Link copied!'; } catch { $('#shareStatus').textContent = url; } setTimeout(() => $('#shareStatus').textContent = '', 2000); });
  });
}

/* ---------- reveal helper ---------- */
let revealIO;
function observeReveal(root){
  if (!revealIO) revealIO = new IntersectionObserver((es) => { for (const e of es){ if (e.isIntersecting){ e.target.classList.add('in'); revealIO.unobserve(e.target); } } }, { threshold: 0.1 });
  $$('.reveal', root).forEach(el => revealIO.observe(el));
}

/* ================= MAP ================= */
async function initMap(){
  const d3 = window.d3; if (!d3){ console.warn('d3 not loaded'); return; }
  const svg = d3.select('#mapSvg'); const W = 960, H = 540;
  const stage = $('#mapStage') || $('.map-stage');
  const tooltip = $('#mapTooltip');
  const [landTopo, places] = await Promise.all([
    fetch('assets/vendor/land-110m.json').then(r => r.json()),
    load('assets/data/places.json')
  ]);
  const land = window.topojson.feature(landTopo, landTopo.objects.land);
  // layer toggles
  const LAYERS = [
    { id:'plantation', label:'Plantations / sugar', color:'var(--teal)', types:['plantation'] },
    { id:'slavery', label:'Enslaved‑trade ports', color:'#a23', types:['slave-market','slave-trade','slavery'] },
    { id:'refining', label:'Refining / re‑export', color:'#b08900', types:['refining'] },
    { id:'silver', label:'Silver', color:'#7a5c00', types:['silver'] },
    { id:'finance', label:'Finance', color:'#2f7a4a', types:['finance'] },
    { id:'routes', label:'Trade routes', color:'var(--teal)', types:[] },
    { id:'other', label:'Other', color:'var(--teal-mute)', types:['route','resistance'] }
  ];
  const layerState = Object.fromEntries(LAYERS.map(l => [l.id, true]));
  $('#layerToggles').innerHTML = LAYERS.map(l => `<label><input type="checkbox" data-layer="${l.id}" checked> <span class="legend-swatch" style="background:${l.color}"></span> ${l.label}</label>`).join('');
  $('#mapLegend').innerHTML = LAYERS.map(l => `<span class="legend-item"><span class="legend-swatch" style="background:${l.color}"></span>${l.label}</span>`).join('');

  let projName = 'mollweide'; let animateRoutes = false;
  const gRoot = svg.append('g');
  const gSphere = gRoot.append('path').attr('class','sphere');
  const gGraticule = gRoot.append('path').attr('class','graticule');
  const gLand = gRoot.append('g');
  const gRoutes = gRoot.append('g');
  const gPoints = gRoot.append('g');
  const gLabels = gRoot.append('g');

  function projection(){
    let p;
    if (projName === 'mercator') p = d3.geoMercator();
    else p = d3.geoMollweide();
    return p.fitSize([W, H], { type:'Sphere' });
  }
  function typeLayer(t){ const L = LAYERS.find(l => l.types.includes(t)); return L ? L.id : 'other'; }

  function render(){
    const proj = projection(); const path = d3.geoPath(proj);
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    gSphere.attr('d', path({ type:'Sphere' }));
    gGraticule.attr('d', path(d3.geoGraticule10()));
    gLand.selectAll('path').data(land.features || [land]).join('path').attr('class','land').attr('d', path);
    // routes
    const routeSel = gRoutes.selectAll('path').data(layerState.routes ? places.routes : [], d => d.id);
    routeSel.exit().remove();
    routeSel.enter().append('path').merge(routeSel)
      .attr('class', d => 'route kind-' + d.kind + (animateRoutes ? ' anim' : ''))
      .attr('d', d => path({ type:'LineString', coordinates: d.points.map(([lat,lng]) => [lng, lat]) }));
    // points
    const pts = places.points.filter(p => layerState[typeLayer(p.type)]);
    const sel = gPoints.selectAll('circle').data(pts, d => d.id);
    sel.exit().remove();
    const enter = sel.enter().append('circle').attr('class','pt').on('mousemove', onMove).on('mouseleave', hideTip).on('click', onMove);
    enter.merge(sel)
      .attr('class', d => 'pt type-' + d.type)
      .attr('cx', d => proj([d.lng, d.lat])?.[0] ?? -99)
      .attr('cy', d => proj([d.lng, d.lat])?.[1] ?? -99)
      .attr('r', 5);
    // labels for a few key points
    const keyIds = ['kingston','elmina','potosi','mexico-city','london','amsterdam','lisbon','sao-tome','barbados','brazil','madeira','antwerp','glasgow','bristol','manila','china','india','hispaniola','sicily','potosi'];
    const labSel = gLabels.selectAll('text').data(pts.filter(p => keyIds.includes(p.id)), d => d.id);
    labSel.exit().remove();
    labSel.enter().append('text').attr('class','map-label').merge(labSel)
      .attr('x', d => (proj([d.lng, d.lat])?.[0] ?? -99) + 7).attr('y', d => (proj([d.lng, d.lat])?.[1] ?? -99) + 3).text(d => d.name);
  }
  function onMove(event, d){
    const [px, py] = d3.pointer(event, svg.node());
    tooltip.hidden = false;
    tooltip.innerHTML = `<strong>${esc(d.name)}</strong>${esc(d.type || '')}${d.region ? ' · ' + esc(d.region) : ''}<br>${esc(d.note || '')}${d.page ? ` <span class="page-ref">p.${d.page}</span>` : ''}`;
    tooltip.style.left = px + 'px'; tooltip.style.top = py + 'px';
  }
  function hideTip(){ tooltip.hidden = true; }

  // zoom
  const zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', e => gRoot.attr('transform', e.transform));
  svg.call(zoom);
  $('#mapReset')?.addEventListener('click', () => svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity));
  // projection toggle
  $$('input[name="proj"]').forEach(r => r.addEventListener('change', () => { projName = r.value; svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); render(); }));
  // layers
  $$('#layerToggles input').forEach(c => c.addEventListener('change', () => { layerState[c.dataset.layer] = c.checked; render(); }));
  // route play
  $('#routePlay')?.addEventListener('click', function(){ animateRoutes = !animateRoutes; this.setAttribute('aria-pressed', String(animateRoutes)); this.textContent = animateRoutes ? '⏸ Pause routes' : '▶ Animate routes'; render(); });
  // search
  $('#mapSearch')?.addEventListener('input', function(){ const q = this.value.toLowerCase(); gPoints.selectAll('circle').attr('opacity', d => (!q || d.name.toLowerCase().includes(q) || (d.note||'').toLowerCase().includes(q)) ? 1 : 0.12); });
  render();
}

/* ---------- reveal hero ---------- */
function initHeroAnims(){
  if (reduceMotion){ $$('[data-anim]').forEach(el => el.classList.add('in')); return; }
  $$('.hero [data-anim]').forEach((el, i) => setTimeout(() => el.classList.add('in'), 120 + i * 110));
}

/* ---------- boot ---------- */
async function boot(){
  initTheme(); initScroll(); initCounts(); initHeroAnims(); initShare();
  try { await initMyths(); } catch(e){ console.error(e); }
  try { await initQuotes(); } catch(e){ console.error(e); }
  try { await initTimeline(); } catch(e){ console.error(e); }
  try { initCaribbean(); } catch(e){ console.error(e); }
  try { await initSugarFlow(); } catch(e){ console.error(e); }
  try { await initCharts(); } catch(e){ console.error(e); }
  try { await initGlossary(); } catch(e){ console.error(e); }
  try { await initGallery(); } catch(e){ console.error(e); }
  try { await initMethods(); } catch(e){ console.error(e); }
  try { await initSources(); } catch(e){ console.error(e); }
  try { await initMap(); } catch(e){ console.error('map', e); }
  observeReveal(document);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
if ('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{})); }
