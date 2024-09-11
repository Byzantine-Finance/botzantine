import dotenv from "dotenv";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";

dotenv.config();

export const setupDiscordClient = () => {
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

export const registerCommands = async (rest, commands) => {
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
