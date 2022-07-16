module.exports = {
    name: 'search',
    execute(message) {
        if (
            message.channel.id !== this.client.config.search.channel
            || message.author.bot
        ) {
            return;
        }

        this.client.modules.get('fetch').execute(this.client.config.github.files.search).then(data => {
            let shortcuts;

            for (const prop in data) {
                shortcuts = data[prop];
                break;
            }

            let answers = [];
            let reply = '';

            for (const keyword in data) {
                if (message.content.includes(keyword)) {
                    data[keyword].forEach(answer => {
                        if (answer[0] === ":") {
                            // Shortcut is used
                            answer = answer.substr(1);
                            for (const shortcut in shortcuts) {
                                if (shortcut === answer) {
                                    answer = shortcuts[shortcut];
                                }
                            }
                        }
                        answers.push(answer);
                    })
                }
            }

            if (answers.length) {
                answers = answers.filter((value, index, self) => {
                    // Unique answers only
                    return self.indexOf(value) === index;
                });

                answers.forEach(answer => {
                    reply += "\n• " + answer;
                });

                // Remove leading newline
                reply = reply.substr(1);

                this.client.modules.get('parse').execute(reply, message.channel);
            } else {
                message.reply('your search did not return any results, please try again');
            }
        }).catch(e => {
            console.error(e);
            message.reply('failed fetching search results');
        });
    }
}
