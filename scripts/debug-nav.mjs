/* Mobile (390px) + desktop audit: nav, pager, responsive layouts. */
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
const T = 'C:/Users/mauri/AppData/Local/Temp';

// --- mobile ---
await page.setViewport({ width: 390, height: 844 });
for (const [name, url] of [
  ['m-home', '/'],
  ['m-charts', '/charts'],
  ['m-detail', '/charts/btc-vs-earthquakes'],
  ['m-events', '/events'],
  ['m-methodology', '/methodology'],
]) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 900));
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${T}/${name}.png`, fullPage: true });
}
console.log('mobile shots saved');

// overflow check: anything wider than viewport?
await page.goto('http://localhost:3000/charts/btc-vs-earthquakes', { waitUntil: 'networkidle0' });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth
);
console.log('horizontal overflow px (detail, 390w):', overflow);

// --- desktop: nav active state + sticky ---
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/charts/btc-vs-moon', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 900));
const active = await page.evaluate(
  () => document.querySelector('nav a[aria-current="page"]')?.textContent ?? 'NONE'
);
console.log('active nav item on chart page:', active);
await page.evaluate(() => window.scrollTo(0, 800));
await new Promise((r) => setTimeout(r, 300));
const stuck = await page.evaluate(() => {
  const h = document.querySelector('header');
  return h ? h.getBoundingClientRect().top === 0 : false;
});
console.log('header sticks on scroll:', stuck);
await page.screenshot({ path: `${T}/d-detail-scrolled.png` });
await browser.close();
