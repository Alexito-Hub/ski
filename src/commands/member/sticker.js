const { PREFIX, TEMP_DIR } = require("../../config");
const { InvalidParameterError } = require("../../errors/InvalidParameterError");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = {
  name: "sticker",
  description: "Faço figurinhas de imagem/gif e vídeo",
  commands: ["s", "sticker", "fig", "f"],
  usage: `${PREFIX}sticker (marque a imagem/gif/video) ou ${PREFIX}sticker (responda a imagem/gif/video)`,
  handle: async ({
    isImage,
    isVideo,
    downloadImage,
    downloadVideo,
    baileysMessage,
    sendErrorReply,
    sendSuccessReact,
    sendStickerFromFile,
  }) => {
    if (!isImage && !isVideo) {
      throw new InvalidParameterError(
        "Você precisa marcar uma imagem/gif/video ou responder a uma imagem/gif/video"
      );
    }

    const outputPath = path.resolve(TEMP_DIR, "output.webp");

    if (isImage) {
      const inputPath = await downloadImage(baileysMessage, "input");

      exec(
        `cp ${inputPath} ${outputPath}`,        
        async (error) => {
          if (error) {
            console.log(error);
            fs.unlinkSync(inputPath);
            throw new Error(error);
          }

          await sendSuccessReact();

          await sendStickerFromFile(outputPath);

          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        }
      );
    } else {
      const inputPath = await downloadVideo(baileysMessage, "input");

      const sizeInSeconds = 10;

      const seconds =
        baileysMessage.message?.videoMessage?.seconds ||
        baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage
          ?.videoMessage?.seconds;

      const haveSecondsRule = seconds <= sizeInSeconds;

      if (!haveSecondsRule) {
        fs.unlinkSync(inputPath);

        await sendErrorReply(`O vídeo que você enviou tem mais de ${sizeInSeconds} segundos!

Envie um vídeo menor!`);

        return;
      }

      exec(
        `-vcodec copy`
        async (error) => {
          if (error) {
            fs.unlinkSync(inputPath);

            throw new Error(error);
          }

          await sendSuccessReact();
          await sendStickerFromFile(outputPath);

          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        }
      );
    }
  },
};
