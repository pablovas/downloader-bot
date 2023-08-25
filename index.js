// Importando os módulos necessários
const Telegraf = require('telegraf');
const config = require('./config');
const mp4 = require('./comandos/mp4');
const mp3 = require('./comandos/mp3');
const curto = require('./comandos/curto');
const micro = require('./comandos/micro');
const ru = require('./comandos/ru');
const error = require('./comandos/error');
const playlist = require('./comandos/playlist');

// Criando uma nova instância do bot com o token fornecido
const bot = new Telegraf(config.botToken);

// Iniciar o bot
bot.start((ctx) => {
  config.logInteraction(ctx);
  ctx.reply('Bem-vindo! Use o comando /help para ver as instruções.');
});

// Lidar com o comando /help
bot.command('help', (ctx) => {
  const helpMessage = `
  🤖 Bem-vindo ao bot! Aqui estão as instruções disponíveis:

  /mp3 <URL> - Baixa o áudio de um vídeo do YouTube. 🎧
  
  /mp4 <URL> - Baixa o vídeo de uma rede social (ex.: Youtube, Instagram, Twitter, e TikTok). 🎬

  ⚠️ DEVIDO A RECENTES ALTERAÇÕES NA API DO TWITTER E INSTAGRAM, O DOWNLOAD DE VIDEOS PODE APRESENTAR INSTABILIDADES) ⚠️
  
  /curto <URL> - Encurta um link. 🔗

  /playlist <URL> - Baixa uma playlist de músicas direto do YouTube. 📺
  
  🎓 Se você estuda na FURG, existem comandos relevantes como:
  
  /ru - Mostra os cardápios dos RUs quando disponíveis. 🍲
  
  /micro - Mostra os horários do ônibus interno. 🕰️
  
  Aproveite as funcionalidades do nosso bot! 🤩✨
  `;
  ctx.replyWithMarkdown(helpMessage);
});

// Registrar os comandos
bot.command('mp4', mp4);
bot.command('mp3', mp3);
bot.command('curto', curto);
bot.command('micro', micro);
bot.command('ru', ru);
bot.command('erro', error);
bot.command('playlist', playlist);

// Iniciando o bot
bot.launch();
