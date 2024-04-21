const { chromium } = require('playwright');

async function scrapeWebsite() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://www.furg.br/comunicacao/noticias', { waitUntil: 'domcontentloaded' });
    const detalhes = await page.$$('.item-detalhado');
    
    const dataItens = [];
    const linkTitulos = [];
    const titulos = [];

    for (const detalhe of detalhes) {
        const dataItem = await detalhe.$eval('.info .info__item--data', node => node.textContent.trim());
        const titulo = await detalhe.$eval('.item-detalhado__titulo a', node => node.textContent.trim());
        const linkTitulo = await detalhe.$eval('.item-detalhado__titulo a', node => node.getAttribute('href').trim());
        dataItens.push(dataItem);
        linkTitulos.push(linkTitulo);
        titulos.push(titulo);
    }

    await browser.close();
    return { detalhes, dataItens, linkTitulos, titulos };
}

module.exports = async (ctx) => {
    const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti as distintas noticias...');

    try {
        const { detalhes, dataItens, linkTitulos, titulos } = await scrapeWebsite();

        function obterDataAtual() {
            const data = new Date();
            return `${data.getDate()}/0${data.getMonth() + 1}/${data.getFullYear()}`;
        }
        const hoje = obterDataAtual();

        const diaAnterior = new Date(Date.now() - 86400000);
        const diaAnteriorFormatado = `${diaAnterior.getDate()}/0${diaAnterior.getMonth() + 1}/${diaAnterior.getFullYear()}`;

        let contadorNoticias = 0;
        const ultimasNoticias = [];

        for (let i = 0; i < detalhes.length; i++) {
            const dataItem = dataItens[i];
            const linkTitulo = linkTitulos[i];
            const titulo = titulos[i];

            if (dataItem === hoje || dataItem === diaAnteriorFormatado) {
                await ctx.reply(`${dataItem} [${titulo}](https://www.furg.br${linkTitulo})`, { parse_mode: 'Markdown' });
                contadorNoticias++;
            } else if (contadorNoticias < 3) {
                ultimasNoticias.push({ dataItem, linkTitulo, titulo });
            }
        }

        for (let i = 0; i < ultimasNoticias.length && contadorNoticias < 3; i++) {
            const { dataItem, linkTitulo, titulo } = ultimasNoticias[i];
            await ctx.reply(`${dataItem} [${titulo}](https://www.furg.br${linkTitulo})`, { parse_mode: 'Markdown' });
            contadorNoticias++;
        }

    } catch (error) {
        console.error(`Erro ao processar a página: ${error.message}`);
    }
    await ctx.deleteMessage(message.message_id);
};