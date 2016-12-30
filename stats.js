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
      /* Create empty stats file if there's no stats file */
      stats = {};
      self.saveStats();
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
    console.log("New channel \"" + channel.name + "\" created");
    stats.guilds[channel.guild.id].channels[channel.id] = {"name": channel.name, "users": {}}
    self.saveStats();
  },

  channelUpdate: function (oldChannel, newChannel) {
    if (oldChannel.name != newChannel.name) {
      console.log("Channel \"" + oldChannel.name + "\" renamed to \"" + newChannel.name + "\"");
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

  userUpdate: function (id, oldUsername, newUsername) {
    if (oldUsername != newUsername) {
      var guildsArray = stats.guilds;
      var guildKeys = Object.keys(guildsArray);

      for (var i = 0; i < guildKeys.length; i++) {
        var channelsArray = guildsArray[guildKeys[i]].channels;
        var channelKeys = Object.keys(channelsArray);

        for (var j = 0; j < channelKeys.length; j++) {
          if(channelsArray[channelKeys[j]].users.hasOwnProperty(id)) {
            channelsArray[channelKeys[j]].users[id].username = newUsername;
          }
        }
      }
      self.saveStats();
    }
  }
}
