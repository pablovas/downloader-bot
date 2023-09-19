const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const sanitize = require('sanitize-filename');
const config = require('../config');

module.exports = async (ctx) => {
  config.logInteraction(ctx, '/mp3');
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos o áudio.');

  let audioUrl = ctx.message.text.split(' ')[1];
  if (!audioUrl || audioUrl.includes('t.me') || audioUrl.includes('threads.net')) {
    console.error('URL do não reconhecida.');
    ctx.deleteMessage(message.message_id);
    ctx.reply('Por favor envie um link reconhecido, como links do Instagram, Pinterest, Tumblr, Youtube, TikTok ou Reddit.');
    return;
  }

  // Remova os trackers do link
  const questionMarkIndex = audioUrl.indexOf('?');
  const commercialMarkIndex = audioUrl.indexOf('&');

  // Torne possível o download de clipes do YT Music
  if (audioUrl.includes('music.youtube')) {
    audioUrl = audioUrl.replace('music.', '');
  }

  if (audioUrl.includes('youtube')) {
    if (commercialMarkIndex !== -1) {
      audioUrl = audioUrl.substring(0, commercialMarkIndex);
    } else {
      audioUrl;
    }
  } else if (questionMarkIndex !== -1) {
    audioUrl = audioUrl.substring(0, questionMarkIndex);
  }

  try {
    const videoInfo = await axios.get(audioUrl);
    const match = videoInfo.data.match(/<title>(.*?)<\/title>/);
    let videoTitle = match ? match[1] : 'audio'; // Título padrão como 'audio'

    const sanitizedTitle = sanitize(videoTitle);
    const fileName = `${sanitizedTitle}.mp3`;

    const ytDlp = spawn('yt-dlp', ['-x', '--audio-format', 'mp3', '--output', fileName, audioUrl]);

    ytDlp.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    ytDlp.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    ytDlp.on('close', async (code) => {
      console.log(`yt-dlp process exited with code ${code}`);
      if (code === 0) {
        const stats = fs.statSync(fileName);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

        if (fileSizeInMB > 49) {
          ctx.reply('Desculpe. O arquivo original é muito grande e não pode ser enviado.');
          ctx.deleteMessage(message.message_id)
            .then(() => {
              fs.unlinkSync(fileName);
              console.log(`Arquivo ${fileName} excluído com sucesso.`);
            });
        } else {
          try {
            const audio = fs.readFileSync(fileName);
            // Envie o áudio com o nome de arquivo correto
            ctx.replyWithAudio({ source: audio, filename: fileName }, { caption: `[🔗Fonte](${audioUrl})`, parse_mode: 'Markdown' })
              .then(() => {
                fs.unlinkSync(fileName);
                console.log(`Arquivo ${fileName} excluído com sucesso.`);
                ctx.deleteMessage(message.message_id);
              })
              .catch((error) => {
                console.error(`Erro ao enviar o áudio: ${error}`);
              });
          } catch (error) {
            console.error(`Erro ao ler o arquivo de áudio: ${error}`);
          }
        }
      } else {
        await ctx.deleteMessage(message.message_id);
        ctx.reply('Ocorreu um erro ao baixar o áudio.');
      }
    });
  } catch (error) {
    console.error(`Erro ao obter informações do link: ${error}`);
    ctx.reply(`Ocorreu um erro ao obter informações do link.`);
    ctx.deleteMessage(message.message_id);
  }
};