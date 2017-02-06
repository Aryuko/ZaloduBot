var Stats = require("./stats.js");
var fs = require("fs");
var defaultColor = "#738BD7"; //TODO: move this to config
var errorColor = "#f74f25"; //TODO: this one too

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

  bot.user.setStatus("invisible");

  Stats.initStats(guildsArray);
});

bot.on("disconnected", function () {
  console.log("Bot disconnected");
  process.exit(1); //exits node.js with an error
});


bot.on("message", function (message) {
  if (!message.author.bot && message.content[0] == "!" && message.content.length > 1) {
    var words = message.content.split(" ");
    var command = words[0].slice(1);
    var params;
    if (words.length > 1) { params = words.slice(1); }
    else { params = false; }
    var mentions = message.mentions;

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

    // Looks up and displays all known usernames and nicknames for the given user
    else if (command == "names") {
      var startTime = Date.now();
      var userId;

      var error = 0;
      // no parameters
      if (!params) {
        error = 1;
        userId = false;
      } 
      else {
        var userByDisplayName = message.guild.members.find(function (member) { return member.displayName.toUpperCase() == params[0].toUpperCase(); });
        // if user is mentioned
        if (mentions.users.array().length > 0) {
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
          error = 2;
          userId = false;
        }
      }
      

      if (userId) {
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
        var completionTime = (Date.now() - startTime) / 1000.0;

        var embed = new Discord.RichEmbed()
          .setAuthor(member.displayName, member.user.avatarURL)
          .setColor(member.highestRole.color)
          .setFooter("Time to complete: " + completionTime + " seconds.")
          .addField("Usernames", uString, true)
          .addField("Nicknames", nString, true);

        message.channel.sendEmbed(
          embed,
          '',
          { disableEveryone: true }
        )
        .then(function (output) {
          //console.log(output);
        })
        .catch(function (err) {
          console.log("Error during \"" + command + "\" command with params:");
          console.log(params);
          console.log(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
        });
      }
      // Error ocurred
      else {
        var errorString;
        if (error) {
          if (error == 1) { errorString = "Incorrect parameters, please include a user id, a displayname of a user, or a user mention."; }
          if (error == 2) { errorString = "No user \"" + params[0] + "\" found"; }
        }
        else { errorString = "An unknown error has ocurred";}

        errorResponse(message.channel, errorString, (Date.now() - startTime) / 1000.0);
      }     
    }
    // Finds and displays all users that have used the given displayname
    else if (command == "users") {
      var startTime = Date.now();
      if (params) {
        var data = Stats.getUsersByName(params[0], message.guild);

        if (!data.error.code) {
          var nString = "";
          var iString = "";
          for (var memberKey in data.foundUsers) {
            member = data.foundUsers[memberKey];
            nString += member.displayName + "\n";
            iString += memberKey + "\n";
          }
          var completionTime = (Date.now() - startTime) / 1000.0;

          var embed = new Discord.RichEmbed()
          .setColor(defaultColor)
          .setFooter("Time to complete: " + completionTime + " seconds.")
          .setTitle("Result")
          .setDescription("All users that have used the name **" + params[0] + "** at any point.")
          .addField("Current name", nString, true)
          .addField("ID", iString, true);

          message.channel.sendEmbed(
            embed,
            '',
            { disableEveryone: true }
          )
          .then(function (output) {
            //console.log(output);
          })
          .catch(function (err) {
            console.log("Error during \"" + command + "\" command with params:");
            console.log(params);
            console.log(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
          }); 
        }
        // Error ocurred
        else {
          if (data.error.message.length > 0) { var errorString = data.error.message; }
          else { var errorString = "An unknown error has ocurred."; }
          errorResponse(message.channel, errorString, (Date.now() - startTime) / 1000.0);
        }
      }
      // Error: no parameters
      else {
        errorResponse(message.channel, "Incorrect parameters, please include a name.", (Date.now() - startTime) / 1000.0);
      }
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

bot.on("guildCreate", function (guild) {
  Stats.guildCreate(guild);
});

bot.on("guildUpdate", function (oldGuild, newGuild) {
  Stats.guildUpdate(oldGuild, newGuild);
});

function errorResponse (channel, message, completionTime) {
  var embed = new Discord.RichEmbed()
  .setColor(errorColor)
  .addField("Error", message)
  .setFooter("Time to complete: " + completionTime + " seconds.");

  channel.sendEmbed(
    embed,
    "",
    { disableEveryone: true }
  )
  .then(function (output) {
    //console.log(output);
  })
  .catch(function (err) {
    console.log("Error: ");
    console.log(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
  });
}