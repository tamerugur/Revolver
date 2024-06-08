const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const { deleteFiles } = require("./play.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leaves the voice channel"),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "I'm not in a voice channel!",
      });
      return;
    }

    const connection = getVoiceConnection(voiceChannel.guild.id);
    if (!connection) {
      await interaction.reply({
        content: "I'm not connected to a voice channel!",
      });
      return;
    }
    deleteFiles();
    connection.destroy();
    await interaction.reply("Left the voice channel!");
  },
};
