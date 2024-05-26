const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins the user's voice channel"),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return await interaction.reply({
        content: "You need to be in a voice channel to use this command!",
      });
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      await interaction.reply({
        content: `Joined ${voiceChannel.name}!`,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error joining the voice channel!",
      });
    }
  },
};
