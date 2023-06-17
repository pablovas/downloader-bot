module.exports = async (ctx) => {
    try {
        await ctx.replyWithAudio({ source: './comandos/cccp.mp3' });
    } catch (error) {
      console.error('Ocorreu um erro durante a execução do script:', error);
      ctx.reply('Desculpe, ocorreu um erro durante a execução do script. XD', error);
    }
  };