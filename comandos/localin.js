const { chromium } = require('playwright');

module.exports = async (ctx) => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://painel.mobilibus.com/bus2you/home?p=3c19y', { waitUntil: 'domcontentloaded' });

    // Seleciona a caixa dos horários de ônibus
    await page.click('.ng-select-container');

    // Esperar que a lista de números seja carregada
    await page.waitForSelector('.ng-option-label small');

    // Obter todos os números com a tag 'small' na lista
    const numberElements = await page.$$('.ng-option-label small');
    const numbers = await Promise.all(
        numberElements.map(async (element) => {
            return (await element.textContent()).trim();
        })
    );

    // Obter todos os nomes com a tag 'span' na lista
    const nameElements = await page.$$('.ng-option-label span');
    const names = await Promise.all(
        nameElements.map(async (element) => {
            return (await element.textContent()).trim();
        })
    );

    // Verificar se o número de números e nomes é o mesmo
    if (numbers.length === names.length) {
        const buttons = [];
        for (let i = 0; i < numbers.length; i++) {
            // Mover a declaração de callbackData para dentro do loop
            const callbackData = `${numbers[i]}`; 
            buttons.push([{ text: `${numbers[i]} ${names[i]}`, callback_data: callbackData }]);
            
            // Mostrar os números e nomes ao usuário em botões inline no Telegram
            try {
                await ctx.reply('Selecione um ônibus:', {
                    reply_markup: {
                        inline_keyboard: buttons
                    }
                });

                // Identificar o input dentro da div com a classe ng-input
                const inputSelector = '.ng-input input';

                // Esperar que o input esteja disponível
                await page.waitForSelector(inputSelector);

                // Selecionar o input
                const inputElement = await page.$(inputSelector);

                // Inserir o valor do callback no input
                if (inputElement) {
                    await inputElement.type(callbackData);
                } else {
                    console.error('Input element not found');
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}
