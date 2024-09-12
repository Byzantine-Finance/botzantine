import { client } from "./discord.js";
import { LOGS_CHANNEL_ID, EMBED_COLOR } from "../constants/index.js";
import { EmbedBuilder } from "discord.js";

export const messageNewCluster = async (config_hash, operators) => {
  const etherscanHoleskyUrl = "https://holesky.etherscan.io";
  const byzantineClusterUrl = `https://operator.byzantine.fi/cluster/${config_hash}`;

  const operatorList = operators.map((op) => `- ${op}`).join("\n");

  const description = `A new cluster has been created!

Config Hash: \`${config_hash}\`

Operators:
${operatorList}

You can view the cluster here: ${byzantineClusterUrl}

For more details, check Etherscan (Holesky): ${etherscanHoleskyUrl}`;

  const embed = new EmbedBuilder()
    .setTitle("New Cluster Notification")
    .setDescription(description)
    .setColor(EMBED_COLOR);

  try {
    const channel = await client.channels.fetch(LOGS_CHANNEL_ID);
    if (channel) {
      await channel.send({ embeds: [embed] });
    } else {
      console.error("Channel not found");
    }
  } catch (error) {
    console.error("Error sending new cluster message:", error);
  }
};
