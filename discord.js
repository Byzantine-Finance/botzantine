import { setupDiscordClient, registerCommands } from "./discord/setup.js";
import { clearCommand, handleClearCommand } from "./discord/clear.js";
import { respondHello } from "./discord/respondHello.js";
import {
  createPrivateChannelCommand,
  handleCreatePrivateChannelCommand,
} from "./discord/createPrivateChannel.js";

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
    await handleCreatePrivateChannelCommand(interaction);
  }
});

export { client };
