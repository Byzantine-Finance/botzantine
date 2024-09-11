import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

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
      type: 0, // 0 is for text channels
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
