const Discord = require('discord.js');

module.exports = {
    name: 'info',
    description: '`<tier>` Retrieves information about a specific tier',
    async execute(message, args) {
        if (!args.length) {
            // Give an overview of all available commands
            this.list(message);
            return;
        }

        const tierName = args.join(' ');
        let requestedTier;
        let requirements = '';
        let applications = '';
        let guides = '';

        const TierInfo = await this.fetchInfo();

        if (!TierInfo) {
            message.reply('failed fetching data');
            return;
        }

        TierInfo.tiers.forEach(tier => {
            if (tier.name.toLowerCase() === tierName.toLowerCase()) {
                requestedTier = tier;
                tier.reqs.forEach(req => {
                    if (req in TierInfo.reqs) {
                        req = TierInfo.reqs[req];
                    }
                    requirements += `\n• ${req}`
                });
                tier.apps.forEach(app => {
                    applications += `\n• ${app}`;
                });
                tier.guides.forEach(channel => {
                    if (channel in TierInfo.guides) {
                        channel = `<#${TierInfo.guides[channel]}>`;
                    }
                    guides += `${channel} `;
                })
            }
        });

        if (!requestedTier) {
            message.reply('your requested tier is not supported, use `.info` to retrieve a full list');
            return;
        }

        const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === tierName.toLowerCase());

        let members = [];

        role.members.forEach(member => {
            members.push(`<@${member.id}>`);
        });

        let replyEmbed = new Discord.MessageEmbed()
            .setColor(role.color)
            .setTitle(`Tier: ${role.name}`)
            .setDescription(`<@&${role.id}> ${members.length} members`)
            .addField('Requirements', requirements)
            .addField('Application (any of the listed options)', applications)
            .addField('Vorago Collaboration', 'Rago PvM: https://discord.gg/Q8xpnYp\nRago Hub: https://discord.gg/uqGJbKH\nRockman: https://discord.gg/Xr6mpyT')
            .addField('Related guides on Rago Hub', guides);

        message.channel.send(embed=replyEmbed);
    },

    list(message) {
        this.fetchInfo(this.client).then(tierInfo => {
            if (!tierInfo) {
                message.reply('failed fetching data');
                return;
            }

            let embed = new Discord.MessageEmbed()
                .setColor('white')
                .setTitle('Synchronized Tiers')
                .setDescription('All of these roles are synchronized across Rago Hub and Rago PvM. To retrieve more information about a specific Tier, use `.info <tier>`');

            let tiersHm = [];
            let tiersNm = [];

            tierInfo.tiers.forEach(tier => {
                let role = message.guild.roles.cache.find(role => role.name === tier.name);

                if (role) {
                    const checkType = role.name.toLowerCase();
                    if (checkType.includes('hm')) {
                        tiersHm.push(role);
                    } else {
                        tiersNm.push(role);
                    }
                }
            });

            embed.addField('Normal Mode', tiersNm.map(role => {
                return `<@&${role.id}> \`.info ${role.name}\``;
            }).join('\n'));

            embed.addField('Hard Mode', tiersHm.map(role => {
                return `<@&${role.id}> \`.info ${role.name}\``;
            }).join('\n'));

            message.channel.send(embed);
        });
    },

    fetchInfo() {
        return this.client.modules.get('fetch').execute(
            this.client.config.github.files.tiers
        );
    }
}
