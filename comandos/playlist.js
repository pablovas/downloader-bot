const ytpl = require('ytpl');
const ytdl = require('ytdl-core');
const fs = require('fs');
const sanitize = require('sanitize-filename');

// Função para limpar o nome do arquivo removendo caracteres inválidos
const sanitizeFilename = (filename) => {
  let sanitized = sanitize(filename);
  if (!sanitized) {
    sanitized = filename.replace(/[\\/:"*?<>|]+/g, '');
  }
  return sanitized;
};

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos a playlist.');

  const playlistUrl = ctx.message.text.split(' ')[1];

  try {
    const playlist = await ytpl(playlistUrl);
    const videos = playlist.items;

    // Criando uma pasta temporária para salvar os arquivos de áudio
    fs.mkdirSync('./temp', { recursive: true });

    let fileCount = 0;
    const totalFiles = videos.length;

    for (const video of videos) {
      try {
        const info = await ytdl.getInfo(video.url);
        const videoTitle = info.videoDetails.title;
        const fileName = sanitizeFilename(videoTitle) + '.mp3';

        const stream = ytdl(video.url, { quality: 'highestaudio', filter: 'audioonly' });

        const filePath = `./temp/${fileName}`;

        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        ctx.replyWithDocument({ source: filePath, filename: fileName })
          .then(() => {
            fs.rmSync(filePath); // Remover o arquivo MP3 após enviar

            console.log(`Arquivo ${fileName} enviado com sucesso.`);

            fileCount++;
            if (fileCount === totalFiles) {
              // Atraso de 10 segundos antes de excluir a pasta 'temp'
              setTimeout(() => {
                fs.rmSync('./temp', { recursive: true });
              }, 10000);
            }
          })
          .catch((error) => {
            if (error.response && error.response.error_code === 413) {
              // Arquivo muito grande, enviar mensagem de erro
              console.error(`Arquivo muito grande: ${fileName}`);
              ctx.reply(`A música "${videoTitle}" não foi enviada devido ao seu tamanho ser muito grande.`);
            } else {
              console.error(`Erro ao enviar o arquivo: ${fileName}`);
              console.error(error);
            }
          });
      } catch (error) {
        if (error.statusCode === 410) {
          console.log(`Vídeo indisponível: ${video.title}, pulando para o próximo.`);
          ctx.reply(`O vídeo "${video.title}" está indisponível, pulando para o próximo.`);
        } else {
          console.error(`Erro ao baixar o vídeo: ${video.title}, pulando para o próximo.`);
          console.error(error);
        }
      }
    }

    ctx.deleteMessage(message.message_id);
    setTimeout(() => {
        ctx.reply('Playlist enviada com sucesso!');
    }, 5000);
  } catch (error) {
    console.error(`Erro ao obter informações da playlist: ${error}`);
    ctx.reply('Ocorreu um erro ao obter informações da playlist. Verifique o link e tente novamente.');
  }
};
