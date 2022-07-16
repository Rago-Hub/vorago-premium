module.exports = {
    name: 'post',
    description: '`<#channel>` `<reference>` **[editors only]** Post a guide from the `rago-guides` repository',
    execute(message, args) {
        if (args.length !== 2) {
            message.reply('invalid number of arguments provided');
            return;
        }

        // Channel ID
        let channel = args.shift();

        if (this.client.config.github.admins.includes(message.author.id)) {
            channel = this.client.channels.cache.get(
                channel.substr(2, channel.length - 3)
            );
        } else {
            channel = this.client.channels.cache.get(
                this.client.config.github.channels.testing
            );
        }

        if (!channel) {
            message.reply('invalid channel specified');
            return;
        }

        this.client.modules.get('fetch').execute(
            args.shift() + '.txt'
        ).then(content => {
            if (channel.id !== this.client.config.github.channels.testing) {
                // Purge
                channel.messages.fetch({limit: 100}).then(messages => {
                    messages.forEach(msg => msg.delete());
                }).catch(e => {
                    console.error(e);
                    message.reply('channel purge failed');
                });
            }

            this.client.modules.get('parse').execute(content, channel);
        }).catch(e => {
            console.error(e);
            message.reply('that looks like an incorrect repository reference');
        });
    },
}
