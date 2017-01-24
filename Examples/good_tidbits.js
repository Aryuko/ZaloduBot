/*  promise example */
message.channel.sendMessage("Specified channel not found.")
.then(function (output) {
  //console.log(output);
})
.catch(function (err) {
  console.log("Error during \"" + command + "\" command with params:");
  console.log(params);
  console.log(err.response.statusCode + ": " + err.response.res.statusMessage + ", " + err.response.res.text);
});
