module.exports = {
    "config": {
        "enabled": true
    },
    "commands": {
        "hi": {
            "run": () => {
                console.log("Hi!");
            },
            "config": {
                enabled: true,
                guildOnly: true,
                aliases: []
            }
        }
    },
    "events": {

    }
};
