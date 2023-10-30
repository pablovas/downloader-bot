const { chromium } = require('playwright');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  const browser = await chromium.launch({ headless: true });
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
    const listItems = [];
    for (let i = 0; i < numbers.length; i++) {
      listItems.push(`${numbers[i]} ${names[i]}`);
    }
  
    // Mostrar os números e nomes ao usuário em uma lista não enumerada
    console.log('Números disponíveis:');
    listItems.forEach((item) => {
      console.log(`- ${item}`);
    });
  }

  // Solicitar ao usuário que insira um número
  rl.question('Digite um número para consultar a linha: ', async (userNumber) => {
    // Verificar se o número existe na lista
    if (numbers.includes(userNumber)) {
      console.log(`Você escolheu a linha de número ${userNumber}.`);
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

    if (accordionButtons.length) {
      // Se houver dois ou mais elementos, apresentar apenas metade das opções ao usuário
      console.log(`Há ${accordionButtons.length} elementos com a classe "accordion-button".`);
      console.log('Opções disponíveis: ');
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
          await accordionButtons[choiceIndex].scrollIntoViewIfNeeded();
          await accordionButtons[choiceIndex].click();
          console.log(`Você selecionou: ${options[choiceIndex]}`);

          if (choiceIndex === 0) {
            // Após a opção 1 ser selecionada, edite o CSS e capture o conteúdo da classe .accordion-item
            const selectors = ['.p-sd-5', '.s-locale'];
            for (const selector of selectors) {
              const element = await page.$(selector);
              if (element) {
                await element.evaluate((div) => {
                  div.style.setProperty('height', '100%', 'important');
                  div.style.setProperty('max-height', '100%', 'important');
                });
              }
            }
            
            const accordionItemElement = await page.waitForSelector('.accordion-item:visible');
            if (accordionItemElement) {            
              await accordionItemElement.screenshot({ path: 'bus-table-print.png' });
              console.log('Tirou um print do conteúdo do elemento .accordion-item.');
            } else {
              console.log('Erro ao tirar um print do conteúdo do elemento .accordion-item.');
            }
          } else if (choiceIndex === 1) {
            // Se a opção 2 foi selecionada, clique nela novamente
            await accordionButtons[choiceIndex].scrollIntoViewIfNeeded();
            await accordionButtons[choiceIndex].click();
            console.log('Clicou na opção 2 novamente.');

            const selectors = ['.p-sd-5', '#flush-collapse1'];
            for (const selector of selectors) {
              const element = await page.$(selector);
              if (element) {
                await element.evaluate((div) => {
                  div.style.setProperty('height', '100%', 'important');
                  div.style.setProperty('max-height', '100%', 'important');
                });
              }
            }

            // Aguardar até que todos os elementos .accordion-body sejam visíveis e estáveis
            const accordionBodyElements = await page.$$('.accordion-item:visible');
            if (accordionBodyElements.length >= 2) {
              await accordionBodyElements[1].screenshot({path: 'accordion-body.png'});
              console.log('Tirou um print do conteúdo do segundo elemento .accordion-body.');
            } else {
              console.log('Erro ao tirar um print do conteúdo do segundo elemento .accordion-body.');
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
