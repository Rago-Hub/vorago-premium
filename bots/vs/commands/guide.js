const Discord = require('discord.js');

module.exports = {
    name: 'guide',
    description: 'Retrieve information of a specific guide section',
    backReaction: '↩',
    paginationReactions: ['⬅', '➡'],
    entryReactions: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
    author: null,
    message: null,
    data: {},
    state: {
        values: [],
        page: 1,
        category: '',
        guide: '',
        section: ''
    },

    execute(message, args) {
        try {
            this.client.modules.get('fetch').execute(this.client.config.github.files.guide).then(structure => {
                this.author = message.author;
                this.data = structure;
                return message.channel.send('Processing...');
            }).then(msg => {
                this.message = msg;
                this.renderCategories();
            }).catch(e => {
                console.error(e);
                message.reply('something horrible happened');
            });
        } catch (e) {
            console.error(e);
            message.reply('something horrible happened');
            delete this;
        }
    },

    renderCategories() {
        this.state = {
            values: Object.keys(this.data),
            page: 1,
            category: '',
            guide: '',
            section: ''
        };

        this.render();
    },

    renderGuides() {
        this.state = {
            values: [],
            page: 1,
            category: this.state.category,
            guide: '',
            section: ''
        };

        const guides = Object.keys(this.data[this.state.category]);

        guides.forEach(guide => {
            this.state.values.push(guide);
        });

        this.render();
    },

    renderSections() {
        this.state = {
            values: [],
            page: 1,
            category: this.state.category,
            guide: this.state.guide,
            section: ''
        };

        this.client.modules.get('fetch').execute(`${this.data[this.state.category][this.state.guide]}.txt`).then(response => {
            const lines = response.split('\r').join('').split('\n');

            lines.forEach(line => {
                if (line.length > 6 && line.substr(line.length - 5) === ':edit') {
                    line = line.substr(0, line.length - 5);
                }

                if (
                    line.startsWith('.')
                    && line.length > 1
                    && line !== '.index'
                ) {
                    this.state.values.push(line.substr(1));
                }
            });

            this.render();
        }).catch(e => {
            console.error(e);
            this.message.channel.send('Failed fetching guide data');
            this.message.edit('Failed fetching guide data, please try again by typing `ragoguide`');
            delete this;
        });
    },

    postSection() {
        const Parse = this.client.modules.get('parse');

        this.client.modules.get('fetch').execute(`${this.data[this.state.category][this.state.guide]}.txt`).then(response => {
            const lines = response.split('\r').join('').split('\n');
            let add = false;
            let content = '';
            lines.forEach(line => {
                if (line.length > 6 && line.substr(line.length - 5) === ':edit') {
                    line = line.substr(0, line.length - 5);
                }

                if (add) {
                    if (line.startsWith('.') && line.length > 1) {
                        add = false;
                    } else {
                        content += `\n${line}`;
                    }
                } else {
                    if (line.toLowerCase() === `.${this.state.section}`.toLowerCase()) {
                        add = true;
                        content += `\n${line}`;
                    }
                }
            });

            if (content.endsWith('\n')) content = content.substr(0, content.length - 1);

            this.message.edit(`Successfully finished process \`ragoguide\`. Requested guide section: **\`root / ${this.state.category} / ${this.state.guide} / ${this.state.section}\`**`);

            Parse.execute(content, this.message.channel);
            delete this;
        }).catch(e => {
            console.error(e);
            this.message.channel.send('Failed fetching guide data');
            this.message.edit('Failed fetching guide data, please try again by typing `ragoguide`');
            delete this;
        });
    },

    render() {
        this.message.reactions.removeAll().then(msg => {
            return this.message.edit(this.getGuideEmbed());
        }).then(msg => {
            let validReactions = [];

            // Back to previous level
            if (this.state.category) {
                msg.react(this.backReaction).catch(console.error);
                validReactions.push(this.backReaction);
            }

            // Pagination
            if (this.state.values.length > 9) {
                this.paginationReactions.forEach(reaction => {
                    msg.react(reaction).catch(console.error);
                    validReactions.push(reaction);
                });
            }

            // Values
            for (let i = 0; i < this.countPageEntries(); i++) {
                msg.react(this.entryReactions[i]).catch(console.error);
                validReactions.push(this.entryReactions[i]);
            }

            // Collector
            const collector = msg.createReactionCollector(
                (reaction, user) => user.id === this.author.id && validReactions.includes(reaction.emoji.name),
                {time: 60000}
            );

            // Interaction
            collector.once('collect', reaction => {
                const chosen = reaction.emoji.name;
                if (this.backReaction === chosen) {
                    // Back to previous level
                    if (this.state.guide) {
                        this.renderGuides();
                    } else {
                        this.renderCategories();
                    }
                } else if (this.paginationReactions.includes(chosen)) {
                    // Paginate
                    if (chosen === this.paginationReactions[0]) {
                        // Previous page
                        this.state.page = Math.max(this.state.page - 1, 1);
                    } else {
                        // Next page
                        this.state.page = Math.min(this.state.page + 1, Math.ceil(this.state.values.length / 9));
                    }
                    this.render();
                } else if (this.entryReactions.includes(chosen)) {
                    let index = this.state.page * 9 - 9;
                    // Navigate
                    if (!this.state.category) {
                        for (let i = 0; i < this.entryReactions.length; i++) {
                            if (this.entryReactions[i] === chosen) {
                                this.state.category = this.state.values[i + index];
                            }
                        }
                        this.renderGuides();
                    } else if (!this.state.guide) {
                        for (let i = 0; i < this.entryReactions.length; i++) {
                            if (this.entryReactions[i] === chosen) {
                                this.state.guide = this.state.values[i + index];
                            }
                        }
                        this.renderSections();
                    } else {
                        for (let i = 0; i < this.entryReactions.length; i++) {
                            if (this.entryReactions[i] === chosen) {
                                this.state.section = this.state.values[i + index];
                            }
                        }
                        this.postSection();
                    }
                }

                collector.stop();
            });

            collector.on('end', collected => {
                if (!collected.size) {
                    this.message.edit('Time limit exceeded. Please try again by typing `ragoguide`.');
                    delete this;
                }
            })
        }).catch(e => {
            console.error(e);
            this.message.channel.send('An error occurred');
            this.message.edit('An error occurred. The following channel permissions are required: `View Channel`, `Send Messages`, `Embed Links`, `Add Reactions`, `Manage Messages` and `Read Message History`.');
            delete this;
        });
    },

    getGuideEmbed() {
        const embed = new Discord.MessageEmbed();
        let content = [];

        embed.setColor('f0ffb5')
            .setTitle('Rago Hub Guides')
            .setThumbnail('https://cdn.discordapp.com/attachments/500971699349749760/821282626132246568/ragohub_500p.png')
            .setURL('https://discord.gg/uqGJbKH')
            .setDescription('All data is dynamically retrieved from the Rago Hub [github repository](https://github.com/schilffarth/rago-guides). For more information on collaborative guide writing, check out Rago Hub\'s [`#📝editor-quick-start`](https://discord.gg/yz8bCd3R4c) channel.')
        ;

        // 9 entries per page
        const index = this.state.page * 9 - 9;

        if (this.state.category) {
            let location = 'Root ❱ ' + this.state.category;
            if (this.state.guide) {
                location += ' ❱ ' + this.state.guide;
            }
            embed.addField(
                'Location',
                `**\`${location}\`**`
                + `\n${this.backReaction} return to previous menu`
            );
        }

        if (this.state.values.length > 9) {
            embed.addField(
                'Pagination',
                `Current page: **\`${this.state.page}/${Math.ceil(this.state.values.length / 9)}\`**`
                    + `\n${this.paginationReactions[0]} previous page`
                    + `\n${this.paginationReactions[1]} next page`
            );
        }

        for (let i = 0; i < this.countPageEntries(); i++) {
            content.push(`${this.entryReactions[i]} **\`${this.state.values[index + i]}\`**`);
        }

        embed.addField('Navigation', content.join('\n'));

        return embed;
    },

    countPageEntries() {
        const index = this.state.page * 9 - 9;
        let count = 0;

        for (; count < 9 && count < this.state.values.length - index; count++) {}

        return count;
    },
}
