const desktopCapture = require('screenshot-desktop');
const sharp = require('sharp');

module.exports = async (ctx) => {
  try {
    desktopCapture().then(async (imgPath) => {
      // Redimensiona a imagem para 1600 pixels de largura mantendo a proporção
      const resizedImage = await sharp(imgPath).resize(1600).toBuffer();

      const compressedImage = await sharp(resizedImage).jpeg({ quality: 100 }).toBuffer();

      ctx.replyWithPhoto({ source: compressedImage });
    });
  } catch (error) {
    console.error('Ocorreu um erro durante o print:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o print do erro. XD', error);
  }
};