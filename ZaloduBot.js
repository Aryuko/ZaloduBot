var Stats = require("./stats.js");

console.log("Starting ZaloduBot...");
try {
  var Discord = require("discord.js");
} catch (e) {
  console.log(e.stack);
  console.log(process.version);
  process.exit();
}

console.log("Authenticating...");
try {
  var authentication = require("./auth.json");
} catch (e) {
  console.log("Missing auth.json: " + e);
  process.exit();
}

var startTime = Date.now(); //use client.uptime instead??
var bot = new Discord.Client();

console.log("Logging in...");
bot.login(authentication.bot_token);


bot.on("ready", function () {
  var guildsArray = bot.guilds.array();
  console.log("Bot is alive! Serving " + guildsArray.length + " servers.");

  bot.user.setStatus("online");
  bot.user.setGame(":D");

  Stats.initGuildStats(guildsArray);
});

bot.on("disconnected", function () {
  console.log("Bot disconnected D:");
  process.exit(1);  //exits node.js with an error
});


bot.on("message", function (message) {
  if(!message.author.bot) {
    Stats.incrementCount(message);
  }
});

bot.on("channelCreate", function (channel) {
  Stats.addNewChannel(channel);
});
