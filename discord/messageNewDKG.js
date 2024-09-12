import { client } from "../discord.js";
import { LOGS_CHANNEL_ID, EMBED_COLOR } from "../constants/index.js";
import { EmbedBuilder } from "discord.js";

export const messageNewDKG = async () => {
  try {
    const channel = await client.channels.fetch(LOGS_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle("New DKG Notification")
        .setDescription(
          "A new Distributed Key Generation (DKG) has been run. Please check for updates."
        )
        .setColor(EMBED_COLOR);

      await channel.send({ embeds: [embed] });
    } else {
      console.error("Channel not found");
    }
  } catch (error) {
    console.error("Error sending new DKG message:", error);
  }
};
