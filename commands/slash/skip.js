const { SlashCommandBuilder } = require("@discordjs/builders");
const { state, playNextSong } = require("./play.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips the current song"),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "You need to be in a voice channel to skip the song!",
      });
      return;
    }

    if (!state.connection || !state.player) {
      await interaction.reply({
        content: "I am not currently playing any song!",
      });
      return;
    }

    const currentSong = state.queue[0];

    state.player.stop(true);
    if (state.queue.length > 0) {
      await interaction.reply({
        content: `${state.title} has been skipped.`,
      });
      state.queue.shift();
      playNextSong(voiceChannel);
    } else if (state.queue.length === 0) {
      await interaction.reply({
        content: `${state.title} has been skipped.`,
      });
      playNextSong(voiceChannel);
    } else {
      await interaction.followUp("I am not playing anything right now");
    }
  },
};
