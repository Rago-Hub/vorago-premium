module.exports = {
    name: 'roleinfo',
    description: '`<rolename>` **[admins only]** returns total count and list of all server members holding the respective role',
    execute(message, args) {
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            message.reply('you are not permitted to run this command');
            return;
        }

        if (!args.length) {
            message.reply('invalid number of arguments provided');
            return;
        }

        let members = [];

        let role = args.join(' ');

        if (role.startsWith('<')) {
            role = message.guild.roles.cache.get(role.substr(3, role.length - 4));
        } else {
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() === role.toLowerCase());
        }

        role.members.forEach(member => {
            members.push(`<@${member.id}>`)
        });

        message.reply(`<@&${role.id}> is owned by a total of **${members.length}** members\n${members.join(', ')}`, {'allowedMentions': {'users': []}});
    }
}
