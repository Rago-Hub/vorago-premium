const dotenv = require('dotenv').config()
const Config = require('./config');
const Bot = Config.bots[Config.modes[Config.mode]];
const Discord = require('discord.js');
const Fs = require('fs');
const CommandFiles = Fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
const ModuleFiles = Fs.readdirSync('./modules/').filter(file => file.endsWith('.js'));
const Client = new Discord.Client();
Client.commands = new Discord.Collection();
Client.modules = new Discord.Collection();
Client.config = Config;
Client.bot = Bot;

for (const file of CommandFiles) {
    const command = require(`./commands/${file}`);
    command.client = Client;
    Client.commands.set(command.name, command);
}

for (const file of ModuleFiles) {
	const module = require(`./modules/${file}`);
	module.client = Client;
	Client.modules.set(module.name, module);
}

Client.on('message', message => {
	Client.modules.get('search').execute(message);

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
		Client.commands.get(command).execute(message, args);
	} catch {
		message.reply('command execution failed');
	}
});

Client.on('guildMemberAdd', member => {
	Client.modules.get('sync').import(member, Client);
});

Client.on('guildMemberUpdate', (memberOld, memberNew) => {
	Client.modules.get('sync').export(memberOld, memberNew, Client);
});

Client.once('ready', () => {
	Client.user.setActivity(`${Bot.prefix}help`);
	console.log(`Successfully logged in as ${Client.user.username}#${Client.user.discriminator} (${Client.user.id})`);
});

Client.login(Bot.token).catch(console.error);
