const Config = require('../../config.json');
const Bot = Config.bots.voragostrategies;
const Discord = require('discord.js');
const Fs = require('fs');
const CommandFiles = Fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
const ModuleFiles = Fs.readdirSync('../../modules/').filter(file => file.endsWith('.js'));
const Client = new Discord.Client();
const RequireNew = require('require-new');
Client.commands = new Discord.Collection();
Client.modules = new Discord.Collection();
Client.config = Config;
Client.bot = Bot;

for (const file of CommandFiles) {
    const command = require(`./commands/${file}`);
    Client.commands.set(command.name, command);
    command.client = Client;
}

for (const file of ModuleFiles) {
    const module = require(`../../modules/${file}`);
    Client.modules.set(module.name, module);
    module.client = Client;
}

Client.on('message', message => {
    if (!message.content.startsWith(Bot.prefix) || message.author.bot) {
        return;
    }

    const args = message.content.slice(Bot.prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();

    if (!Client.commands.has(command)) {
        return;
    }

    try {
        Client.channels.cache.get(Config.commandlog.channel).send(
            `User \`${message.author.username}#${message.author.discriminator}\``
            + ` ran command \`${command}\``
            + ` on server \`${message.guild.name}\``
            + ` in channel \`${message.channel.name}\``
        );
        if (command === 'guide') {
            const instance = RequireNew('./commands/guide.js');
            instance.client = Client;
            instance.execute(message, args);
        } else {
            Client.commands.get(command).execute(message, args);
        }
    } catch {
        message.reply('command execution failed');
    }
});

Client.once('ready', () => {
    console.log(`Successfully logged in as ${Client.user.username}#${Client.user.discriminator} (${Client.user.id})`);
});

Client.login(Bot.token).catch(console.error);
