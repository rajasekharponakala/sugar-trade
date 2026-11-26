import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = []; const failed = [];
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => failed.push(r.url() + ' :: ' + (r.failure()?.errorText||'')));
const BASE=process.env.BASE_URL||'http://127.0.0.1:8137/';
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
const counts = await page.evaluate(() => ({
  myths: document.querySelectorAll('#mythGrid .myth-card').length,
  timelineEvents: document.querySelectorAll('#timelineTrack .tl-event').length,
  charts: document.querySelectorAll('#chartGrid .chart-card').length,
  figures: document.querySelectorAll('#figureGrid .figure').length,
  glossary: document.querySelectorAll('#glossaryList .term').length,
  gallery: document.querySelectorAll('#gallery figure').length,
  methods: document.querySelectorAll('#methodsGrid .method').length,
  palette: document.querySelectorAll('#palette .swatch').length,
  notes: document.querySelectorAll('#notesList li').length,
  caribbean: document.querySelectorAll('#caribbeanList .power-card').length,
  sugarSteps: document.querySelectorAll('#sugarFlow li').length,
  techSteps: document.querySelectorAll('#techList li').length,
  gangCards: document.querySelectorAll('#gangGrid .gang-card').length,
  quoteLen: (document.querySelector('#quoteCarousel')?.textContent||'').length,
  mapSvg: !!document.querySelector('#mapSvg svg') || document.querySelectorAll('#mapSvg').length,
  mapLandPaths: document.querySelectorAll('#mapSvg .land').length,
  mapPoints: document.querySelectorAll('#mapSvg .pt').length,
  mapRoutes: document.querySelectorAll('#mapSvg .route').length,
  mapLayers: document.querySelectorAll('#layerToggles input').length,
  heroStats: document.querySelectorAll('.hero-stats .stat-num').length,
  notesFilter: !!document.querySelector('#notesFilter'),
  title: document.title
}));
// interactions smoke
await page.click('#mythGrid .myth-card .flip'); await page.waitForTimeout(150);
const mythFactShown = await page.evaluate(() => !!document.querySelector('#mythGrid .face.fact.show'));
await page.click('#quoteNext'); await page.waitForTimeout(100);
await page.fill('#notesFilter', 'Mintz'); await page.waitForTimeout(150);
const notesAfterFilter = await page.evaluate(() => document.querySelectorAll('#notesList li').length);
await page.screenshot({ path: 'tests/shot.png', fullPage: false });
console.log(JSON.stringify({ counts, mythFactShown, notesAfterFilter, errors, failed }, null, 2));
await browser.close();
