var fs = require("fs");
var statsFilePath = "./stats.json";
var stats;
var messageCounter =  0;

var self = module.exports = {
  stats: stats,
  loadStats: function () {
    try {
      stats = require(statsFilePath);
    } catch (e) {
      //create file??
      console.log("Missing stats file: " + e);
      process.exit(1);
    }
  },

  saveStats: function () {
      fs.writeFile(statsFilePath, JSON.stringify(stats, null, 2), function (err) {
        if (err) return console.log(err);
        self.loadStats(); //Unnecessary?
      });
  },

  //check if there's an entry for each server, if
  initGuildStats: function (guildsArray) {
    self.loadStats();
    if (!stats.hasOwnProperty("guilds")) {
      stats = {"guilds" : {}};
    }

    for (var i = 0; i < guildsArray.length; i++) {
      if (!stats.guilds.hasOwnProperty(guildsArray[i].id)) {
        stats.guilds[guildsArray[i].id] = {"name": guildsArray[i].name, "channels": {}};
      }
      var channelsArray = guildsArray[i].channels.array();
      for (var j = 0; j < channelsArray.length; j++) {
        if (channelsArray[j].type == "text") {
          stats.guilds[guildsArray[i].id].channels[channelsArray[j].id] = {"name": channelsArray[j].name, "users": {}};
        }
      }
    }
    self.saveStats();
  },

  channelCreate: function (channel) {
    console.log("New channel \"" + channel.name + "\" created on server \"" + channel.guild.name + "\"");
    stats.guilds[channel.guild.id].channels[channel.id] = {"name": channel.name, "users": {}}
    self.saveStats();
  },

  channelUpdate: function (oldChannel, newChannel) {
    if (oldChannel.name != newChannel.name) {
      console.log("Channel \"" + oldChannel.name + "\" on server \"" + oldChannel.guild.name + "\" renamed to \"" + newChannel.name + "\"");
      stats.guilds[oldChannel.guild.id].channels[oldChannel.id].name = newChannel.name;
      self.saveStats();
    }
  },

  incrementCount: function (message) {
    messageCounter++;
    /* if there's no record for the user for the channel, add a record*/
    if (!stats.guilds[message.guild.id].channels[message.channel.id].users.hasOwnProperty(message.author.id)) {
      stats.guilds[message.guild.id].channels[message.channel.id].users[message.author.id] = {"username": message.author.username, "messageCount": 0}
    }
    stats.guilds[message.guild.id].channels[message.channel.id].users[message.author.id].messageCount++;
    self.saveStats();
  },

  userUpdate: function (oldUser, newUser, guildsArray) {
    if (oldUser.username != newUser.username) {
      console.log("User \"" + oldUser.username + "\" renamed to \"" + newUser.username + "\"");
      for (var i = 0; i < guildsArray.length; i++) {
        var channelsArray = guildsArray[i].channels.array();
        for (var j = 0; j < channelsArray.length; j++) {
          if(stats.guilds[guildsArray[i].id].channels[channelsArray[j].id].users.hasOwnProperty(oldUser.id)) {
            stats.guilds[guildsArray[i].id].channels[channelsArray[j].id].users[oldUser.id].username = newUser.username;
          }
        }
      }
      self.saveStats();
    }
  }
}
