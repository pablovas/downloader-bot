const puppeteer = require('puppeteer');

async function scrapeWebsite() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.furg.br/horarios-do-onibus-interno');
    await page.waitForSelector('tbody');
    const tabelaElement = await page.$('tbody');
    const screenshot = await tabelaElement.screenshot({ encoding: 'binary' });
  
    await browser.close();
  
    return screenshot;
}

module.exports = async (ctx) => {
    try {
      const screenshot = await scrapeWebsite();
      await ctx.replyWithPhoto({ source: screenshot });
    } catch (error) {
      console.error('Ocorreu um erro durante o web scraping:', error);
      ctx.reply('Desculpe, ocorreu um erro durante o web scraping.');
    }
};