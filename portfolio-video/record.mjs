import { chromium } from 'playwright';
import fs from 'fs';

const OUT_DIR = new URL('./frames/', import.meta.url).pathname;
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const SCROLL_DURATION_MS = 14000;
const HOLD_TOP_MS = 1500;
const HOLD_BOTTOM_MS = 1500;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
});
const page = await context.newPage();

console.log('[1/4] Loading site...');
await page.goto('https://carestheticpr.com/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
const maxScroll = Math.max(0, scrollHeight - HEIGHT);
console.log(`    Page height: ${scrollHeight}px, max scroll: ${maxScroll}px`);

const totalFrames =
  Math.round((HOLD_TOP_MS + SCROLL_DURATION_MS + HOLD_BOTTOM_MS) * FPS / 1000);
const holdTopFrames = Math.round(HOLD_TOP_MS * FPS / 1000);
const holdBottomFrames = Math.round(HOLD_BOTTOM_MS * FPS / 1000);
const scrollFrames = totalFrames - holdTopFrames - holdBottomFrames;

console.log(`[2/4] Capturing ${totalFrames} frames at ${FPS}fps...`);

let frameIdx = 0;
const pad = (n) => String(n).padStart(4, '0');

for (let i = 0; i < holdTopFrames; i++) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${OUT_DIR}frame_${pad(frameIdx)}.jpg`,
    type: 'jpeg',
    quality: 88,
  });
  frameIdx++;
}

for (let i = 0; i < scrollFrames; i++) {
  const t = i / (scrollFrames - 1);
  const y = Math.round(easeInOutCubic(t) * maxScroll);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(16);
  await page.screenshot({
    path: `${OUT_DIR}frame_${pad(frameIdx)}.jpg`,
    type: 'jpeg',
    quality: 88,
  });
  if (frameIdx % 30 === 0) {
    console.log(`    Frame ${frameIdx}/${totalFrames} (scroll ${y}px)`);
  }
  frameIdx++;
}

for (let i = 0; i < holdBottomFrames; i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), maxScroll);
  await page.screenshot({
    path: `${OUT_DIR}frame_${pad(frameIdx)}.jpg`,
    type: 'jpeg',
    quality: 88,
  });
  frameIdx++;
}

console.log(`[3/4] Captured ${frameIdx} frames.`);
await browser.close();
console.log('[4/4] Done. Now run ffmpeg to encode.');
