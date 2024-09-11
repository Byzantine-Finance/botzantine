import { SlashCommandBuilder } from "discord.js";

export const clearCommand = new SlashCommandBuilder()
  .setName("clear")
  .setDescription(
    "Deletes a specified number of messages in the current channel."
  )
  .addIntegerOption((option) =>
    option
      .setName("number")
      .setDescription("The number of messages to delete.")
      .setRequired(true)
  );

export const handleClearCommand = async (interaction) => {
  const amount = interaction.options.getInteger("number");
  if (!amount)
    return interaction.reply(
      "You must specify a number of messages to delete."
    );

  if (amount < 1 || amount > 100) {
    return interaction.reply("You can delete between 1 and 100 messages.");
  }

  await interaction.channel
    .bulkDelete(amount, true)
    .then(() => {
      interaction.reply({
        content: `I deleted ${amount} messages.`,
        ephemeral: true,
      });
    })
    .catch((err) => {
      console.error(err);
      interaction.reply("There was an error deleting the messages.");
    });
};
