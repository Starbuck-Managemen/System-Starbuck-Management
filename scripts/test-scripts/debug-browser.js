const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('https://starbuck.web.id/buy/cmr0br66b0001ssmnrgv0dt9o', { waitUntil: 'networkidle2' });
    console.log("Page loaded successfully.");
  } catch (e) {
    console.log("Navigation error:", e);
  }

  await browser.close();
})();
