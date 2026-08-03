import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/Volumes/YOCN/My Websites/Caresthetic/portfolio-screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

console.log('[1/6] Loading site...');
await page.goto('https://carestheticpr.com/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const shots = [
  { name: '01-hero', selector: '#hero', desc: 'Hero section' },
  { name: '02-services', selector: '#services', desc: 'Services section' },
  { name: '03-about', selector: '#about', desc: 'About Dr. Cardona' },
  { name: '04-treatments', selector: '#treatments', desc: 'Treatments gallery' },
  { name: '05-contact', selector: '#contact', desc: 'Contact section' },
];

for (let i = 0; i < shots.length; i++) {
  const { name, selector, desc } = shots[i];
  console.log(`[${i + 2}/6] Capturing ${desc}...`);
  const el = await page.$(selector);
  if (!el) {
    console.log(`    ! Selector ${selector} not found`);
    continue;
  }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.jpg`),
    type: 'jpeg',
    quality: 92,
    fullPage: false,
  });
}

// Bonus: full-page tall screenshot for reference
console.log('[6/6] Capturing full-page overview...');
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({
  path: path.join(OUT_DIR, '06-full-page.jpg'),
  type: 'jpeg',
  quality: 88,
  fullPage: true,
});

await browser.close();
console.log('\nDone. Screenshots saved to:', OUT_DIR);
