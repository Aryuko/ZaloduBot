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

    console.log("Starting data initialization...");
    var totalUsers = 0;
    var newUsers = 0;
    var newUsernames = 0;
    var newNicknames = 0;
    var startTime = Date.now();

    // For all guilds in given array of guilds
    for (var i = 0; i < guildsArray.length; i++) {
      var info = self.indexGuild(guildsArray[i]);
      totalUsers += info.numUsers;
      newUsers += info.newUsers;
      newUsernames += info.newUsernames;
      newNicknames += info.newNicknames;
    }

    var finalTime = (Date.now() - startTime) / 1000.0;
    console.log("Finished initializing " + guildsArray.length + " guilds with " + totalUsers + " users taking " + finalTime + "s.");
    console.log(newUsers + " new users, " + newUsernames + " users had new usernames, " + newNicknames + " users had new nicknames");
    self.saveStats();
  },

  // Add information to the json stats file for the given guild.
  // Returns an object containing info about what was indexed.
  indexGuild: function (guild) {
    var info = {"numUsers": guild.members.array().length, "newUsers": 0, "newUsernames": 0, "newNicknames": 0};
    // If there's no record of the guild, add an empty record
    if (!stats.guilds.hasOwnProperty(guild.id)) {
      stats.guilds[guild.id] = {"name": guild.name, "members": {}, "channels": {}};
    }
    var statsGuild = stats.guilds[guild.id];

    // For all members in the guild
    var membersArray = guild.members.array();
    for (var j = 0; j < membersArray.length; j++) {
      // If there's no entry for the member, add a record containing current nickname
      if (!statsGuild.members.hasOwnProperty(membersArray[j].id)) {
        statsGuild.members[membersArray[j].id] = {"discriminator": membersArray[j].user.discriminator, "displayName": membersArray[j].displayName, "nicknames": {}};
        // Only add the nickname if it is not null
        if (membersArray[j].nickname != null) {
          statsGuild.members[membersArray[j].id].nicknames[membersArray[j].nickname] = {};
        }
      }

      // If there's no record for the user, add a record including the current username
      if (!stats.users.hasOwnProperty(membersArray[j].id)) {
        stats.users[membersArray[j].id] = {"usernames": {}};
        stats.users[membersArray[j].id].usernames[membersArray[j].user.username] = {};
        info.newUsers ++;
      }

      var statsMember = statsGuild.members[membersArray[j].id];
      var statsUser = stats.users[membersArray[j].id];

      // If there's no record for the current username, add the new one
      if (!statsUser.usernames.hasOwnProperty(membersArray[j].user.username)) {
        statsUser.usernames[membersArray[j].user.username] = {};
        info.newUsernames ++;
      }

      // If there's no record for the current nickname and it is not null, add the new one
      if (!statsMember.nicknames.hasOwnProperty(membersArray[j].nickname) && membersArray[j].nickname != null) {
        statsMember.nicknames[membersArray[j].nickname] = {};
        info.newNicknames ++;
      }

      // If displayName is different from saved displayName, update it
      if (membersArray[j].displayName != statsMember.displayName) {
        statsMember.displayName = membersArray[j].displayName;
      }
    }

    // For all channels in the guild
    var channelsArray = guild.channels.array();
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
    return info;
  },

  getUsernames: function (userId) {
    if (stats.users.hasOwnProperty(userId)) {
      if (Object.keys(stats.users[userId].usernames).length > 0) {
        return stats.users[userId].usernames;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  },

  getNicknames: function (userId, guildId) {
    if (stats.guilds[guildId].members.hasOwnProperty(userId)) {
      if (Object.keys(stats.guilds[guildId].members[userId].nicknames).length > 0) {
        return stats.guilds[guildId].members[userId].nicknames;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  },

  /**
   * Find all members that have used the given name at any point in time
   * in the given guild.  
   * 
   * Returns a map containing a map of users found with their id as key, and errors if any. 
   */
  getUsersByName: function (name, guild) {
    if (name.length > 0) {
      if (stats.guilds.hasOwnProperty(guild.id)) {
        var statsMembers = stats.guilds[guild.id].members;

        var data = { "foundUsers": {}, "error": { "code": 0, "message": "" } };

        // Check through stats for members on the guild
        for (var memberKey in statsMembers) {
          // Check through all saved nicknames for the member
          for (var nickname in statsMembers[memberKey].nicknames) {
            if (nickname.toUpperCase() == name.toUpperCase()) {
              data.foundUsers[memberKey] = statsMembers[memberKey];
              break;
            }
          }
          // Check through all saved usernames for the user, if there exists a record for the user
          if (stats.users.hasOwnProperty(memberKey)) {
            for (var username in stats.users[memberKey].usernames) {
              if (username.toUpperCase() == name.toUpperCase() && !data.foundUsers.hasOwnProperty(memberKey)) {
                data.foundUsers[memberKey] = statsMembers[memberKey];
                break;
              }
            }
          }
        }
        if (Object.keys(data.foundUsers).length > 0) { return data; }
        else { 
          // Error: No users found
          data.error.code = 1;
          data.error.message = "No users \"" + name + "\" found.";
          return data; 
        }
      }
      else {
        // Error: No guild info saved
        data.error.code = 2;
        data.error.message = "No guild stats saved.";
        return data;
      }
    }
    else {
      // Error: No parameter
      data.error.code = 3;
      data.error.message = "No parameter provided.";
      return data;
    }
  },

  /* Events: */
  channelCreate: function (channel) {
    if (stats.guilds.hasOwnProperty(channel.guild.id)) {
      console.log("New channel \"" + channel.name + "\" created");
      stats.guilds[channel.guild.id].channels[channel.id] = {"name": channel.name, "users": {}};
      self.saveStats();
    }
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

      // If there's no record for the member, add a record including the old nickname
      if (!statsGuild.members.hasOwnProperty(oldMember.id)) {
        statsGuild.members[oldMember.id] = {"discriminator": oldMember.user.discriminator, "displayName": oldMember.displayName, "nicknames": {}};
        // Only add the old nickname if it is not null
        if (oldMember.nickname != null) {
          statsGuild.members[oldMember.id].nicknames[oldMember.nickname] = {};
        }
      }

      console.log("User \"" + oldMember.id + "\" changed nickname from \"" + oldMember.nickname + "\" to \"" + newMember.nickname + "\"");
      
      // Add the new nickname to list of nicknames if it is not null
      if (newMember.nickname != null) {
        statsGuild.members[oldMember.id].nicknames[newMember.nickname] = {};
      }
      // Update the display name
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
  },

  guildMemberAdd: function (member) {
    var statsGuild = stats.guilds[member.guild.id];
    console.log("User \"" + member.displayName + "\" joined guild \"" + member.guild.name + "\"");

    // If there's no record for the member, add a record
    if (!statsGuild.members.hasOwnProperty(member.id)) {
      statsGuild.members[member.id] = {"discriminator": member.user.discriminator, "displayName": member.displayName, "nicknames": {}};
    }

    // If the user has a nickname, add nickname to list of nicknames
    if (member.nickname != null) {
      statsGuild.members[member.id].nicknames[member.nickname] = {};
    }

    var user = member.user;
    // If there's no record for the user, add a record
    if (!stats.users.hasOwnProperty(user.id)) {
      stats.users[user.id] = {"usernames": {}};
    }

    // Add new username to list of usernames
    stats.users[user.id].usernames[user.username] = {};

    self.saveStats();
  },

  guildCreate: function (guild) {
    var info = self.indexGuild(guild);
    console.log("Joined a new guild \"" + guild.name + "\", indexed " + info.numUsers + " users.")
    self.saveStats();
  },

  guildUpdate: function (oldGuild, newGuild) {
    // Only proceed if there's a record of the guild
    if (oldGuild.name != newGuild.name) {
      if (stats.guilds.hasOwnProperty(oldGuild.id)) {
        var statsGuild = stats.guilds[oldGuild.id];

        statsGuild.name = newGuild.name;
        console.log("Guild \"" + oldGuild.id + "\" renamed from \"" + oldGuild.name + "\" to \"" + newGuild.name + "\"");

        self.saveStats();
      }
    }
  }
};
