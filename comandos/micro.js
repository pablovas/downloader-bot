const { chromium } = require('playwright');
const config = require('../config');

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
  config.logInteraction(ctx, '/micro');
  const message = await ctx.reply('Por favor, aguarde breves momentos enquanto provemos a ti a distinta tabela...');
  
  // Função para verificar se é fim de semana
  async function isWeekend() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  let horarios = ['06:50', '07:10', '07:30', '07:50', '08:15', '08:50', '09:30', '10:25', '11:05', '11:30', '12:00', '12:15', '12:45', '13:15', '13:40', '14:00', '14:50', '15:30', '16:00', '16:50', '17:30', '18:05', '18:30', '18:55', '19:20', '19:45', '20:25', '20:40', '21:35', '22:20', '22:45', '23:15'];

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

  // Horários específicos em que o ônibus passará na Oceantec
  let horariosOceantec = ['07:50', '12:00', '12:45', '13:40', '18:05', '18:55'];

  // Horários específicos em que o ônibus sairá do EQA
  let horariosEQA = ['21:35', '22:20', '22:45', '23:15'];

  // Função para calcular a diferença de tempo em minutos
  function calculateTimeDifference(startTime, endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diff = end - start;
    return Math.floor(diff / 1000 / 60); // Convertendo para minutos
  }

  try {
    const screenshot = await scrapeWebsite(); // Executa o web scraping para obter a captura de tela da tabela

    // Cálculo do tempo até o próximo ônibus
    const tempoFalta = calculateTimeDifference(horarioAtualFormatado, horarioProximo);

    let tempoFaltaTexto;
    if (tempoFalta < 60) {
      tempoFaltaTexto = tempoFalta === 1 ? '1 minuto' : `${tempoFalta} minutos`;
    } else {
      const horas = Math.floor(tempoFalta / 60);
      const minutosRestantes = tempoFalta % 60;
      tempoFaltaTexto = `${horas} horas`;
      if (minutosRestantes > 0) {
        tempoFaltaTexto += ` e ${minutosRestantes} minutos`;
      }
    }

    let caption = `🚌 Próximo horário: ${horarioProximo}\nTempo até o próximo ônibus: ${tempoFaltaTexto}`;


    if (await isWeekend()) {
      caption = "Hoje não tem ônibus";
    } else if (horariosOceantec.includes(horarioProximo)) {
      caption += "\nO ônibus passará na Oceantec neste horário.";
    } else if (horariosEQA.includes(horarioProximo)) {
      caption += "\nEste ônibus sairá do EQA.";
    } else if (!horariosOceantec.includes(horarioProximo) && !horariosEQA.includes(horarioProximo)) {
      caption += "\nO ônibus sairá do Predio 4 como de praste.";
    }

    await ctx.replyWithPhoto({source: screenshot}, {caption: caption}); // Envia a captura de tela como uma imagem de resposta
    await ctx.deleteMessage(message.message_id); // Deleta a mensagem anterior
  } catch (error) {
    if (error.includes('Timeout')) {
      ctx.reply("O site está fora do ar. Tente novamente mais tarde.");
    }
    console.error('Ocorreu um erro durante o web scraping:', error);
    await ctx.deleteMessage(message.message_id);
    ctx.reply('Desculpe, ocorreu um erro durante o web scraping.'); // Retorna uma mensagem de erro em caso de exceção
  }
};