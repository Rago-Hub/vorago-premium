module.exports = {
    name: 'roleremove',
    description: '`<role>` **[admins only]** deletes a role from the server',
    execute(message, args) {
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            message.reply('you are not permitted to run this command');
            return;
        }

        if (!args.length) {
            message.reply('invalid number of arguments provided');
            return;
        }

        let role = args.join(' ');

        if (role.startsWith('<')) {
            role = message.guild.roles.cache.get(role.substr(3, role.length - 4));
        } else {
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() === role.toLowerCase());
        }

        const count = role.members.size;

        role.delete('because you wanted it');

        message.reply(`**${role.name}** has been deleted with a total of **${count}** members affected`, {'allowedMentions': {'users': []}});
    }
}
