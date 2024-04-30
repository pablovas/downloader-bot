// Importando os módulos necessários
const Telegraf = require('telegraf');
const config = require('./config');
const mp4 = require('./comandos/mp4');
const mp3 = require('./comandos/mp3');
const curto = require('./comandos/curto');
const error = require('./comandos/error');
const playlist = require('./comandos/playlist');
const rateLimit = require('telegraf-ratelimit');

// Criando uma nova instância do bot com o token fornecido
const bot = new Telegraf(config.botToken);

const limitConfig = {
  window: 3000,
  limit: 2,
  onLimitExceeded: (async(ctx, next) => {
    await ctx.reply('Rate limit excedido. Você não poderá gerar mais comandos pelos próximos 5 minutos 😡');
    ctx.skip = true; // Ignore messages from the user for the next 5 minutes
    setTimeout(() => {
      ctx.skip = false; // Reset the skip flag after 5 minutes
    }, 300000);
  })
}
bot.use(rateLimit(limitConfig));

// Middleware para lidar com comandos não reconhecidos
bot.use(async (ctx, next) => {
  const validCommands = ['/start', '/help', '/mp4', '/mp3', '/curto', '/erro', '/playlist'];

  if (ctx.message && ctx.message.text) {
    config.logInteraction(ctx);
    const command = ctx.message.text.split(' ')[0];
    const toLowerCaseCommand = command.toLowerCase();
    const enabledSocialMediaDownload = command.includes('youtube.com') || command.includes('youtu.be') || command.includes('x.com') || command.includes('twitter.com') || command.includes('instagram.com') || command.includes('tiktok.com') || command.includes('reddit.com');

    if (!validCommands.includes(toLowerCaseCommand) && !enabledSocialMediaDownload) {
      await ctx.reply("Por favor, envie um comando válido.");
      try {
        // Mensagem do middleware
        const chat = await ctx.getChat();
        if (chat && chat.type === 'private' && chat.blocked) {
          console.log("O bot foi bloqueado pelo usuário.");
        } else {
          try {
          } catch (error) {
            if (error.code === 403) {
              console.log("O bot foi bloqueado pelo usuário.");
            } else {
              console.error("Erro ao enviar mensagem:", error.message);
            }
          }
        }
      } catch (error) {
        // Lidar com erro ao verificar o status do chat
        console.error("Erro ao verificar o status do chat:", error.message);
      }
    } else {
      // Criação de filas para paralelismo
      const commandPromises = [];
      // Baixa vídeo e áudio se o usuário apenas enviar um link compatível
      if (enabledSocialMediaDownload) {
        commandPromises.push(mp4(ctx));
        if (command.includes('youtube.com') || command.includes('youtu.be')) {
          commandPromises.push(mp3(ctx));
        }
      }

      await Promise.all(commandPromises);
      next();
    }
  }
});

// Iniciar o bot
bot.start(async (ctx) => {
  await ctx.reply('Bem-vindo! Use o comando /help para ver as instruções.');
});

// Lidar com o comando /help
bot.command('help', async(ctx) => {
  const helpMessage = `
  🤖 Bem-vindo ao bot! Aqui estão as instruções disponíveis:

  /mp3 <URL> - Baixa o áudio do YouTube. 🎧
  
  /mp4 <URL> - Baixa o vídeo de uma rede social (ex.: Youtube, Instagram, Twitter, TikTok e outros). 🎬

  /playlist <URL> - Baixa uma playlist de músicas direto do YouTube. 📺

  ⚠️ DEVIDO A RECENTES ALTERAÇÕES NA API DO TWITTER, O DOWNLOAD PODE APRESENTAR INSTABILIDADES ⚠️
  
  /curto <URL> - Encurta um link. 🔗
  
  `;
  await ctx.replyWithMarkdown(helpMessage);
});

// Registrar os comandos
bot.command(['mp4', 'MP4', 'Mp4'], mp4);
bot.command(['mp3', 'MP3', 'Mp3'], mp3);
bot.command(['curto', 'CURTO', 'Curto'], curto);
bot.command(['erro', 'ERRO'], error);
bot.command(['playlist', 'PLAYLIST', 'Playlist'], playlist);

// Iniciando o bot
bot.launch();
bot.startPolling();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))