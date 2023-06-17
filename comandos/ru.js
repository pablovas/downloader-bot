const { chromium } = require('playwright');

async function scrapeWebsite(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector('.col-sm-6');

  const hasCardapio = await page.$eval('.panel-heading.custom-panel__heading', (element) => {
    return element.textContent.includes('Não há cardápio cadastrado para exibição no momento.');
  }).catch(() => false);

  if (hasCardapio) {
    await browser.close();
    return 'Não há cardápio';
  }

  const cardapioElement = await page.$('.col-sm-6');
  const screenshot = await cardapioElement.screenshot({ fullPage: true });

  await browser.close();

  return screenshot;
}

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti o distinto cardápio...');
  try {
    const url1 = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-cc';
    const result1 = await scrapeWebsite(url1);

    const url2 = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-lago';
    const result2 = await scrapeWebsite(url2);

    if (result1 === 'Não há cardápio') {
      await ctx.replyWithPhoto({ source: result2 }, { caption: 'Não há cardápio cadastrado no RU CC neste momento, tente novamente mais tarde.' });
      await ctx.deleteMessage(message.message_id);
    } else if (result2 === 'Não há cardápio') {
      await ctx.replyWithPhoto({ source: result1}, { caption: 'Não há cardápio cadastrado no RU lago neste momento, tente novamente mais tarde.' });
      await ctx.deleteMessage(message.message_id);
    } else {
      await ctx.replyWithPhoto({ source: result1 });
      await ctx.replyWithPhoto({ source: result2 });
    }

  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.');
  }
};
