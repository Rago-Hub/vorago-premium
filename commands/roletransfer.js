module.exports = {
    name: 'roletransfer',
    description: '`<old>` `<new>` **[admins only]** all server members holding the `old` role are granted the `new` role',
    execute(message, args) {
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            message.reply('you are not permitted to run this command');
            return;
        }

        if (args.length < 2) {
            message.reply('invalid number of arguments provided');
            return;
        }

        let members = [];

        let source = args.shift();
        let destination = args.shift();
        if (source.startsWith('<')) {
            source = message.guild.roles.cache.get(source.substr(3, source.length - 4));
            destination = message.guild.roles.cache.get(destination.substr(3, destination.length - 4));
        } else {
            args.unshift(destination);
            args.unshift(source);
            let str = args.join(' ');
            source = message.guild.roles.cache.find(
                role => role.name.toLowerCase() === str.substr(0, str.indexOf(';')).toLowerCase().trim()
            );
            destination = message.guild.roles.cache.find(
                role => role.name.toLowerCase() === str.substr(str.indexOf(';') + 1).toLowerCase().trim()
            );
        }

        source.members.forEach(member => {
            member.roles.add(destination);
            members.push(`<@${member.id}>`)
        });

        message.reply(`added <@&${destination.id}> to a total of **${members.length}** members\n${members.join(', ')}`, {'allowedMentions': {'users': []}});
    }
}
