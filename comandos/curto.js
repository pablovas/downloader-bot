const axios = require('axios');

// Função para encurtar o URL usando a API do is.gd
async function shortenUrl(url) {
  const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
  const response = await axios.get(apiUrl); // Faz uma solicitação GET para a API do is.gd
  return response.data; // Retorna a URL encurtada fornecida pela resposta da API
}

module.exports = async (ctx) => {
  const longUrl = ctx.message.text.split(' ')[1]; // Obtém o URL longo a partir da mensagem recebida

  try {
    const shortenedUrl = await shortenUrl(longUrl); // Encurta o URL usando a função shortenUrl
    await ctx.replyWithHTML(`<a href="${shortenedUrl}">${shortenedUrl}</a>`, { disable_web_page_preview: true });
    // Envia a resposta contendo o URL encurtado como um link HTML
    // O disable_web_page_preview é definido como true para evitar que a visualização da página seja exibida pelo Telegram
  } catch (error) {
    await ctx.reply('Ocorreu um erro ao encurtar o link.'); // Retorna uma mensagem de erro em caso de exceção
  }
};