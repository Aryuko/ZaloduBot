var fs = require("fs");
var statsFilePath = "./stats.json";
var stats;
var messageCounter = 0;

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

  // Saves the global stats variable to the json file at statsFilePath
  saveStats: function () {
      fs.writeFile(statsFilePath, JSON.stringify(stats, null, 2), function (err) {
        if (err) { return console.log(err); }
        self.loadStats(); //Unnecessary?
      });
    },

  // Build the json stats file with the given guilds.
  initStats: function (guildsArray) {
    self.loadStats();
    if (!stats.hasOwnProperty("guilds")) {
      stats = {"guilds" : {}, "users": {}};
    }

    // For all guilds in given array of guilds
    for (var i = 0; i < guildsArray.length; i++) {
      // If there's no record of the guild, add an empty record
      if (!stats.guilds.hasOwnProperty(guildsArray[i].id)) {
        stats.guilds[guildsArray[i].id] = {"name": guildsArray[i].name, "members": {}, "channels": {}};
      }
      var statsGuild = stats.guilds[guildsArray[i].id];

      // For all members in the guild
      var membersArray = guildsArray[i].members.array();
      for (var j = 0; j < membersArray.length; j++) {
        // If there's no entry for the member, add a record containing current username and nickname
        if (!statsGuild.members.hasOwnProperty(membersArray[j].id)) {
          statsGuild.members[membersArray[j].id] = {"discriminator": membersArray[j].user.discriminator, "displayName": membersArray[j].displayName, "usernames": {}, "nicknames": {}};
          statsGuild.members[membersArray[j].id].usernames[membersArray[j].user.username] = {};
          statsGuild.members[membersArray[j].id].nicknames[membersArray[j].nickname] = {};
        }
        var statsMember = statsGuild.members[membersArray[j].id];

        // If username is different from saved username, add the new one
        if (membersArray[j].user.username != statsMember.username) {
          statsMember.usernames[membersArray[j].user.username] = {};
        }

        // If nickname is different from saved nickname, add the new one
        if (membersArray[j].nickname != statsMember.nickname) {
          statsMember.nicknames[membersArray[j].nickname] = {};
        }

        // If displayName is different from saved displayName, update it
        if (membersArray[j].displayName != statsMember.displayName) {
          statsMember.displayName = membersArray[j].displayName;
        }
      }

      // For all channels in the guild
      var channelsArray = guildsArray[i].channels.array();
      for (var j = 0; j < channelsArray.length; j++) {
        // Only proceed for text channels
        if (channelsArray[j].type == "text") {
          // If there's no entry for the channel, add an empty record
          if (!statsGuild.channels.hasOwnProperty(channelsArray[j].id)) {
            statsGuild.channels[channelsArray[j].id] = {"name": channelsArray[j].name, "users": {}};
          }
          var statsChannel = statsGuild.channels[channelsArray[j].id];

          // If name of channel name is different from saved name, update it
          if (channelsArray[j].name != statsChannel.name) {
            statsChannel.name = channelsArray[j].name;
          }
        }
      }
    }

    self.saveStats();
  },

  channelCreate: function (channel) {
    console.log("New channel \"" + channel.name + "\" created");
    stats.guilds[channel.guild.id].channels[channel.id] = {"name": channel.name, "users": {}};
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
    // if there's no record for the user for the channel, add a record
    if (!stats.guilds[message.guild.id].channels[message.channel.id].users.hasOwnProperty(message.author.id)) {
      stats.guilds[message.guild.id].channels[message.channel.id].users[message.author.id] = {"messageCount": 0};
    }
    stats.guilds[message.guild.id].channels[message.channel.id].users[message.author.id].messageCount++;
    self.saveStats();
  },

  guildMemberUpdate: function (oldMember, newMember) {
    if (oldMember.nickname != newMember.nickname) {
      var statsGuild = stats.guilds[oldMember.guild.id];

      // If there's no record for the user, add a record including the old username
      if (!statsGuild.members.hasOwnProperty(oldMember.id)) {
        statsGuild.members[oldMember.id] = {"discriminator": oldMember.user.discriminator, "displayName": oldMember.displayName, "nicknames": {}};
        statsGuild.members[oldMember.id].nicknames[oldMember.nickname] = {};
      }

      // Add new nickname to list of nicknames
      console.log("User \"" + oldMember.id + "\" changed nickname from \"" + oldMember.nickname + "\" to \"" + newMember.nickname + "\"");
      statsGuild.members[oldMember.id].nicknames[newMember.nickname] = {};

      // Update to new displayName
      statsGuild.members[oldMember.id].displayName = newMember.displayName;

      self.saveStats();
    }
  },

  userUpdate: function (oldUser, newUser) {
    if (oldUser.username != newUser.username) {
      // If there's no record for the user, add a record including the old username
      if (!stats.users.hasOwnProperty(oldUser.id)) {
        stats.users[oldUser.id] = {"usernames": {}};
        stats.users[oldUser.id].usernames[oldUser.username] = {};
      }

      var statsUser = stats.users[oldUser.id];

      // Add new username to list of usernames
      console.log("User \"" + oldUser.id + "\" changed username from \"" + oldUser.username + "\" to \"" + newUser.username + "\"");
      statsUser.usernames[newUser.username] = {};

      // Update to new displayName
      statsUser.displayName = newUser.displayName;

      self.saveStats();
    }
  }
};
