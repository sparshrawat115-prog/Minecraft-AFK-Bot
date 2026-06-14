const mineflayer = require('mineflayer');
let config;

try {
  config = require('./config.json');
} catch (e) {
  config = {};
}

const settings = {
  host: process.env.SERVER_HOST || config.serverHost || "yourserver.aternos.me",
  port: parseInt(process.env.SERVER_PORT || config.serverPort) || 25565,
  username: process.env.BOT_USERNAME || config.botUsername || "AFK_Bot",
  viewDistance: parseInt(process.env.BOT_CHUNK || config.botChunk) || 4,
  owner: process.env.BOT_OWNER || "",
  password: process.env.BOT_PASSWORD || "" // Pulls securely from Railway
};

function createBot() {
  console.log(`[System] Connecting to ${settings.host}:${settings.port}...`);
  
  const bot = mineflayer.createBot({
    host: settings.host,
    port: settings.port,
    username: settings.username,
    viewDistance: `${settings.viewDistance}c`,
    auth: 'offline'
  });

  bot.on('spawn', () => {
    console.log(`✓ ${bot.username} joined the server lattice.`);
    
    // Anti-AFK Routine
    setInterval(() => {
      if (!bot || !bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 20000);
  });

  // --- AUTOMATED AUTHME HANDLER ---
  bot.on('messagestr', (message) => {
    if (!settings.password) {
      console.log("[AuthMe Warning] AuthMe prompt detected, but BOT_PASSWORD variable is missing in Railway!");
      return;
    }

    // Detects if the server requires account registration
    if (message.includes('/register')) {
      console.log("[AuthMe] Server requested account registration. Processing...");
      bot.chat(`/register ${settings.password} ${settings.password}`);
    } 
    // Detects if the account is already registered and requires login
    else if (message.includes('/login')) {
      console.log("[AuthMe] Server requested login. Processing...");
      bot.chat(`/login ${settings.password}`);
    }
  });

  // In-game admin controller channel
  bot.on('whisper', (username, message) => {
    if (username !== settings.owner) return; 
    
    if (message.startsWith('say ')) {
      bot.chat(message.replace('say ', ''));
    } else {
      bot.chat(message);
    }
  });

  // Automatic Reconnection Pipeline
  bot.on('end', (reason) => {
    console.log(`[Warning] Disconnected: ${reason}`);
    console.log(`[System] Reconnecting in 15 seconds...`);
    setTimeout(() => createBot(), 15000);
  });

  bot.on('error', (err) => {
    console.error(`[Error] Network exception: ${err.message}`);
  });
}

createBot();
