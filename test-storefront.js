const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/shop/nulla-clothing', { waitUntil: 'networkidle0' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  await browser.close();
})();
