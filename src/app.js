const Discord = require("discord.js");
const Stats = require("./stats.js"); //get rid of
const fs = require("fs");
const loadFiles = require("./functions/loadFiles.js");

console.log("Starting ZaloduBot...");

let startTime = Date.now(); //use client.uptime instead??
let client = new Discord.Client();

// Extend client
client.config = require("../config.js");
client.functions = {};
client.modules = {};

// Extend client with Discord.js methods for use in modules
client.methods = {};
client.methods.RichEmbed = Discord.RichEmbed;


console.log("Loading functions...");
loadFiles("./src/functions").then((result) => {
    client.functions = result.requires;
    console.log("Finished loading " + result.count + " functions.");
    if (client.functions.hasOwnProperty("exampleFunction")) {
        client.functions.exampleFunction();
    }

    console.log("Loading modules...");
    loadFiles("./src/modules").then((result) => {
        client.modules = result.requires;
        console.log("Finished loading " + result.count + " modules.");

        // init event stuff
        if (client.modules.hasOwnProperty("exampleModule")) {
            if (client.modules.exampleModule.config.enabled) {
                client.modules.exampleModule.commands.hi.run();
            }
        }
    });

    console.log("Authenticating...");
    client.login(client.config.authentication.bot_token);
});

client.once("ready", () => {
    let guildsArray = client.guilds.array();
    client.user.setStatus(client.config.user.status);
    console.log("Bot is live! Serving " + guildsArray.length + " servers.");

    Stats.initStats(guildsArray);
});

client.on("disconnected", () => {
    console.log("Bot disconnected");
    process.exit(1); //exits node.js with an error
});

/* BUNCH OF EVENTS */

client.on("message", function (message) {
    if (!message.author.bot && message.content[0] == "!" && message.content.length > 1) {
        let words = message.content.split(" ");
        let command = words[0].slice(1);
        let params;
        if (words.length > 1) { params = words.slice(1); }
        else { params = false; }
        let mentions = message.mentions;

        // Restarts the bot
        if (command == "restart") {

        }
        // Outputs the amount of channels the bot has access to in the server
        else if (command == "channels") {
        /*
          let channels = message.guild.channels.filter(function (c) {
            return c.permissionsFor(bot.user).serialize()["READ_MESSAGES"];
          });

          message.channel.sendMessage("Able to track statistics for " + channels.array().length + " channels on this server.");
        }
        */
        }

        // Looks up and displays all known usernames and nicknames for the given user
        else if (command == "names") {
            let startTime = Date.now();
            let userId;

            let error = 0;
            // no parameters
            if (!params) {
                error = 1;
                userId = false;
            } 
            else {
                let userByDisplayName = message.guild.members.find((member) => { return member.displayName.toUpperCase() == params[0].toUpperCase(); });
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
                let usernames = Stats.getUsernames(userId);
                let nicknames = Stats.getNicknames(userId, message.guild.id);

                let uString = "";
                if (usernames) {
                    for (let key in usernames) {
                        // skip loop if the property is from prototype
                        if (!usernames.hasOwnProperty(key)) { continue; }

                        uString += key + "\n";
                    }
                }
                else {
                    uString = "No usernames recorded for this user.";
                }

                let nString = "";
                if (nicknames) {
                    for (let key in nicknames) {
                        // skip loop if the property is from prototype
                        if (!nicknames.hasOwnProperty(key)) { continue; }

                        nString += key + "\n";
                    }
                }
                else {
                    nString = "No nicknames recorded for this user.";
                }

                let member = message.guild.members.get(userId);
                let completionTime = (Date.now() - startTime) / 1000.0;

                let embed = new Discord.RichEmbed()
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
                .then((output) => {
                    //console.log(output);
                })
                .catch((err) => {
                    console.log("Error during \"" + command + "\" command with params:");
                    console.log(params);
                    console.log(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
                });
            }
            // Error ocurred
            else {
                let errorString;
                if (error) {
                    if (error == 1) { errorString = "Incorrect parameters, please include a user id, a displayname of a user, or a user mention."; }
                    if (error == 2) { errorString = "No user \"" + params[0] + "\" found"; }
                }
                else { errorString = "An unknown error has ocurred";}

                client.functions.errorResponse(client, message.channel, errorString, (Date.now() - startTime) / 1000.0);
            }     
        }
        // Finds and displays all users that have been seen using the given name
        else if (command == "users") {
            let startTime = Date.now();
            if (params) {
                let data = Stats.getUsersByName(params[0], message.guild);

                if (!data.error.code) {
                    let nString = "";
                    let iString = "";
                    for (let memberKey in data.foundUsers) {
                        member = data.foundUsers[memberKey];
                        nString += member.displayName + "\n";
                        iString += memberKey + "\n";
                    }
                    let completionTime = (Date.now() - startTime) / 1000.0;

                    let embed = new Discord.RichEmbed()
                    .setColor(client.config.embeds.defaultColor)
                    .setFooter("Time to complete: " + completionTime + " seconds.")
                    .setTitle("Result")
                    .setDescription("All users that have been seen using the name **" + params[0] + "**:")
                    .addField("Current name", nString, true)
                    .addField("ID", iString, true);

                    message.channel.sendEmbed(
                      embed,
                      '',
                      { disableEveryone: true }
                    )
                    .then((output) => {
                        //console.log(output);
                    })
                    .catch((err) => {
                        console.log("Error during \"" + command + "\" command with params:");
                        console.log(params);
                        console.log(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
                    });
                }
                // Error ocurred
                else {
                    if (data.error.message.length > 0) { var errorString = data.error.message; }
                    else { var errorString = "An unknown error has ocurred."; }
                    client.functions.errorResponse(client, message.channel, errorString, (Date.now() - startTime) / 1000.0);
                }
            }
            // Error: no parameters
            else {
                client.functions.errorResponse(client, message.channel, "Incorrect parameters, please include a name.", (Date.now() - startTime) / 1000.0);
            }
        }
    }
    /* let's focus on config for now
    if(!message.author.bot) {
      Stats.incrementCount(message);
    }
    */
});

client.on("channelCreate", (channel) => {
    if (channel.type == "text") {
        Stats.channelCreate(channel); 
    }
});

client.on("channelUpdate", (oldChannel, newChannel) => {
    if (oldChannel.type == "text") {
        Stats.channelUpdate(oldChannel, newChannel);
    }
});


client.on("guildMemberUpdate", (oldMember, newMember) => {
    Stats.guildMemberUpdate(oldMember, newMember);
});

client.on("userUpdate", (oldUser, newUser) => {
    Stats.userUpdate(oldUser, newUser);
});

client.on("guildMemberAdd", (member) => {
    Stats.guildMemberAdd(member);
});

client.on("guildCreate", (guild) => {
    Stats.guildCreate(guild);
});

client.on("guildUpdate", (oldGuild, newGuild) => {
    Stats.guildUpdate(oldGuild, newGuild);
});