const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    PermissionsBitField, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");
require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");

// =============================
// Keep-Alive Web Server for Render
// =============================
const app = express();
app.get("/", (req, res) => res.send("Bot is running ✓"));
app.listen(process.env.PORT || 3000, () =>
  console.log("Keep-alive server is running")
);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// =============================
//           CONFIG
// =============================
const STAFF_ROLE_ID = "STAFF_ROLE_ID_HERE";
const TICKET_CATEGORY_ID = "CATEGORY_ID_HERE";
const LOG_CHANNEL_ID = "LOG_CHANNEL_ID_HERE"; // optional

let ticketCount = 0;

// =============================
//     ADMIN PANEL COMMAND
// =============================
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(".ticketpanel")) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription("❌ You do not have permission to use this command.")
                    .setColor("#D9534F")
            ]
        });
    }

    const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Support Panel")
        .setDescription(
            "Please select the type of ticket you wish to open.\n\n" +
            "**🤝 Partnership** – Request partnerships or collaborations.\n" +
            "**💼 Middleman** – Secure middleman assistance for trades.\n" +
            "**💬 Support** – Ask general questions or get help."
        )
        .setColor("#2B2D31")
        .setFooter({ text: "Ticket System • Luka's Bot" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_partnership")
            .setLabel("Partnership")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🤝"),

        new ButtonBuilder()
            .setCustomId("ticket_middleman")
            .setLabel("Middleman")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("💼"),

        new ButtonBuilder()
            .setCustomId("ticket_support")
            .setLabel("Support")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("💬")
    );

    await message.channel.send({ embeds: [embed], components: [row] });

    message.reply({
        embeds: [
            new EmbedBuilder()
                .setDescription("✅ The ticket panel has been successfully placed.")
                .setColor("#5CB85C")
        ]
    }).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 3000);
    });
});

// =============================
//        CREATE TICKET
// =============================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const types = {
        ticket_partnership: { name: "Partnership", emoji: "🤝" },
        ticket_middleman: { name: "Middleman", emoji: "💼" },
        ticket_support: { name: "Support", emoji: "💬" }
    };

    const selected = types[interaction.customId];
    if (!selected) return;

    ticketCount++;

    const channel = await interaction.guild.channels.create({
        name: `${selected.name.toLowerCase()}-${ticketCount}`,
        type: 0,
        parent: TICKET_CATEGORY_ID,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            },
            {
                id: STAFF_ROLE_ID,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            }
        ]
    });

    const ticketEmbed = new EmbedBuilder()
        .setTitle(`${selected.emoji} ${selected.name} Ticket`)
        .setDescription(
            `Hello <@${interaction.user.id}>, and thank you for contacting us.\n\n` +
            `A member of our team will be with you shortly.\n\n` +
            `Please provide all necessary details to speed up the process.`
        )
        .setColor("#2B2D31")
        .setFooter({ text: `Ticket #${ticketCount}` });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("claim_ticket")
            .setLabel("Claim Ticket")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🛄"),

        new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒")
    );

    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });

    interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setDescription(`🎟️ Your ticket has been created: ${channel}`)
                .setColor("#5BC0DE")
        ],
        ephemeral: true
    });
});

// =============================
//        CLAIM TICKET
// =============================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "claim_ticket") return;

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription("❌ Only staff members can claim tickets.")
                    .setColor("#D9534F")
            ],
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setDescription(`🛄 This ticket has been claimed by **${interaction.user.tag}**.`)
        .setColor("#5CB85C");

    await interaction.message.reply({ embeds: [embed] });
    interaction.deferUpdate().catch(() => {});
});

// =============================
//        CLOSE TICKET
// =============================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "close_ticket") return;

    const embed = new EmbedBuilder()
        .setDescription("🔒 This ticket will be closed in **5 seconds**.\nThank you for contacting us.")
        .setColor("#D9534F");

    await interaction.reply({ embeds: [embed] });

    setTimeout(() => {
        interaction.channel.delete().catch(() => {});
    }, 5000);
});

// =============================
//           LOGIN
// =============================
client.login(process.env.TOKEN);
