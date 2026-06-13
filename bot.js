const mineflayer = require('mineflayer');
let config;

// Safely fall back to config.json if environment variables aren't present
try {
  config = require('./config.json');
} catch (e) {
  config = {};
}

// Setup configuration combining Railway variables with config.json fallbacks
const settings = {
  host: process.env.SERVER_HOST || config.serverHost || "yourserver.aternos.me",
  port: parseInt(process.env.SERVER_PORT || config.serverPort) || 25565,
  username: process.env.BOT_USERNAME || config.botUsername || "AFK_Bot",
  viewDistance: parseInt(process.env.BOT_CHUNK || config.botChunk) || 4,
  owner: process.env.BOT_OWNER || "" 
};

function createBot() {
  console.log(`[System] Connecting to ${settings.host}:${settings.port} as ${settings.username}...`);
  
  const bot = mineflayer.createBot({
    host: settings.host,
    port: settings.port,
    username: settings.username,
    viewDistance: `${settings.viewDistance}c`,
    auth: 'offline' // Aternos typically requires offline mode
  });

  bot.on('spawn', () => {
    console.log(`✓ ${bot.username} is Ready inside the server!`);
    
    // Core AFK behavior: jump periodically to prevent standard kick timers
    setInterval(() => {
      if (!bot || !bot.entity) return;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }, 20000);
  });

  // --- INTERACTIVE CONSOLE CHAT FIX ---
  // This allows you to talk through the bot using whispers in-game
  bot.on('whisper', (username, message) => {
    // Security check: Ignore anyone who isn't the declared BOT_OWNER
    if (username !== settings.owner) return; 
    
    console.log(`[In-Game Command from ${username}]: ${message}`);
    
    // If you whisper "say hello everyone", the bot speaks to the whole server
    if (message.startsWith('say ')) {
      const publicMessage = message.replace('say ', '');
      bot.chat(publicMessage);
    } else {
      // Direct processing for executing server commands through the bot (e.g., "/tpa")
      bot.chat(message);
    }
  });

  // --- AUTOMATIC RECONNECT LOOP FIX ---
  bot.on('end', (reason) => {
    console.log(`[Warning] Bot disconnected from server. Reason: ${reason}`);
    console.log(`[System] Initiating automatic reconnection sequence in 15 seconds...`);
    
    setTimeout(() => {
      createBot();
    }, 15000); // Waits 15 seconds before trying again to prevent aggressive server spamming
  });

  bot.on('error', (err) => {
    console.error(`[Error] Mineflayer network error encountered: ${err.message}`);
  });
}

// Launch application
createBot();
