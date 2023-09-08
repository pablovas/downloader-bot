const { spawn } = require('child_process');
const fs = require('fs');
const ytdl = require('ytdl-core');
const config = require('../config');

module.exports = async (ctx) => {
  config.logInteraction(ctx, '/mp3');
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos o áudio.');

  let videoUrl = ctx.message.text.split(' ')[1];
  if (!videoUrl) {
    console.error('URL do vídeo não fornecida.');
    return;
  }

  // Remova os trackers do link
  const questionMarkIndex = videoUrl.indexOf('?');
  const commercialMarkIndex = videoUrl.indexOf('&');

  // Torne possível o download de clipes do YT Music
  if (videoUrl.includes('music.youtube')){
    videoUrl = videoUrl.replace('music.', '');
  }

  if (videoUrl.includes('youtube')){
    if (commercialMarkIndex !== -1){
      videoUrl = videoUrl.substring(0, commercialMarkIndex);
    } else{
      videoUrl;
    }
  } else if (questionMarkIndex !== -1) {
    videoUrl = videoUrl.substring(0, questionMarkIndex);
  }

  // Defina o nome do arquivo de saída como 'audio.mp3'
  const fileName = 'audio.mp3';

  // Executando o comando 'yt-dlp' para baixar o áudio no formato MP3
  const ytDlp = spawn('yt-dlp', ['-x', '--audio-format', 'mp3', '-o', fileName, videoUrl]);

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

        try {
          const info = await ytdl.getInfo(videoUrl);
          const videoTitle = info.videoDetails.title;
          const fileName = `${videoTitle}.mp4`;

          const video = ytdl(videoUrl, { quality: '18' });

          ctx.replyWithVideo({ source: video }, { caption: `[🔗Fonte](${videoUrl})`, parse_mode: 'Markdown' })
            .then(() => {
              console.log(`Arquivo ${fileName} enviado com sucesso.`);
            })
            .catch((error) => {
              console.error(`Erro ao enviar o arquivo: ${error}`);
              ctx.reply(`${error}, deu ruim família.`);
              ctx.deleteMessage(message.message_id);
            });
          return;
        } catch (error) {
          console.error(`Erro ao obter informações do link: ${error}`);
          ctx.reply(`Ocorreu um erro ao obter informações do link.`);
          ctx.deleteMessage(message.message_id);
          return;
        }
      }

      const audio = fs.readFileSync(fileName);

      // Enviando o áudio para o usuário e incluindo a legenda
      ctx.replyWithAudio({ source: audio }, { caption: `[🔗Fonte](${videoUrl})`, parse_mode: 'Markdown' })
        .then(() => {
          fs.unlinkSync(fileName);
          console.log(`Arquivo ${fileName} excluído com sucesso.`);
          ctx.deleteMessage(message.message_id);
        })
        .catch((error) => {
          console.error(`Erro ao enviar o áudio: ${error}`);
        });
    } else {
      await ctx.deleteMessage(message.message_id);
      ctx.reply('Ocorreu um erro ao baixar o áudio.');
    }
  });
};