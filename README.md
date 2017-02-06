# ZaloduBot
A discord bot for tracking usernames, nicknames, and stats, with more features planned.

## Installation 

### Essential
1. Clone the repo: ``git clone https://github.com/Zalodu/ZaloduBot``.
2. Install dependencies using npm: ``npm install discord.js``.
3. Create a ``auth.json`` file or rename the ``auth.json.example`` file. Fill in your client ID and bot token, found [here](https://discordapp.com/developers/applications/me).

### Optional:
1. Install the optional dependencies:
    * ``npm install uws`` for a much faster WebSocket connection.
    * ``npm install hammerandchisel/erlpack`` for significantly faster WebSocket data (de)serialisation.

## Usage

### Commands
* ``!names user: mention/id/displayName``
    * Lists all recorded usernames and nicknames for the given user, using either a user mention, the ID of the user, or the current display name of the user as a parameter. 
* ``!users name: string``
    * Lists all recorded users that have been seen using the given name.