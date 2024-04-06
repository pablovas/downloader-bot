const ytdl = require('ytdl-core');

module.exports = async (ctx) => {
  const message = await ctx.reply('Por favor, aguarde enquanto baixamos a música.');
  // Obtendo a URL do áudio a partir da mensagem enviada pelo usuário
  if(ctx.message.text.includes('mp3' || 'MP3' || 'Mp3' || 'mP3')){
    var audioUrl = ctx.message.text.split(' ')[1];
  } else {
    var audioUrl = ctx.message.text;
  }

  try {
    // Obtendo informações do áudio usando a biblioteca ytdl
    const info = await ytdl.getInfo(audioUrl);
    const videoTitle = info.videoDetails.title;
    const fileName = `${videoTitle}.mp3`;

    // Baixando o áudio
    const stream = ytdl(audioUrl, { quality: 'highestaudio',filter: 'audioonly' });

    // Enviando o áudio para o usuário
    await ctx.replyWithAudio({ source: stream, filename: fileName })
      .then(() => {
        ctx.deleteMessage(message.message_id);
        console.log(`Arquivo ${fileName} enviado com sucesso.`);
      })
      .catch(async(error) => {
        ctx.deleteMessage(message.message_id);
        console.error(`Erro ao enviar o arquivo: ${error}`);
        await ctx.reply(`${error}, deu ruim família.`);
      });
  } catch (error) {
    ctx.deleteMessage(message.message_id);
    console.error(`Erro ao obter informações do link: ${error}`);
    await ctx.reply(`Ocorreu um erro ao obter informações do da música. Envie novamente um link do YouTube.`);
  }
};