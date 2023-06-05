// Importando os módulos necessários
const Telegraf = require('telegraf');
const fs = require('fs');
const { spawn } = require('child_process');
const ytdl = require('ytdl-core');
const config = require('./config');

// Criando uma nova instância do bot com o token fornecido
const bot = new Telegraf(config.botToken);

// Mensagem de bem-vindo
bot.start((ctx) => {
  ctx.reply('Bem-vindo! Para baixar um MP3 ou MP4, envie o comando /mp3 ou /mp4 seguido do link do arquivo.');
});

// Comando para baixar um vídeo em formato mp4
bot.command('mp4', async (ctx) => {
  // Obtendo a URL do vídeo a partir da mensagem enviada pelo usuário
  const videoUrl = ctx.message.text.split(' ')[1];

  // Definindo o nome do arquivo de saída como 'video.mp4'
  const fileName = 'video.mp4';

  // Criando a legenda que será exibida junto com o vídeo
  const caption = `[🔗Fonte](${videoUrl})`;

  // Executando o comando 'yt-dlp' para baixar o vídeo
  const ytDlp = spawn('yt-dlp', ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '-o', fileName, videoUrl]);

  // Capturando a saída padrão do comando 'yt-dlp'
  ytDlp.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  // Capturando a saída de erro do comando 'yt-dlp'
  ytDlp.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // Capturando o evento de encerramento do comando 'yt-dlp'
  ytDlp.on('close', async (code) => {
    console.log(`yt-dlp process exited with code ${code}`);
    if (code === 0) {
      // Verificando o tamanho do arquivo baixado
      const stats = fs.statSync(fileName);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

      if (fileSizeInMB > 49) {
        // Se o arquivo for muito grande, envia uma mensagem informando ao usuário
        ctx.reply('O arquivo original é muito grande e não pode ser enviado.')
          .then(() => {
            // Exclui o arquivo baixado
            fs.unlinkSync(fileName);
            console.log(`Arquivo ${fileName} excluído com sucesso.`);
          });
        
        try {
          // Obtendo informações do vídeo usando a biblioteca ytdl
          const info = await ytdl.getInfo(videoUrl);
          const videoTitle = info.videoDetails.title;
          const fileName = `${videoTitle}.mp4`;
  
          // Baixando o vídeo em um formato de menor tamanho (qualidade 134)
          const video = ytdl(videoUrl, { quality: '134' });
  
          // Enviando o vídeo para o usuário
          ctx.replyWithVideo({ source: video }, { caption: caption, parse_mode: 'Markdown' })
            .then(() => {
              console.log(`Arquivo ${fileName} enviado com sucesso.`);
            })
            .catch((error) => {
              console.error(`Erro ao enviar o arquivo: ${error}`);
              ctx.reply(`${error}, deu ruim família.`);
            });
          return;
        } catch (error) {
          console.error(`Erro ao obter informações do link: ${error}`);
          ctx.reply(`Ocorreu um erro ao obter informações do link.`);
        }
      }

      // Lendo o conteúdo do arquivo baixado
      const video = fs.readFileSync(fileName);

      // Enviando o vídeo para o usuário
      ctx.replyWithVideo({ source: video }, { caption: caption, parse_mode: 'Markdown' })
        .then(() => {
          // Excluindo o arquivo após o envio
          fs.unlinkSync(fileName);
          console.log(`Arquivo ${fileName} excluído com sucesso.`);
        })
        .catch((error) => {
          console.error(`Erro ao enviar o arquivo: ${error}`);
        });
    } else {
      // Caso ocorra um erro ao baixar o vídeo
      ctx.reply('Ocorreu um erro ao baixar o vídeo.');
    }
  });
});

// Comando para baixar um áudio em formato mp3
bot.command('mp3', async (ctx) => {
  // Obtendo a URL do áudio a partir da mensagem enviada pelo usuário
  const audioUrl = ctx.message.text.split(' ')[1];

  try {
    // Obtendo informações do áudio usando a biblioteca ytdl
    const info = await ytdl.getInfo(audioUrl);
    const videoTitle = info.videoDetails.title;
    const fileName = `${videoTitle}.mp3`;

    // Baixando o áudio
    const stream = ytdl(audioUrl, { quality: 'highestaudio',filter: 'audioonly' });

    // Enviando o áudio para o usuário
    ctx.replyWithAudio({ source: stream, filename: fileName })
      .then(() => {
        console.log(`Arquivo ${fileName} enviado com sucesso.`);
      })
      .catch((error) => {
        console.error(`Erro ao enviar o arquivo: ${error}`);
        ctx.reply(`${error}, deu ruim família.`);
      });
  } catch (error) {
    console.error(`Erro ao obter informações do link: ${error}`);
    ctx.reply(`Ocorreu um erro ao obter informações do link. Envie novamente um link do YouTube.`);
  }
});

// Iniciando o bot
bot.launch();