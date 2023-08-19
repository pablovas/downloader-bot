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

  let horarios = ['6:50', '7:10', '7:30', '7:50', '8:15', '8:50', '9:30', '10:25', '11:05', '11:30', '12:00', '12:15', '12:45', '13:15', '13:40', '14:00', '14:50', '15:30', '16:00', '16:50', '17:30', '18:05', '18:30', '18:55', '19:20', '19:45', '20:25', '20:40', '21:35', '22:20', '22:45', '23:15'];

  // Obter o horário atual
  let horarioAtual = new Date();
  let horaAtual = horarioAtual.getHours();
  let minutoAtual = horarioAtual.getMinutes();

  // Converter o horário atual para o formato da lista (HH:MM)
  let horarioAtualFormatado = `${horaAtual}:${minutoAtual}`;

  // Encontrar o próximo horário disponível
  let horarioProximo = null;

  for (let horario of horarios) {
    if (horario > horarioAtualFormatado) {
      horarioProximo = horario;
      break;
    }
  }

  if (!horarioProximo) {
    horarioProximo = horarios[0]; // Se não houver próximo na lista, volta ao primeiro horário do dia.
  }

  // Horários específicos em que o ônibus passará na Oceantec
  let horariosOceantec = ['7:50', '12:00', '12:45', '13:40', '18:05', '18:55'];

  // Horários específicos em que o ônibus sairá do EQA
  let horariosEQA = ['21:35', '22:20', '22:45', '23:15'];

  try {
    const screenshot = await scrapeWebsite(); // Executa o web scraping para obter a captura de tela da tabela
      // Crie a legenda baseada nas informações
    let caption = `🚌 Próximo horário: ${horarioProximo}`;

    if (horariosOceantec.includes(horarioProximo)) {
      caption += "\nO ônibus passará na Oceantec neste horário.";
    } else if (horariosEQA.includes(horarioProximo)) {
      caption += "\nEste ônibus sairá do EQA.";
    }
    await ctx.replyWithPhoto({source: screenshot}, {caption: caption}); // Envia a captura de tela como uma imagem de resposta
    await ctx.deleteMessage(message.message_id); // Deleta a mensagem anterior
  } catch (error) {
    console.error('Ocorreu um erro durante o web scraping:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.'); // Retorna uma mensagem de erro em caso de exceção
  }
};