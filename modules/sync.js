const Discord = require('discord.js');

module.exports = {
    name: 'sync',
    import(member) {
        let updated = false;

        this.client.config.sync.guilds.forEach(guild => {
            guild = this.client.guilds.cache.get(guild.id);
            if (!updated && guild && guild.id !== member.guild.id) {
                if (guild.members.cache.get(member.id)) {
                    // Member exists on source server
                    this.execute(member.id, guild, member.guild).catch(console.error);
                    updated = true;
                }
            }
        });
    },

    export(memberOld, memberNew) {
        if (memberOld.roles.cache.equals(memberNew.roles.cache)) {
            // Roles have not been updated
            return;
        }

        this.client.config.sync.guilds.forEach(guild => {
            if (guild.id === memberOld.guild.id) {
                // Announce on source server
                this.announce(this.client.channels.cache.get(guild.log), memberOld, memberNew);
            }

            if (guild.id !== memberNew.guild.id) {
                // Update roles on a synchronized server
                const destinationGuild = this.client.guilds.cache.get(guild.id);
                if (destinationGuild) {
                    this.execute(memberNew.id, memberNew.guild, destinationGuild).catch(console.error);
                }
            }
        });
    },

    async announce(channel, memberOld, memberNew) {
        const synchronizedRoles = await this.client.modules.get('fetch').execute(this.client.config.github.files.roles);

        synchronizedRoles.forEach(syncedRole => {
            const oldMemberRole = memberOld.roles.cache.find(role => role.name === syncedRole);
            const newMemberRole = memberNew.roles.cache.find(role => role.name === syncedRole);

            if (oldMemberRole && newMemberRole) {
                // No changes, continue
                return;
            }

            if (oldMemberRole && !newMemberRole) {
                // Removed role
                this.log(
                    channel,
                    memberNew,
                    {add: [], remove: [oldMemberRole]},
                    oldMemberRole.color
                );
            }

            if (!oldMemberRole && newMemberRole) {
                // Added role
                this.log(
                    channel,
                    memberNew,
                    {add: [newMemberRole], remove: []},
                    newMemberRole.color
                );
            }
        });
    },

    async execute(userId, sourceGuild, destinationGuild) {
        const synchronizedRoles = await this.client.modules.get('fetch').execute(this.client.config.github.files.roles);
        const sourceMember = await sourceGuild.members.fetch(userId);
        const destinationMember = await destinationGuild.members.fetch(userId);

        let changes = {
            add: [],
            remove: []
        }

        synchronizedRoles.forEach(sync => {
            const sourceRole = sourceGuild.roles.cache.find(role => role.name === sync);
            const destinationRole = destinationGuild.roles.cache.find(role => role.name === sync);

            if (!!sourceRole === !!destinationRole) {
                // Only proceed role if source & destination actually support the desired role
                const sourceMemberHasRole = sourceMember.roles.cache.find(role => role.name === sync);
                const destinationMemberHasRole = destinationMember.roles.cache.find(role => role.name === sync);

                if (!!sourceMemberHasRole !== !!destinationMemberHasRole) {
                    // Synchronize role
                    if (sourceMemberHasRole) {
                        // Add role
                        changes.add.push(destinationRole);
                    } else {
                        // Remove role
                        changes.remove.push(destinationRole);
                    }
                }
            }
        })

        let syncLogChannel;
        this.client.config.sync.guilds.forEach(guild => {
            if (guild.id === destinationGuild.id) {
                syncLogChannel = this.client.channels.cache.get(guild.log);;
            }
        });

        if (!syncLogChannel) {
            // Server does not synchronize tiers
            return;
        }

        if (changes.add.length && changes.remove.length) {
            // Member had not been synchronized before, resulting in conflicts
            this.conflict(destinationMember, changes, syncLogChannel, sourceGuild.name);
            return;
        }

        let color = 0;

        // Synchronize member
        if (changes.add.length) {
            destinationMember.roles.add(changes.add);
            color = changes.add[0].color;
        }

        if (changes.remove.length) {
            destinationMember.roles.remove(changes.remove);
            color = changes.remove[0].color
        }
    },

    conflict(member, changes, channel, sourceServer) {
        const embed = new Discord.MessageEmbed();

        embed.setAuthor(member.displayName, member.user.avatarURL());
        embed.setTitle('failed synchronization');
        embed.setColor('ff0000');
        embed.setDescription(
            `**Failed to synchronize member <@${member.id}> with source server \`${sourceServer}\`**`
            + `\n**Conflicts:** ${this.formatRoleList(changes.remove)}`
            + `\n**Added roles:** ${this.formatRoleList(changes.add)}`
        );

        channel.send(embed);
    },

    log(channel, member, changes, color) {
        const embed = new Discord.MessageEmbed();
        const title = changes.remove.length
            ? `<:redtick:824276035591077918> roles updated`
            : `<:greentick:824276144345972796> roles updated`;
        const description = changes.remove.length
            ? `<@${member.id}> got removed from ${this.formatRoleList(changes.remove)}`
            : `<@${member.id}> got added to${this.formatRoleList(changes.add)}`;

        embed.setAuthor(member.displayName, member.user.avatarURL());
        embed.setTitle(title);
        embed.setColor(color);
        embed.setDescription(description);

        channel.send(embed);
    },

    formatRoleList(roles) {
        return roles.map(role => `<@&${role.id}>`).join(', ');
    }
}
