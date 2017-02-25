module.exports = (client, channel, message, completionTime) => {
    let embed = new client.methods.RichEmbed()
    .setColor(client.config.embeds.errorColor)
    .addField("Error", message)
    .setFooter("Time to complete: " + completionTime + " seconds.");

    channel.sendEmbed(
      embed,
      "",
      { disableEveryone: true }
    )
    .then((output) => {
        //console.log(output);
    })
    .catch((err) => {
        console.error(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
    });
}