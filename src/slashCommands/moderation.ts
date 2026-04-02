import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, TextChannel, GuildMember, Role, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SlashCommand } from "../types";

const modCommands: SlashCommand[] = [
    {
        command: new SlashCommandBuilder()
            .setName("ban")
            .setDescription("Ban a member from the server")
            .addUserOption(option => option.setName("user").setDescription("Member to ban").setRequired(true))
            .addStringOption(option => option.setName("reason").setDescription("Ban reason").setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const reason = interaction.options.getString("reason") || "No reason provided.";
            const member = interaction.guild?.members.cache.get(user.id);
            if (!interaction.guild || !member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: "Missing ban permissions.", ephemeral: true });
            if (!member.bannable) return interaction.reply({ content: "I cannot ban this member.", ephemeral: true });
            await member.ban({ reason });
            return interaction.reply({ content: `✅ Banned ${user.tag}. Reason: ${reason}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("unban")
            .setDescription("Unban a member from the server")
            .addStringOption(option => option.setName("user_id").setDescription("User ID to unban").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
        execute: async (interaction) => {
            const userId = interaction.options.getString("user_id", true);
            if (!interaction.guild) return interaction.reply({ content: "Guild context required.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: "Missing unban permissions.", ephemeral: true });
            try {
                await interaction.guild.bans.remove(userId);
                return interaction.reply({ content: `✅ Unbanned <@${userId}>.` });
            } catch (error) {
                return interaction.reply({ content: `⚠️ Failed to unban user ID ${userId}.`, ephemeral: true });
            }
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("kick")
            .setDescription("Kick a member from the server")
            .addUserOption(option => option.setName("user").setDescription("Member to kick").setRequired(true))
            .addStringOption(option => option.setName("reason").setDescription("Kick reason").setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const reason = interaction.options.getString("reason") || "No reason provided.";
            const member = interaction.guild?.members.cache.get(user.id);
            if (!interaction.guild || !member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: "Missing kick permissions.", ephemeral: true });
            if (!member.kickable) return interaction.reply({ content: "I cannot kick this member.", ephemeral: true });
            await member.kick(reason);
            return interaction.reply({ content: `✅ Kicked ${user.tag}. Reason: ${reason}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("mute")
            .setDescription("Timeout (mute) a member")
            .addUserOption(option => option.setName("user").setDescription("Member to mute").setRequired(true))
            .addIntegerOption(option => option.setName("minutes").setDescription("Timeout duration in minutes").setRequired(true).setMinValue(1).setMaxValue(43200))
            .addStringOption(option => option.setName("reason").setDescription("Mute reason").setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const minutes = interaction.options.getInteger("minutes", true);
            const reason = interaction.options.getString("reason") || "No reason provided.";
            const member = interaction.guild?.members.cache.get(user.id);
            if (!interaction.guild || !member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: "Missing moderate permissions.", ephemeral: true });
            await member.timeout(minutes * 60 * 1000, reason);
            return interaction.reply({ content: `✅ Timed out ${user.tag} for ${minutes} minute(s). Reason: ${reason}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("unmute")
            .setDescription("Remove timeout from a member")
            .addUserOption(option => option.setName("user").setDescription("Member to unmute").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const member = interaction.guild?.members.cache.get(user.id);
            if (!interaction.guild || !member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: "Missing moderate permissions.", ephemeral: true });
            await member.timeout(null);
            return interaction.reply({ content: `✅ Timeout removed from ${user.tag}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("warn")
            .setDescription("Warn a member")
            .addUserOption(option => option.setName("user").setDescription("Member to warn").setRequired(true))
            .addStringOption(option => option.setName("reason").setDescription("Warning reason").setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const reason = interaction.options.getString("reason") || "No reason provided.";
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: "Missing permissions.", ephemeral: true });
            await interaction.reply({ content: `⚠️ ${user.tag} was warned. Reason: ${reason}` });
            try {
                const member = interaction.guild?.members.cache.get(user.id);
                await user.send(`You have been warned in ${interaction.guild?.name}. Reason: ${reason}`).catch(()=>null);
            } catch {
                // ignore DM failures
            }
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("clear")
            .setDescription("Bulk delete recent messages")
            .addIntegerOption(option => option.setName("amount").setDescription("Number of messages to delete (2-100)").setRequired(true).setMinValue(2).setMaxValue(100))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        execute: async (interaction) => {
            const amount = interaction.options.getInteger("amount", true);
            if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return interaction.reply({ content: "This command can only be used in text channels.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "Missing manage messages permission.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            const deleted = await channel.bulkDelete(amount, true).catch(() => null);
            return interaction.reply({ content: `✅ Deleted ${Array.isArray(deleted) ? deleted.length : 0} messages.`, ephemeral: true });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("lock")
            .setDescription("Lock the current channel (remove SEND_MESSAGES from @everyone)")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        execute: async (interaction) => {
            if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return interaction.reply({ content: "Only text channels.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Missing manage channels permission.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            return interaction.reply({ content: "🔒 Channel locked." });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("unlock")
            .setDescription("Unlock the current channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        execute: async (interaction) => {
            if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return interaction.reply({ content: "Only text channels.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Missing manage channels permission.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
            return interaction.reply({ content: "🔓 Channel unlocked." });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("slowmode")
            .setDescription("Set slowmode in the current channel")
            .addIntegerOption(option => option.setName("seconds").setDescription("Slowmode trigger in seconds").setRequired(true).setMinValue(0).setMaxValue(21600))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        execute: async (interaction) => {
            const seconds = interaction.options.getInteger("seconds", true);
            if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return interaction.reply({ content: "Only text channels.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Missing manage channels permission.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            await channel.setRateLimitPerUser(seconds);
            return interaction.reply({ content: `🕒 Slowmode set to ${seconds}s.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("addrole")
            .setDescription("Add a role to a member")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .addRoleOption(option => option.setName("role").setDescription("Role to add").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const role = interaction.options.getRole("role", true) as Role;
            if (!interaction.guild) return interaction.reply({ content: "Guild required.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "Missing manage roles permission.", ephemeral: true });
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            await member.roles.add(role);
            return interaction.reply({ content: `✅ Added role ${role.name} to ${user.tag}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("removerole")
            .setDescription("Remove a role from a member")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .addRoleOption(option => option.setName("role").setDescription("Role to remove").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const role = interaction.options.getRole("role", true) as Role;
            if (!interaction.guild) return interaction.reply({ content: "Guild required.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "Missing manage roles permission.", ephemeral: true });
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            await member.roles.remove(role);
            return interaction.reply({ content: `✅ Removed role ${role.name} from ${user.tag}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("nick")
            .setDescription("Change a member nickname")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .addStringOption(option => option.setName("nickname").setDescription("New nickname").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const nickname = interaction.options.getString("nickname", true);
            if (!interaction.guild) return interaction.reply({ content: "Guild required.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageNicknames)) return interaction.reply({ content: "Missing manage nicknames permission.", ephemeral: true });
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            await member.setNickname(nickname);
            return interaction.reply({ content: `✅ Changed nickname for ${user.tag} to ${nickname}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("resetnick")
            .setDescription("Reset a member nickname")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            if (!interaction.guild) return interaction.reply({ content: "Guild required.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageNicknames)) return interaction.reply({ content: "Missing manage nicknames permission.", ephemeral: true });
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            await member.setNickname(null);
            return interaction.reply({ content: `✅ Reset nickname for ${user.tag}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("nuke")
            .setDescription("Nuke current channel (clone and delete it)")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        execute: async (interaction) => {
            if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText || !interaction.guild) return interaction.reply({ content: "This command only works in guild text channels.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Missing manage channels permission.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            const cloned = await channel.clone({ name: channel.name, reason: "Nuke command" });
            await channel.delete("Nuke command");
            await cloned.send("💥 Channel nuked.");
            return; // no followup needed
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("memberinfo")
            .setDescription("Display information about a member")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user") || interaction.user;
            const member = interaction.guild?.members.cache.get(user.id);
            const embed = new EmbedBuilder()
                .setTitle("Member Info")
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: "User", value: `${user.tag} (${user.id})`, inline: false },
                    { name: "Joined Server", value: member?.joinedAt?.toUTCString() || "Unknown", inline: true },
                    { name: "Account Created", value: user.createdAt.toUTCString(), inline: true },
                    { name: "Roles", value: member ? member.roles.cache.map(r => r.name).join(", ") || "None" : "Unknown", inline: false }
                );
            return interaction.reply({ embeds: [embed] });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("serverinfo")
            .setDescription("Display information about the server")
            .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel),
        execute: async (interaction) => {
            if (!interaction.guild) return interaction.reply({ content: "Guild required.", ephemeral: true });
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setTitle("Server Info")
                .setThumbnail(guild.iconURL() || "")
                .addFields(
                    { name: "Name", value: guild.name, inline: true },
                    { name: "ID", value: guild.id, inline: true },
                    { name: "Members", value: `${guild.memberCount}`, inline: true },
                    { name: "Created", value: guild.createdAt.toUTCString(), inline: true }
                );
            return interaction.reply({ embeds: [embed] });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("whois")
            .setDescription("Get a quick user summary")
            .addUserOption(option => option.setName("user").setDescription("User").setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user") || interaction.user;
            return interaction.reply({ content: `📌 User: ${user.tag}\nID: ${user.id}\nBot: ${user.bot ? "Yes" : "No"}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("roleinfo")
            .setDescription("Get role information")
            .addRoleOption(option => option.setName("role").setDescription("Role").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel),
        execute: async (interaction) => {
            const role = interaction.options.getRole("role", true) as Role;
            if (!role) return interaction.reply({ content: "Role not found.", ephemeral: true });
            return interaction.reply({ content: `🛡️ Role: ${role.name}\nID: ${role.id}\nMembers: ${role.members.size}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("settopic")
            .setDescription("Set channel topic")
            .addStringOption(option => option.setName("topic").setDescription("New topic").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        execute: async (interaction) => {
            const topic = interaction.options.getString("topic", true);
            if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return interaction.reply({ content: "Only text channels.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Missing manage channels permission.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            await channel.setTopic(topic);
            return interaction.reply({ content: `✅ Channel topic updated to: ${topic}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("getinvite")
            .setDescription("Get an invite link for the current channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),
        execute: async (interaction) => {
            if (!interaction.channel?.isTextBased()) return interaction.reply({ content: "Text channel required.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            const invite = await channel.createInvite({ maxAge: 3600, maxUses: 5, unique: true });
            return interaction.reply({ content: `🔗 Invite: ${invite.url}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("createinvite")
            .setDescription("Create a permanent invite link")
            .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),
        execute: async (interaction) => {
            if (!interaction.channel?.isTextBased()) return interaction.reply({ content: "Text channel required.", ephemeral: true });
            const channel = interaction.channel as TextChannel;
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: false });
            return interaction.reply({ content: `🔗 Permanent invite created: ${invite.url}` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("vc-kick")
            .setDescription("Disconnect a user from voice channel")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const member = interaction.guild?.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.MoveMembers)) return interaction.reply({ content: "Missing move members.", ephemeral: true });
            if (!member.voice.channel) return interaction.reply({ content: "Member is not in a voice channel.", ephemeral: true });
            await member.voice.disconnect();
            return interaction.reply({ content: `✅ Disconnected ${user.tag} from voice.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("deafen")
            .setDescription("Deafen a voice member")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const member = interaction.guild?.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.MoveMembers)) return interaction.reply({ content: "Missing move members.", ephemeral: true });
            await member.voice.setDeaf(true);
            return interaction.reply({ content: `✅ Deafened ${user.tag}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("undeafen")
            .setDescription("Undeafen a voice member")
            .addUserOption(option => option.setName("user").setDescription("Member").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
        execute: async (interaction) => {
            const user = interaction.options.getUser("user", true);
            const member = interaction.guild?.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: "Member not found.", ephemeral: true });
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.MoveMembers)) return interaction.reply({ content: "Missing move members.", ephemeral: true });
            await member.voice.setDeaf(false);
            return interaction.reply({ content: `✅ Undeafened ${user.tag}.` });
        }
    },
    {
        command: new SlashCommandBuilder()
            .setName("say")
            .setDescription("Let the bot say something")
            .addStringOption(option => option.setName("message").setDescription("Message content").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        execute: async (interaction) => {
            const message = interaction.options.getString("message", true);
            await interaction.reply({ content: message });
        }
    }
];

export default modCommands;
