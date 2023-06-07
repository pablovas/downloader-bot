const { chromium } = require('playwright');

async function scrapeWebsite(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector('.col-sm-6');
  const cardapioElement = await page.$('.col-sm-6');
  const screenshot = await cardapioElement.screenshot({ fullPage: true });

  await browser.close();

  return screenshot;
}

module.exports = async (ctx) => {
  try {
    // Primeiro script
    const url1 = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-cc';
    const screenshot1 = await scrapeWebsite(url1);
    await ctx.replyWithPhoto({ source: screenshot1 });

    // Segundo script
    const url2 = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-lago';
    const screenshot2 = await scrapeWebsite(url2);
    await ctx.replyWithPhoto({ source: screenshot2 });
  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.');
  }
};
