console.log("Starting ZaloduBot...");
try {
  var discord = require("discord.js");
} catch (e) {
  console.log(e.stack);
  console.log(process.version);
  process.exit();
}

console.log("Authenticating...");
try {
  var authentication = require("./auth.json");
} catch (e) {
  console.log("Missing auth.json");
  process.exit();
}

var startTime = Date.now();
var bot = new discord.Client();

console.log("Logging in...");
bot.login(authentication.bot_token);

bot.on("ready", function () {
  console.log("Bot is alive! Serving " + bot.guilds.array().length + " servers.");
  bot.user.setStatus("online", ":D");
});

bot.on("disconnected", function () {
  console.log("Bot disconnected D:");
  process.exit(1);  //exits node.js with an error
});
