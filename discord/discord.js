import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits,
} from "discord.js";
import { clearCommand, handleClearCommand } from "./clear.js";
import { respondHello } from "./respondHello.js";
import {
  createPrivateChannelCommand,
  handleCreatePrivateChannelCommand,
} from "./createPrivateChannel.js";

dotenv.config();

const setupDiscordClient = () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  client.login(process.env.DISCORD_TOKEN);

  client.on("ready", () => {
    console.log(`--> Logged in as ${client.user.tag} <--`);
  });

  return { client, rest };
};

const registerCommands = async (rest, commands) => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};

const { client, rest } = setupDiscordClient();

const commands = [clearCommand, createPrivateChannelCommand];

client.once("ready", async () => {
  await registerCommands(rest, commands);
});

client.on("messageCreate", (message) => {
  respondHello(message);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "clear") {
    await handleClearCommand(interaction);
  } else if (interaction.commandName === "createprivatechannel") {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ADMINISTRATOR)
    ) {
      return interaction.reply({
        content: "You don't have permission to create private channels.",
        ephemeral: true,
      });
    }
    await handleCreatePrivateChannelCommand(interaction);
  }
});

export { client };
