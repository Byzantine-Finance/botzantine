import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from "discord.js";

import {
  CLUSTER_SALON_ID,
  BENOIT_ID,
  LIN_ID,
  ALEXCANDRE_ID,
  JONAS_ID,
  EMBED_COLOR,
} from "./constant.js";
import { client } from "./discord.js";

import dotenv from "dotenv";
dotenv.config();

export const createPrivateChannelCommand = new SlashCommandBuilder()
  .setName("createprivatechannel")
  .setDescription("Creates a private channel and adds up to 3 users")
  .addUserOption((option) =>
    option
      .setName("user1")
      .setDescription("The first user to add to the channel")
      .setRequired(true)
  )
  .addUserOption((option) =>
    option
      .setName("user2")
      .setDescription("The second user to add to the channel")
      .setRequired(false)
  )
  .addUserOption((option) =>
    option
      .setName("user3")
      .setDescription("The third user to add to the channel")
      .setRequired(false)
  );

export const handleCreatePrivateChannelCommand = async (interaction) => {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: "You don't have permission to create channels.",
      ephemeral: true,
    });
  }

  console.log(">>>>>>>>>> starting create private channel command");
  const parentChannelId = "1245339120579117076";

  const user1 = interaction.options.getUser("user1");
  const user2 = interaction.options.getUser("user2");
  const user3 = interaction.options.getUser("user3");

  const users = [user1, user2, user3].filter((user) => user !== null);

  try {
    console.log(">>>>>>>>>> Creating private channel...");
    await interaction.reply({
      content: "Creating private channel...",
      ephemeral: true,
    });
    const channel = await interaction.guild.channels.create({
      name: `private-${users.map((user) => user.username).join("-")}`, //with all the users
      type: 0,
      parent: parentChannelId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
        ...users.map((user) => ({
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        })),
      ],
    });

    console.log("Private channel created:", channel);
    await interaction.editReply({
      content: `Private channel created: ${channel}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error creating private channel:", error);
    await interaction.reply({
      content: "There was an error creating the private channel.",
      ephemeral: true,
    });
  }
};

//add a function to create a private channel in the discord server, with parameters the config_hash and the operators
// (we'll get the id of the operators based on their address, but rn we just hardcode a list of ID)

export const createPrivateChannel = async (
  config_hash,
  operators,
  number_dv
) => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  const id_users = [BENOIT_ID];

  try {
    console.log(">>>>>>>>>> Creating private channel...", client.user);
    console.log("and going to add the users", id_users);
    const channel = await guild.channels.create({
      name: `cluster-${number_dv}`,
      parent: CLUSTER_SALON_ID,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        //TODO: fix this
        // ...id_users.map((userId) => ({
        //   id: userId,
        //   allow: [PermissionFlagsBits.ViewChannel],
        // })),
      ],
    });

    // console.log("Private channel created:", channel);
    if (channel) {
      const byzantineClusterUrl = `https://operator.byzantine.fi/cluster/${config_hash}`;
      const operatorList = operators.map((op) => `- ${op}`).join("\n");

      const description = `Welcome to the channel for the Byzantine DV${number_dv}!

    We created this channel with the operators to facilitate communication between you.
    Please use it to efficiently coordinate on the next steps.

    Operators:
    ${operatorList}

    You can view the cluster here: ${byzantineClusterUrl}`;

      const embed = new EmbedBuilder()
        .setTitle("New Cluster Notification")
        .setDescription(description)
        .setColor(EMBED_COLOR);

      const message = await channel.send({ embeds: [embed] });
    }

    return channel;
  } catch (error) {
    console.error("Error creating private channel:", error);
    throw error;
  }
};
