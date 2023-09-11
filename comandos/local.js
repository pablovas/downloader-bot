const { chromium } = require('playwright');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
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

  // Mostrar os números ao usuário
  console.log('Números disponíveis:');
  console.log(numbers.join(', '));

  // Solicitar ao usuário que insira um número
  rl.question('Digite um número para consultar a linha: ', async (userNumber) => {
    // Verificar se o número existe na lista
    if (numbers.includes(userNumber)) {
      console.log(`Você escolheu o número ${userNumber}.`);
    } else {
      // Encontrar o número mais próximo ao valor inserido pelo usuário
      const closestNumber = findClosestNumber(userNumber, numbers);
      console.log(`Número mais próximo encontrado: ${closestNumber}`);
      userNumber = closestNumber;
    }

    // Inserir o número no campo de entrada
    await page.keyboard.type(userNumber);

    // Pressionar a tecla "Enter"
    await page.keyboard.press('Enter');

    // Aguardar 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar quantos elementos têm a classe "accordion-button"
    const accordionButtons = await page.$$('.accordion-button');

    if (accordionButtons.length >= 2) {
      // Se houver dois ou mais elementos, apresentar apenas metade das opções ao usuário
      console.log(`Há ${accordionButtons.length} elementos com a classe "accordion-button".`);
      console.log('Opções disponíveis (metade):');
      const options = await Promise.all(
        accordionButtons.slice(0, accordionButtons.length / 2).map(async (element, index) => {
          const optionText = await element.textContent();
          console.log(`${index + 1}. ${optionText}`);
          return optionText;
        })
      );

      rl.question('Qual elemento você deseja selecionar (digite o número)? ', async (userChoice) => {
        const choiceIndex = parseInt(userChoice, 10) - 1;
        if (choiceIndex >= 0 && choiceIndex < options.length) {
          await accordionButtons[choiceIndex].click();
          console.log(`Você selecionou o elemento: ${options[choiceIndex]}`);

          // Tirar um print do conteúdo da classe "accordion-item"
          const accordionItemContent = await page.$('.accordion-item');
          if (accordionItemContent) {
            await accordionItemContent.screenshot({ path: 'accordion-item.png' });
            console.log('Tirou um print do conteúdo da classe "accordion-item".');
          } else {
            console.log('Classe "accordion-item" não encontrada.');
          }

          if (choiceIndex === 1) {
            // Se a opção 2 foi selecionada, clique nela novamente
            await accordionButtons[choiceIndex].click();
            console.log('Clicou na opção 2 novamente.');

            // Aguardar 2 segundos para garantir que o conteúdo seja carregado
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Tirar um print do conteúdo da quarta vez que aparece a classe "accordion-item"
            const accordionItemElements = await page.$$('.accordion-item');
            // Tirar um print do conteúdo da classe "accordion-item"
            const accordionItemContent = await page.$('.accordion-item');
            if (accordionItemContent) {
              await accordionItemContent.screenshot({ path: 'accordion-item.png' });
              console.log('Tirou um print do conteúdo da classe "accordion-item".');
            } else {
              console.log('Classe "accordion-item" não encontrada.');
            }
          }
        } else {
          console.log('Escolha inválida.');
        }

        await browser.close();
        rl.close();
      });
    } else {
      console.log('Não há dois ou mais elementos com a classe "accordion-button".');
      await browser.close();
      rl.close();
    }
  });
})();

function findClosestNumber(target, numbers) {
  const parsedTarget = parseFloat(target);
  let closest = parseFloat(numbers[0]);
  let diff = Math.abs(parsedTarget - closest);

  for (let i = 1; i < numbers.length; i++) {
    const parsedNumber = parseFloat(numbers[i]);
    const currentDiff = Math.abs(parsedTarget - parsedNumber);
    if (currentDiff < diff) {
      closest = parsedNumber;
      diff = currentDiff;
    }
  }

  return closest.toString();
}
