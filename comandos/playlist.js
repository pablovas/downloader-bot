const ytpl = require('ytpl');
const ytdl = require('ytdl-core');
const fs = require('fs');

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos as músicas da playlist.');
  // Obtendo a URL da playlist a partir da mensagem enviada pelo usuário
  const playlistUrl = ctx.message.text.split(' ')[1];

  try {
    // Obtendo informações da playlist usando a biblioteca ytpl
    const playlist = await ytpl(playlistUrl, { limit: Infinity });

    ctx.reply(`Playlist: ${playlist.title}`);

    // Criando uma pasta temporária para os arquivos MP3
    const tempFolder = './temp';
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }

    // Iterando sobre os vídeos da playlist
    for (let video of playlist.items) {
      const videoTitle = video.title;
      const fileName = `${videoTitle}.mp3`;

      // Baixando o áudio do vídeo
      const stream = ytdl(video.url, { quality: 'highestaudio', filter: 'audioonly' });

      // Salvando o áudio em um arquivo temporário
      const filePath = `${tempFolder}/${fileName}`;
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      // Aguardando o término do download e envio do áudio
      await new Promise((resolve) => {
        writeStream.on('finish', resolve);
      });

      // Enviando o áudio para o usuário
      await ctx.replyWithAudio({ source: filePath, filename: fileName });
      console.log(`Arquivo ${fileName} enviado com sucesso.`);

      // Apagando o arquivo MP3 do computador local
      fs.unlinkSync(filePath);
      console.log(`Arquivo ${fileName} apagado do computador.`);
    }

    // Removendo a pasta temporária
    fs.rmdirSync(tempFolder);

    ctx.deleteMessage(message.message_id);
    ctx.reply('Playlist enviada com sucesso!');
  } catch (error) {
    console.error(`Erro ao obter informações da playlist: ${error}`);
    ctx.reply('Ocorreu um erro ao obter informações da playlist. Envie novamente um link válido.');
  }
};
