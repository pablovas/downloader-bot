const puppeteer = require('puppeteer');

module.exports = async (ctx) => {
    const url = ctx.message.text.split(' ')[1];

    if (!url) {
      ctx.reply('Você precisa fornecer um link para converter em PDF.');
      return;
    }
  
    try {
        // Inicializa o browser Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    
        // Navega até a página especificada
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Extrai o título da página (nome da aba)
        const title = await page.title();
  
        // Gera o PDF da página
        const pdfBuffer = await page.pdf();
    
        // Fecha o browser Puppeteer
        await browser.close();
    
        // Envia o PDF para o Telegram
        ctx.replyWithDocument({ source: pdfBuffer, filename: `${title}.pdf` });
   
    } catch (error) {
      console.error('Erro ao converter a página em PDF:', error);
      ctx.reply('Ocorreu um erro ao converter a página em PDF.');
    }
}