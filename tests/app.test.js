const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const URL = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
let browser, page, errors;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

beforeEach(async () => {
  page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
});

async function newMatch({ target = 21, games = 3, h0, h1 } = {}) {
  await page.click('.empty button');
  await page.waitForTimeout(150);
  await page.fill('#f0', 'Aino');
  await page.fill('#f1', 'Ben');
  if (h0) await page.fill('#fh0', String(h0));
  if (h1) await page.fill('#fh1', String(h1));
  await page.fill('#ft', String(target));
  await page.fill('#fb', String(games));
  await page.click('text=Start match');
}

// Draw a line through points given as fractions of the court box.
async function draw(points) {
  const box = await page.locator('.court').boundingBox();
  const P = points.map(([x, y]) => [box.x + box.width * x, box.y + box.height * y]);
  await page.mouse.move(...P[0]);
  await page.mouse.down();
  for (const q of P.slice(1)) await page.mouse.move(...q, { steps: 6 });
  await page.mouse.up();
}

const scores = async () => {
  const t = await page.locator('.sc span').allInnerTexts();
  return t.map(Number);
};

test('loads without errors and offers to create a match', async () => {
  assert.equal(await page.locator('.empty button').count(), 1);
  assert.deepEqual(errors, []);
});

test('arrow across the net gives the hitter the point', async () => {
  await newMatch();
  await draw([[0.2, 0.3], [0.8, 0.6]]);
  assert.deepEqual(await scores(), [1, 0]);
});

test('a return that stops short of the net is a fault by the returner', async () => {
  await newMatch();
  await draw([[0.2, 0.3], [0.8, 0.6], [0.6, 0.4]]);
  assert.deepEqual(await scores(), [1, 0]);
});

test('a return that crosses the net and lands in court wins for the returner', async () => {
  await newMatch();
  await draw([[0.2, 0.3], [0.8, 0.6], [0.3, 0.4]]);
  assert.deepEqual(await scores(), [0, 1]);
});

test('landing outside the court is a fault by the hitter', async () => {
  await newMatch();
  await draw([[0.2, 0.5], [0.5, 0.4], [0.7, 0.2], [0.75, 0.01]]);
  assert.deepEqual(await scores(), [0, 1]);
});

test('tapping a half is a fault by that player', async () => {
  await newMatch();
  await page.mouse.click(...(await (async () => {
    const b = await page.locator('.court').boundingBox();
    return [b.x + b.width * 0.25, b.y + b.height * 0.5];
  })()));
  assert.deepEqual(await scores(), [0, 1]);
});

test('score buttons adjust the score and are logged', async () => {
  await newMatch();
  await page.click('.adj >> nth=1');
  await page.click('.adj >> nth=1');
  await page.click('.adj >> nth=0');
  assert.deepEqual(await scores(), [1, 0]);
  await page.click('button[title="Match menu"]');
  const log = await page.locator('.log').innerText();
  assert.match(log, /Score adjusted: Aino \+1/);
  assert.match(log, /Score adjusted: Aino −1/);
});

test('swapping sides keeps arrows with their players', async () => {
  await newMatch();
  await draw([[0.2, 0.3], [0.8, 0.6]]);
  await page.click('button[title="Swap sides"]');
  const names = await page.locator('.pl .nm').allInnerTexts();
  assert.match(names[0], /Ben/);
  assert.deepEqual(await scores(), [0, 1]);
});

test('best of three: next game button and match winner', async () => {
  await newMatch({ target: 2, games: 3 });
  const win = async () => { await draw([[0.2, 0.4], [0.8, 0.6]]); await draw([[0.2, 0.4], [0.8, 0.6]]); };
  await win();
  assert.match(await page.locator('.win').innerText(), /wins game 1/);
  await page.click('.win button');
  await win();
  await page.click('.win button');
  await win();
  const text = await page.locator('.win').innerText();
  assert.match(text, /wins the match/);
  assert.equal(await page.locator('.win button').count(), 0);
});

test('side view records heights and wide is a fault', async () => {
  await newMatch();
  await page.click('.seg button:last-child');
  // Aino hits across the net, Ben returns it back across but lands in the wide strip: Ben's fault.
  await draw([[0.3, 0.3], [0.5, 0.15], [0.7, 0.6], [0.3, 0.99]]);
  assert.deepEqual(await scores(), [1, 0]);
  assert.deepEqual(errors, []);
});

test('compare view renders stats for a match', async () => {
  await newMatch();
  await draw([[0.2, 0.3], [0.8, 0.6]]);
  await page.click('#tabCmp');
  assert.match(await page.locator('.card').innerText(), /Points recorded/);
});

test('side view shows both players at their heights and a 1.55 m net', async () => {
  await newMatch({ h0: 172, h1: 148 });
  await page.click('.seg button:last-child');
  const svg = await page.locator('.court').innerHTML();
  assert.match(svg, /Aino · 172 cm/);
  assert.match(svg, /Ben · 148 cm/);
  assert.match(svg, /net 1\.55 m/);
});

test('side view: scoreboard overlaps the court and ignores touches while drawing', async () => {
  await newMatch();
  await page.click('.seg button:last-child');
  const court = await page.locator('.court').boundingBox();
  const board = await page.locator('.board').boundingBox();
  assert.ok(board.y >= court.y - 1 && board.y + board.height <= court.y + court.height, 'board sits inside the court');
  const pe = () => page.evaluate(() => getComputedStyle(document.querySelector('.board .pl')).pointerEvents);
  assert.equal(await pe(), 'auto');
  await page.mouse.move(court.x + court.width * 0.4, court.y + court.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(court.x + court.width * 0.5, court.y + court.height * 0.5, { steps: 3 });
  assert.equal(await pe(), 'none');
  await page.mouse.up();
  assert.equal(await pe(), 'auto');
});

test('score buttons still work in side view', async () => {
  await newMatch();
  await page.click('.seg button:last-child');
  await page.click('.adj >> nth=1');
  assert.deepEqual(await scores(), [1, 0]);
});

test('heatmap: shots and faults per player in compare', async () => {
  await newMatch();
  await draw([[0.2, 0.3], [0.8, 0.6]]);            // Aino shot lands in Ben's court
  await draw([[0.2, 0.3], [0.8, 0.6], [0.6, 0.4]]); // Ben's return falls short: Ben fault
  await page.click('#tabCmp');
  await page.click('text=Heatmap');
  let card = await page.locator('.card').innerText();
  assert.match(card, /Aino: 2 shots, 0 faults/);
  assert.ok(await page.locator('.card svg circle[fill^="url(#"]').count() >= 2);
  await page.selectOption('#hp', { label: 'Ben' });
  card = await page.locator('.card').innerText();
  assert.match(card, /Ben: 0 shots, 1 fault/);
  await page.click('button:has-text("Faults")');
  assert.equal(await page.locator('.card svg circle[fill^="url(#"]').count(), 1);
});
