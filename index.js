// Importando os módulos necessários
const Telegraf = require('telegraf');
const config = require('./config');
const mp4 = require('./comandos/mp4');
const mp3 = require('./comandos/mp3');
const curto = require('./comandos/curto');
const ruCC = require('./comandos/ruCC');
const ruLG = require('./comandos/ruLG');
const micro = require('./comandos/micro');

// Criando uma nova instância do bot com o token fornecido
const bot = new Telegraf(config.botToken);

// Iniciar o bot
bot.start((ctx) => ctx.reply('Bem-vindo! Use o comando /help para ver as instruções.'));

// Lidar com o comando /help
bot.command('help', (ctx) => {
  const helpMessage = `
  Bem-vindo ao bot! Aqui estão as instruções disponíveis:
  
  /mp3 <URL> - Baixa o áudio de um vídeo do YouTube.
  Exemplo: /mp3 https://www.youtube.com/watch?v=VIDEO_ID
  
  /mp4 <URL> - Baixa o vídeo de uma rede social (ex.: Youtube, Instagram, Twitter, etc.).
  Exemplo: /mp4 https://www.instagram.com/reel/POST_ID
  
  /curto <URL> - Encurta um link.
  Exemplo: /curto https://www.google.com
  `;
  ctx.replyWithMarkdown(helpMessage);
});

// Registrar os comandos
bot.command('mp4', mp4);
bot.command('mp3', mp3);
bot.command('curto', curto);
bot.command('cc', ruCC);
bot.command('lg', ruLG);
bot.command('micro', micro);

// Iniciando o bot
bot.launch();
