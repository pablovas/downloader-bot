const { chromium } = require('playwright');

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto convertemos a página.');
  const url = ctx.message.text.split(' ')[1];

  if (!url) {
    ctx.reply('Você precisa fornecer um link para converter em PDF.');
    ctx.deleteMessage(message.message_id);
    return;
  }

  try {
    // Inicializa o browser Playwright (Chromium)
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navega até a página especificada
    await page.goto(url);

    // Extrai o título da página (nome da aba)
    const title = await page.title();

    // Gera o PDF da página
    const pdfBuffer = await page.pdf();

    // Fecha o browser Playwright
    await browser.close();

    const caption = `[🔗Fonte](${url})`;

    // Envia o PDF para o Telegram
    ctx.replyWithDocument(
      { source: pdfBuffer, filename: `${title}.pdf` },
      {
        caption: `Para ver melhor, considere ler o conteúdo original aqui na [🔗FONTE](${url}).`,
        parse_mode: 'Markdown',
      }
    );
    ctx.deleteMessage(message.message_id);

  } catch (error) {
    console.error('Erro ao converter a página em PDF:', error);
    ctx.reply('Ocorreu um erro ao converter a página em PDF.');
    ctx.deleteMessage(message.message_id);
  }
}
