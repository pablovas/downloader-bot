const { chromium } = require('playwright');

async function scrapeWebsite(url) {
  const browser = await chromium.launch({headless: true}); // Inicializa o navegador Chromium
  const context = await browser.newContext(); // Cria um novo contexto de navegação
  const page = await context.newPage(); // Cria uma nova página dentro do contexto
  await page.goto(url , {waitUntil: 'domcontentloaded'}); // Navega para a URL fornecida
  await page.waitForSelector('.col-sm-6'); // Aguarda a existência do seletor '.col-sm-6' na página

  const hasCardapio = await page.$eval('.panel-heading.custom-panel__heading', (element) => {
    // Verifica se o texto "Não há cardápio cadastrado para exibição no momento." está presente no elemento '.panel-heading.custom-panel__heading'
    return element.textContent.includes('Não há cardápio cadastrado para exibição no momento.');
  }).catch(() => false);

  if (hasCardapio) {
    await browser.close(); // Fecha o navegador
    return 'Não há cardápio'; // Retorna a string indicando a ausência de cardápio
  }

  const cardapioElement = await page.$('.col-sm-6'); // Localiza o elemento '.col-sm-6' na página
  const dayWeek = await page.$('.date-slider-dayweek'); // Localiza o dia da semana no cardapio
  if (dayWeek && cardapioElement) {

    const screenshot = await cardapioElement.screenshot({ fullPage: true }); // Tira uma captura de tela do elemento

    await browser.close(); // Fecha o navegador

    return screenshot; // Retorna a captura de tela como resultado
  } else {
    await browser.close(); // Fecha o navegador
    return 'Não há cardápio'; // Retorna a string indicando a ausência de cardápio
  }
}

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti o distinto cardápio...');

  try {
    const urlCC = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-cc';
    const resultCC = await scrapeWebsite(urlCC); // Executa o scraping para a primeira URL
    const captionCC = `[🔗RU CC](${urlCC})`;

    const urlLago = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-lago';
    const resultLago = await scrapeWebsite(urlLago); // Executa o scraping para a segunda URL
    const captionLago = `[🔗RU LAGO](${urlLago})`;

    if (resultCC === 'Não há cardápio' && resultLago === 'Não há cardápio') {
      // Se ambos os resultados indicarem ausência de cardápio
      await ctx.reply(`Não há cardápio cadastrado nos RUs neste momento, tente novamente mais tarde. `);
    } else if (resultLago === 'Não há cardápio') {
      // Se apenas o resultado2 indicar ausência de cardápio
      await ctx.replyWithPhoto({ source: resultCC }, { caption: `Não há cardápio cadastrado no ${captionLago} neste momento, tente novamente mais tarde.`, parse_mode: 'Markdown' });
    } else if (resultCC === 'Não há cardápio') {
      // Se apenas o resultado1 indicar ausência de cardápio
      await ctx.replyWithPhoto({ source: resultLago }, { caption: `Não há cardápio cadastrado no ${captionCC} neste momento, tente novamente mais tarde.`, parse_mode: 'Markdown' });
    } else {
      // Se ambos os resultados contiverem capturas de tela válidas
      await ctx.replyWithPhoto({ source: resultCC }, { caption: `Para mais informações acesse: ${captionCC}`, parse_mode: 'Markdown' });
      await ctx.replyWithPhoto({ source: resultLago }, { caption: `Para mais informações acesse: ${captionLago}`, parse_mode: 'Markdown' });
    }
    await ctx.deleteMessage(message.message_id); // Deleta a mensagem anterior

  } catch (error) {
    await ctx.deleteMessage(message.message_id);
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.'); // Retorna uma mensagem de erro em caso de exceção
  }
};