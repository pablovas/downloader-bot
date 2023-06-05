const axios = require('axios');

// Função para encurtar o URL usando a API do is.gd
async function shortenUrl(url) {
  const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
  const response = await axios.get(apiUrl);
  return response.data;
}

module.exports = async (ctx) => {
  const longUrl = ctx.message.text.split(' ')[1];

  try {
    const shortenedUrl = await shortenUrl(longUrl);
    ctx.replyWithHTML(`<a href="${shortenedUrl}">${shortenedUrl}</a>`, { disable_web_page_preview: true });
  } catch (error) {
    ctx.reply('Ocorreu um erro ao encurtar o link.');
  }
};