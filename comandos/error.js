const desktopCapture = require('screenshot-desktop');
const sharp = require('sharp');
const config = require('../config');

module.exports = async (ctx) => {
  config.logInteraction(ctx, '/erro');
  try {
    if (ctx.from.id != config.ownerID ){
      ctx.reply('Você não tem permissão para executar este comando.');
    } else {
      desktopCapture().then(async (imgPath) => {
        const resizedImage = await sharp(imgPath).resize(1600).toBuffer();
  
        const compressedImage = await sharp(resizedImage).jpeg({ quality: 100 }).toBuffer();
  
        ctx.replyWithPhoto({ source: compressedImage });
      });
    }
  } catch (error) {
    console.error('Ocorreu um erro durante o print:', error);
    ctx.reply('Desculpe, ocorreu um erro durante o print do erro. XD', error);
  }
};