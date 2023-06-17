const { chromium } = require('playwright');

async function scrapeWebsite() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.furg.br/horarios-do-onibus-interno');
  await page.waitForSelector('tbody');
  const tabelaElement = await page.$('tbody');
  const screenshot = await tabelaElement.screenshot({ fullPage: true });

  await browser.close();

  return screenshot;
}

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti a distinta tabela...');
  try {
    const screenshot = await scrapeWebsite();
    await ctx.replyWithPhoto({ source: screenshot });
    await ctx.deleteMessage(message.message_id);
  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.');
  }
};