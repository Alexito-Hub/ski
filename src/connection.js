const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const pino = require('pino')
exports.connect = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(
    "./assets/auth/baileys"
  )
  const level = pino({ level: "silent"})
  const bot = makeWASocket({
    logger: level,
    printQRInTerminal: true,
    auth: state,
    defaultQueryTimeoutMs: undefined,
  });

  bot.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        this.connect();
      }
    }
  });

  bot.ev.on("creds.update", saveCreds);

  return bot;
};
