var Stats = require("./stats.js");
var fs = require("fs");
var embedColour = "#738BD7"; //TODO: Move to serverconfig as embedColour?

var serverconfigFilePath = "./serverconfig.json";
try {
  Serverconfig = require(serverconfigFilePath);
} catch (e) {
  /* Create empty serverconfig file if there's no serverconfig file */
  Serverconfig = {};
  fs.writeFile(serverconfigFilePath, JSON.stringify(stats, null, 2), function (err) {
    if (err) { return console.log(err); }
  });
}

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

  Stats.initStats(guildsArray);
});

bot.on("disconnected", function () {
  console.log("Bot disconnected");
  process.exit(1); //exits node.js with an error
});


bot.on("message", function (message) {
  //if (!message.author.bot && message.content[0] == Serverconfig.guilds[message.guild.id].commandPrefix && message.content.length > 1) {
  if (!message.author.bot && message.content[0] == "!" && message.content.length > 1) {
    var command = message.content.split(" ")[0].slice(1);
    var params = message.content.split(" ").slice(1);
    var mentions = message.mentions;

    /*
    console.log(message.content);
    console.log(command);
    console.log(params);
    */

    // Set up serverconfig
    /*
    if (command == "setup") {
      if(hasPermission(message)) {
        //Start some kind of conversation mode? Locked to the one user?
        message.channel.sendMessage("");
      }
      else {
        message.channel.sendMessage("Access denied.");
      }
    }
    */
    // Restarts the bot
    if (command == "restart") {

    }
    // Outputs the amount of channels the bot has access to in the server
    else if (command == "channels") {
    /*
      var channels = message.guild.channels.filter(function (c) {
        return c.permissionsFor(bot.user).serialize()["READ_MESSAGES"];
      });

      message.channel.sendMessage("Able to track statistics for " + channels.array().length + " channels on this server.");
    }
    */
    }

    // Looks up and returns all known usernames and nicknames for the given user
    else if (command == "names") {
      var startTime = Date.now();
      var userId;
      var userByDisplayName = message.guild.members.find(function (member) { return member.displayName == params[0]; });

      // no parameters
      if (params.length < 1) {
        message.channel.sendMessage("Incorrect parameters, please include a user id, a displayname of a user, or a user mention.");
      }
      // if user is mentioned
      else if (mentions.users.array().length > 0) {
        userId = mentions.users.array()[0].id;
        //message.channel.sendMessage("User " + mentions.users.array()[0].username + " found on this server.");
      }
      // if parameter is a user id
      else if (message.guild.members.has(params[0])) {
        userId = params[0];
        //message.channel.sendMessage("User id " + message.guild.members.get(userId) + " found on this server.");
      }
      // if parameter is a user displayname
      else if (userByDisplayName) {
        userId = userByDisplayName.id;
        //message.channel.sendMessage("User " + userByDisplayName.displayName + " found on this server.");
      }
      // no user found
      else {
        message.channel.sendMessage("No user \"" + params[0] + "\" found.");
        return;
      }
      var usernames = Stats.getUsernames(userId);
      var nicknames = Stats.getNicknames(userId, message.guild.id);

      var uString = "";
      if (usernames) {
        for (var key in usernames) {
          // skip loop if the property is from prototype
          if (!usernames.hasOwnProperty(key)) { continue; }

          uString += key + "\n";
        }
      }
      else {
        uString = "No usernames recorded for this user.";
      }

      var nString = "";
      if (nicknames) {
        for (var key in nicknames) {
          // skip loop if the property is from prototype
          if (!nicknames.hasOwnProperty(key)) { continue; }

          nString += key + "\n";
        }
      }
      else {
        nString = "No nicknames recorded for this user.";
      }

      var member = message.guild.members.get(userId);
      var finalTime = (Date.now() - startTime) / 1000.0;

      var embed = new Discord.RichEmbed()
      .setAuthor(member.displayName, member.user.avatarURL)
      .setColor(embedColour)
      .setFooter("Lookup took " + finalTime + " seconds.")
      .addField("Usernames", uString, true)
      .addField("Nicknames", nString, true)

      message.channel.sendEmbed(
        embed,
        '',
        { disableEveryone: true }
      );
    }
    // Finds all users that have used the given displayname
    else if (command == "") {

    }
  }
  /* let's focus on config for now
  if(!message.author.bot) {
    Stats.incrementCount(message);
  }
  */
});


bot.on("channelCreate", function (channel) {
  if (channel.type == "text") {
    Stats.channelCreate(channel); 
  }
});

bot.on("channelUpdate", function (oldChannel, newChannel) {
  if (oldChannel.type == "text") {
    Stats.channelUpdate(oldChannel, newChannel);
  }
});


bot.on("guildMemberUpdate", function (oldMember, newMember) {
  Stats.guildMemberUpdate(oldMember, newMember);
});

bot.on("userUpdate", function (oldUser, newUser) {
  Stats.userUpdate(oldUser, newUser);
});

bot.on("guildMemberAdd", function (member) {
  Stats.guildMemberAdd(member);
});

/*  not necessary atm
function hasPermission(message) {
  if (message.author.id == message.guild.owner.id || author has admin permission node || author has one dev role) {

  }
}*/
