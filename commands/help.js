module.exports = {
    name: 'help',
    description: 'This command',
    execute(message, args) {
        let replies = [];
        this.client.commands.forEach(command => {
            replies.push(`\`${this.client.bot.prefix}${command.name}\` ${command.description}`);
        });
        message.channel.send(replies.join('\n'));
    }
}
