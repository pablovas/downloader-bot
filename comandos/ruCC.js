const { chromium } = require('playwright');

async function scrapeWebsite() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-cc');
  await page.waitForSelector('.cardapio');
  const cardapioElement = await page.$('.cardapio');
  const screenshot = await cardapioElement.screenshot({ fullPage: true });

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