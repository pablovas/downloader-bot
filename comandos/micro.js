const { chromium } = require('playwright');

async function scrapeWebsite() {
  const browser = await chromium.launch(); // Inicializa o navegador Chromium
  const context = await browser.newContext(); // Cria um novo contexto de navegação
  const page = await context.newPage(); // Cria uma nova página dentro do contexto
  await page.goto('https://www.furg.br/horarios-do-onibus-interno'); // Navega para a URL fornecida
  await page.waitForSelector('tbody'); // Aguarda a existência do seletor 'tbody' na página
  const tabelaElement = await page.$('tbody'); // Localiza o elemento 'tbody' na página
  const screenshot = await tabelaElement.screenshot({ fullPage: true }); // Tira uma captura de tela do elemento

  await browser.close(); // Fecha o navegador

  return screenshot; // Retorna a captura de tela como resultado
}

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti a distinta tabela...');

  try {
    const screenshot = await scrapeWebsite(); // Executa o web scraping para obter a captura de tela da tabela
    await ctx.replyWithPhoto({ source: screenshot }); // Envia a captura de tela como uma imagem de resposta
    await ctx.deleteMessage(message.message_id); // Deleta a mensagem anterior
  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.'); // Retorna uma mensagem de erro em caso de exceção
  }
};