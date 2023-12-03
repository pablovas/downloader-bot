const { Telegraf, TelegramError } = require('telegraf');
const config = require('./config');
const mp4 = require('./comandos/mp4');
const mp3 = require('./comandos/mp3');
const curto = require('./comandos/curto');
const micro = require('./comandos/micro');
const ru = require('./comandos/ru');
const errorCommand = require('./comandos/error');
const playlist = require('./comandos/playlist');

const bot = new Telegraf(config.botToken);

// Middleware para lidar com comandos não reconhecidos
bot.use(async (ctx, next) => {
  try {
    const validCommands = ['/start', '/help', '/mp4', '/mp3', '/curto', '/micro', '/ru', '/erro', '/playlist'];

    if (ctx.message && ctx.message.text) {
      config.logInteraction(ctx);
      const command = ctx.message.text.split(' ')[0];
      const toLowerCaseCommand = command.toLowerCase();
      const enabledSocialMediaDownload = command.includes('youtube.com') || command.includes('youtu.be') || command.includes('x.com') || command.includes('twitter.com') || command.includes('instagram.com') || command.includes('tiktok.com');

      if (!validCommands.includes(toLowerCaseCommand) && validCommands.includes(enabledSocialMediaDownload)) {
        try {
          // Mensagem do middleware
          const chat = await ctx.getChat();
          if (chat && chat.type === 'private' && chat.blocked) {
            console.log("O bot foi bloqueado pelo usuário.");
          } else {
            // Verificar se o grupo ainda existe antes de interagir com ele
            const chatId = ctx.message.chat.id;
            try {
              const chatInfo = await ctx.telegram.getChat(chatId);
              if (chatInfo) {
                await ctx.reply("Comando inválido. Use o comando /help para ver as instruções ou escute às instruções do áudio que se segue.");
                await ctx.replyWithAudio({ source: "./comandos/instructions.mp3" });
              } else {
                console.log("O grupo não existe mais.");
              }
            } catch (error) {
              // Lidar com erro ao verificar o status do chat
              if (error instanceof TelegramError && error.code === 403) {
                console.error('Erro 403 (Forbidden: the group chat was deleted) ignorado.');
              } else {
                console.error("Erro ao verificar o status do chat:", error.message);
              }
            }
          }
        } catch (error) {
          // Lidar com erro ao verificar o status do chat
          if (error instanceof TelegramError && error.code === 403) {
            console.error('Erro 403 (Forbidden: the group chat was deleted) ignorado.');
          } else {
            console.error("Erro ao verificar o status do chat:", error.message);
          }
        }
      } else {
        // Baixa vídeo e áudio se o usuário apenas enviar um link compatível
        if (enabledSocialMediaDownload) {
          mp4(ctx);
          if (command.includes('youtube.com') || command.includes('youtu.be')) {
            mp3(ctx);
          }
        }
        next();
      }
    } else {
      // Lidar com mensagens sem texto, se necessário
      ctx.reply("Por favor, envie um comando válido.");
    }
  } catch (error) {
    // Lidar com erros, ignorando especificamente o erro 403 do Telegram
    if (error instanceof TelegramError && error.code === 403) {
      console.error('Erro 403 (Forbidden: the group chat was deleted) ignorado.');
    } else {
      // Lidar com outros erros
      console.error('Erro durante o processamento da mensagem:', error.message);
    }
  }
});

// Iniciar o bot
bot.start((ctx) => {
  ctx.reply('Bem-vindo! Use o comando /help para ver as instruções.');
});

// Lidar com o comando /help
bot.command('help', (ctx) => {
  const helpMessage = `
  🤖 Bem-vindo ao bot! Aqui estão as instruções disponíveis:

  /mp3 <URL> - Baixa o áudio do YouTube. 🎧
  
  /mp4 <URL> - Baixa o vídeo de uma rede social (ex.: Youtube, Instagram, Twitter, TikTok e outros). 🎬

  /playlist <URL> - Baixa uma playlist de músicas direto do YouTube. 📺

  ⚠️ DEVIDO A RECENTES ALTERAÇÕES NA API DO TWITTER, O DOWNLOAD PODE APRESENTAR INSTABILIDADES ⚠️
  
  /curto <URL> - Encurta um link. 🔗
  
  🎓 Se você estuda na FURG, existem comandos relevantes como:
  
  /ru - Mostra os cardápios dos RUs quando disponíveis. 🍲
  
  /micro - Mostra os horários do ônibus interno. 🕰️
  
  Aproveite as funcionalidades do nosso bot! 🤩✨
  `;
  ctx.replyWithMarkdown(helpMessage);
});

// Registrar os comandos
bot.command(['mp4', 'MP4', 'Mp4'], mp4);
bot.command(['mp3', 'MP3', 'Mp3'], mp3);
bot.command(['curto', 'CURTO', 'Curto'], curto);
bot.command(['micro', 'MICRO', 'Micro'], micro);
bot.command(['ru', 'RU', 'Ru', 'rU'], ru);
bot.command(['erro', 'ERRO'], errorCommand);
bot.command(['playlist', 'PLAYLIST', 'Playlist'], playlist);

// Iniciando o bot
bot.launch();
