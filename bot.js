const mineflayer = require('mineflayer');
let config;

try {
  config = require('./config.json');
} catch (e) {
  config = {};
}

const settings = {
  host: process.env.SERVER_HOST || config.serverHost || "karmasmp.ddns.net",
  port: parseInt(process.env.SERVER_PORT || config.serverPort) || 25565,
  username: process.env.BOT_USERNAME || config.botUsername || "AFK_Bot",
  viewDistance: 4, // Hardcoded to a strict integer to completely eliminate string parsing issues
  owner: process.env.BOT_OWNER || "",
  password: process.env.BOT_PASSWORD || "" 
};

function createBot() {
  console.log(`[System] Connecting to ${settings.host}:${settings.port}...`);
  
  const bot = mineflayer.createBot({
    host: settings.host,
    port: settings.port,
    username: settings.username,
    viewDistance: 4, // Completely hardcoded clean integer
    auth: 'offline'
  });

  bot.on('spawn', () => {
    console.log(`✓ ${bot.username} successfully spawned in the server!`);
    
    // Anti-AFK Routine
    setInterval(() => {
      if (!bot || !bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 20000);
  });

  // --- AUTOMATED AUTHME HANDLER ---
  bot.on('messagestr', (message) => {
    if (!settings.password) return;

    if (message.includes('/register')) {
      console.log("[AuthMe] Server requested account registration. Processing...");
      bot.chat(`/register ${settings.password} ${settings.password}`);
    } 
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
