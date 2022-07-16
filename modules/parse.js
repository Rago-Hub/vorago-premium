module.exports = {
    'name': 'parse',
    async execute(content, channel) {
        const Emojis = await this.client.modules.get('fetch').execute(this.client.config.github.files.emojis);

        if (!content.startsWith('.')) {
            content = `.\n${content}`;
        }

        const editNotation = ':edit';

        content = content.split('\r').join('');
        let lines = content.split('\n');
        let messages = []; // All parsed messages
        let currentMessage = ''; // Currently parsed message
        let messageReferences = []; // Stores message IDs for cross linking / indexing
        let edits = []; // Stores messages that need editing

        lines.forEach(line => {
            if (line[0] === '.') {
                // Start parsing a new message
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                currentMessage = line;
            } else {
                if (line) {
                    // Parse emojis and other keywords like channels
                    const emojiKeys = Object.keys(Emojis);
                    for (let i = 0; i < emojiKeys.length; i++) {
                        line = line.split(emojiKeys[i]).join(Emojis[emojiKeys[i]]);
                    }
                } else {
                    // Do not send empty messages
                    line = '_ _';
                }
                currentMessage += `\n${line}`;
            }
        });

        // Push lastly parsed message
        messages.push(currentMessage);

        // Send messages
        for (let i = 0; i < messages.length; i++) {
            let content = messages[i];
            let reference;

            if (content[0] === '.') {
                // Remove message splitter / section ID
                reference = content.substr(1, content.indexOf('\n') - 1);
                content = content.substr(content.indexOf('\n') + 1);
            }

            content = this.parseMessageLinks(content, messageReferences, channel);

            if (content.length > 2000) {
                channel.send('**Message exceeds limit of `2,000` characters**');
                return;
            }

            let message;

            if (reference.length > 6 && reference.substr(reference.length - editNotation.length) === editNotation) {
                // Message wears edit notation
                reference = reference.substr(0, reference.length - editNotation.length);
                message = await channel.send(`${reference}${editNotation}`);
                edits.push({
                    message: message,
                    content: content
                });
            } else {
                message = await channel.send(content, {'allowedMentions': {'users': []}});
            }

            if (reference) {
                messageReferences[reference] = message.id;
                if (reference === 'index' && channel.id !== '812595920935321632') {
                    // Do not pin in #testing
                    await message.pin().then(response => {
                        channel.setTopic('Check the pinned index to navigate through content sections');
                        return channel.messages.fetch({limit: 1});
                    }).then(messages => {
                        try {
                            messages.first().delete();
                        } catch (e) {
                            channel.send(`**${e.message}**`);
                        }
                    }).catch(e => {
                        channel.send(`**${e.message}**`);
                    });
                }
            }
        }

        for (let i = 0; i < edits.length; i++) {
            edits[i].message.edit(
                this.parseMessageLinks(edits[i].content, messageReferences, channel)
            );
        }
    },

    parseMessageLinks(content, messageReferences, channel) {
        const indicator = '{link:';
        const indicatorEnd = '}';

        if (content.includes(indicator)) {
            let indices = this.getIndicesOf(indicator, content);
            let increaseIndex = 0;
            indices.forEach(index => {
                index = index + increaseIndex;
                const end = content.indexOf(indicatorEnd, index);
                const toRemove = content.substr(index, end - index + 1);
                const referenceIndex = toRemove.substr(indicator.length, toRemove.length - indicator.length - 1);
                if (messageReferences[referenceIndex]) {
                    const messageLink = `<https://discord.com/channels/${channel.guild.id}/${channel.id}/${messageReferences[referenceIndex]}>`;
                    content = content.replace(toRemove, messageLink);
                    increaseIndex += messageLink.length - toRemove.length;
                }
            });
        }

        return content;
    },

    getIndicesOf(searchStr, str) {
        if (!searchStr.length) {
            return [];
        }

        let startIndex = 0;
        let index;
        let indices = [];
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();

        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStr.length;
        }

        return indices;
    },
}
