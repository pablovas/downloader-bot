module.exports = {
  botToken: '6184852469:AAFmixLWmBRBNGMgo3jaESxJFKwz2GPU7UQ',
  logInteraction: function(ctx) {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const timestamp = new Date().toLocaleString();
    console.log(`ID do usuário: ${userId}`);
    console.log(`Username do usuário: ${username}`);
    console.log(`Horário: ${timestamp}`);
  }
};