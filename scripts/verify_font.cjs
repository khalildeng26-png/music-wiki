// 验证霞鹜文楷字体加载与渲染
const { chromium } = require('C:/Users/admin/AppData/Roaming/npm/node_modules/mcp-jobs/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const fonts = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const body = document.body;
    const loaded = [];
    document.fonts.forEach((f) => { if (f.family.includes('LXGW')) loaded.push(f.family + ' ' + f.weight); });
    return {
      h1: h1 ? getComputedStyle(h1).fontFamily : 'none',
      body: getComputedStyle(body).fontFamily,
      lxgwLoaded: loaded.slice(0, 8),
      lxgwCount: loaded.length,
    };
  });
  console.log('h1 fontFamily:', fonts.h1);
  console.log('body fontFamily:', fonts.body);
  console.log('LXGW 已加载字重数:', fonts.lxgwCount);
  console.log('示例:', fonts.lxgwLoaded.join(', '));
  await page.screenshot({ path: 'scripts/_verify/lxgw-home.png' });
  await page.goto('http://localhost:4321/entries/chord/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scripts/_verify/lxgw-entry.png' });
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
