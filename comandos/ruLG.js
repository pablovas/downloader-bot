const puppeteer = require('puppeteer');

async function scrapeWebsite() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-lago');
    await page.waitForSelector('.cardapio');
    const cardapioElement = await page.$('.cardapio');
    const screenshot = await cardapioElement.screenshot({ encoding: 'binary' });
  
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