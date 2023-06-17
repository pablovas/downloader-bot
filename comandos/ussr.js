module.exports = async (ctx) => {
  const message = await ctx.reply('Um momento camarada');
    try {
        await ctx.replyWithAudio({ source: './comandos/cccp.mp3' });
        await ctx.deleteMessage(message.message_id);
    } catch (error) {
      console.error('Ocorreu um erro durante a execução do script:', error);
      ctx.reply('Desculpe, ocorreu um erro durante a execução do script. XD', error);
    }
  };