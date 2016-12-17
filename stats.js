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
    if(!stats.hasOwnProperty("guilds")) {
      stats = {"guilds" : {}};
    }

    for (var i = 0; i < guildsArray.length; i++) {
      if(!stats.guilds.hasOwnProperty(guildsArray[i].name)) {
        stats.guilds[guildsArray[i].name] = {"channels" : {}};
      }
      var channelsArray = guildsArray[i].channels.array();
      for (var j = 0; j < channelsArray.length; j++) {
        if(channelsArray[j].type == "text") {
          stats.guilds[guildsArray[i].name].channels[channelsArray[j].id] = {"name": channelsArray[j].name, "messageCount": 0};
        }
      }
    }
    self.saveStats();
  },

  addNewChannel: function (channel) {
    console.log("New channel created on " + channel.guild.name + " server: " + channel.name);
    stats.guilds[channel.guild.name].channels[channel.id] = {"name": channel.name, "messageCount": 0}
    self.saveStats();
  },

  incrementCount: function (message) {
    messageCounter++;
    stats.guilds[message.guild.name].channels[message.channel.id].messageCount++;
    self.saveStats();
  }
}
