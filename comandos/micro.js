const { chromium } = require('playwright');

async function scrapeWebsite() {
  const browser = await chromium.launch(); // Inicializa o navegador Chromium
  const context = await browser.newContext(); // Cria um novo contexto de navegação
  const page = await context.newPage(); // Cria uma nova página dentro do contexto
  await page.goto('https://www.furg.br/horarios-do-onibus-interno', {waitUntil: 'domcontentloaded'}); // Navega para a URL fornecida
  await page.waitForSelector('tbody'); // Aguarda a existência do seletor 'tbody' na página
  const tabelaElement = await page.$('tbody'); // Localiza o elemento 'tbody' na página
  await page.waitForTimeout(1500); // Aguarda que os conteudos no cardapio sejam inicializados (se existirem)
  const screenshot = await tabelaElement.screenshot({ fullPage: true }); // Tira uma captura de tela do elemento
  const tdElements = await page.$$eval('tbody td', tds => tds.map(td => td.textContent.trim())); // Procura em cada elemento td tabela (tbody) e os coloca em uma lista em forma de string

  await browser.close(); // Fecha o navegador

  return {screenshot, tdElements}; // Retorna a captura de tela como resultado
}

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti a distinta tabela...');

  try {
    const {screenshot, tdElements} = await scrapeWebsite(); // Executa o web scraping para obter a captura de tela da tabela

    // atribui a variavel horarios à lista formada por tdElements
    let horarios = tdElements
    horarios = horarios
      .map(horario => horario.replace(/\*/g, '').replace(/ \(saída EQA\)/g, ''))
      .filter(horario => horario.trim() !== '')
      .sort();
      
    // Função para verificar se é fim de semana
    async function isWeekend() {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }

    // Obter o horário atual
    let horarioAtual = new Date();
    let horaAtual = horarioAtual.getHours();
    let minutoAtual = horarioAtual.getMinutes();

    // Converter o horário atual para o formato da lista (HH:MM)
    let horarioAtualFormatado = `${horaAtual}:${minutoAtual}`;

    // Encontrar o próximo horário disponível
    let horarioProximo = null;

    const currentTime = new Date();

    for (let horario of horarios) {
      const [horas, minutos] = horario.split(':');
      const busTime = new Date(currentTime);
      busTime.setHours(Number(horas));
      busTime.setMinutes(Number(minutos));
    
      if (busTime > currentTime) {
        horarioProximo = horario;
        break;
      }
    }

    if (!horarioProximo) {
      horarioProximo = horarios[0]; // Se não houver próximo na lista, volta ao primeiro horário do dia.
    }

    // Função para calcular a diferença de tempo em minutos
    function calculateTimeDifference(startTime, endTime) {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const diff = end - start;
      return Math.floor(diff / 1000 / 60); // Convertendo para minutos
    }

    // Cálculo do tempo até o próximo ônibus
    const tempoFalta = calculateTimeDifference(horarioAtualFormatado, horarioProximo);

    let tempoFaltaTexto;
    if (tempoFalta < 0) {
      horarioProximo = horarios[0];
      tempoFalta = calculateTimeDifference(horarioAtualFormatado, horarioProximo);
    } else if (tempoFalta < 60) {
      tempoFaltaTexto = tempoFalta === 1 ? '1 minuto' : `${tempoFalta} minutos`;
    } else {
      const horas = Math.floor(tempoFalta / 60);
      const minutosRestantes = tempoFalta % 60;
      tempoFaltaTexto = `${horas} horas`;
      if (minutosRestantes > 0) {
        tempoFaltaTexto += ` e ${minutosRestantes} minutos`;
      }
    }

    let indiceAtual = horarios.indexOf(horarioProximo);
    let proximo;

    if (indiceAtual !== -1 && indiceAtual < horarios.length - 1) {
      proximo = horarios[indiceAtual + 1];
    } else {
      proximo = 'Não há mais horários hoje';
    }

    let caption = `🚌 Próximo horário: ${horarioProximo}\nTempo até o próximo ônibus: ${tempoFaltaTexto}\nMas tem outro no horário de ${proximo}`;

    if (await isWeekend()) {
      caption = "Hoje não tem ônibus.";
    }

    //caption += "\n\n ⚠️ Os horários podem sofrer alterações, confira a tabela antes de qualquer coisa! ⚠️", {parse_mode: 'MarkdownV2'};

    await ctx.replyWithPhoto({source: screenshot}, {caption: caption}); // Envia a captura de tela como uma imagem de resposta
    await ctx.deleteMessage(message.message_id); // Deleta a mensagem anterior

  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    await ctx.deleteMessage(message.message_id);
    await ctx.reply('Desculpe, ocorreu um erro durante o web scraping.'); // Retorna uma mensagem de erro em caso de exceção
  }
};