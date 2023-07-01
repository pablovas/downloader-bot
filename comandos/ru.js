const { chromium } = require('playwright');

async function scrapeWebsite(url) {
  const browser = await chromium.launch(); // Inicializa o navegador Chromium
  const context = await browser.newContext(); // Cria um novo contexto de navegação
  const page = await context.newPage(); // Cria uma nova página dentro do contexto
  await page.goto(url); // Navega para a URL fornecida
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
  const screenshot = await cardapioElement.screenshot({ fullPage: true }); // Tira uma captura de tela do elemento

  await browser.close(); // Fecha o navegador

  return screenshot; // Retorna a captura de tela como resultado
}

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti o distinto cardápio...');

  try {
    const url1 = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-cc';
    const result1 = await scrapeWebsite(url1); // Executa o scraping para a primeira URL

    const url2 = 'https://www.furg.br/estudantes/cardapio-ru/restaurante-universitario-lago';
    const result2 = await scrapeWebsite(url2); // Executa o scraping para a segunda URL

    if (result1 && result2 === 'Não há cardápio cadastrado para exibição no momento.') {
      // Se ambos os resultados indicarem ausência de cardápio
      await ctx.reply('Não há cardápio cadastrado nos RUs neste momento, tente novamente mais tarde.');
    } else if (result2 === 'Não há cardápio') {
      // Se apenas o resultado2 indicar ausência de cardápio
      await ctx.replyWithPhoto({ source: result1 }, { caption: 'Não há cardápio cadastrado no RU lago neste momento, tente novamente mais tarde.' });
    } else if (result1 === 'Não há cardápio') {
      // Se apenas o resultado1 indicar ausência de cardápio
      await ctx.replyWithPhoto({ source: result2 }, { caption: 'Não há cardápio cadastrado no RU CC neste momento, tente novamente mais tarde.' });
    } else {
      // Se ambos os resultados contiverem capturas de tela válidas
      await ctx.replyWithPhoto({ source: result1 });
      await ctx.replyWithPhoto({ source: result2 });
    }
    await ctx.deleteMessage(message.message_id); // Deleta a mensagem anterior

  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.'); // Retorna uma mensagem de erro em caso de exceção
  }
};
