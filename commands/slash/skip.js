const { SlashCommandBuilder } = require("@discordjs/builders");
const path = require("path");
const fs = require("fs");

// Ensure the global state is shared between commands
const state = require("./play").state;
const { playNextSong } = require("./play");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips the current song"),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel || !voiceChannel.guildId) {
      await interaction.reply({
        content: "You need to be in a voice channel to skip the song!",
        ephemeral: true,
      });
      return;
    }

    if (!state.connection || !state.player) {
      await interaction.reply({
        content: "I am not currently playing any song!",
        ephemeral: true,
      });
      console.log("I am not currently playing");
      return;
    }

    const currentSong = state.queue[0];

    if (!currentSong) {
      await interaction.reply({
        content: "There is no song currently playing!",
        ephemeral: true,
      });
      return;
    }

    state.player.stop(true);

    await interaction.reply({
      content: `The current song has been skipped.`,
      ephemeral: true,
    });

    setTimeout(() => {
      const audioFilePath = path.join(
        __dirname,
        "music",
        `${currentSong.title}.mp3`
      );
      if (fs.existsSync(audioFilePath)) {
        try {
          fs.unlinkSync(audioFilePath);
        } catch (err) {
          console.error(`Error deleting file: ${err}`);
        }
      }
    }, 2000);

    state.queue.shift();

    // Play the next song in the queue if available
    if (state.queue.length > 0) {
      playNextSong(voiceChannel);
    } else {
      state.connection.destroy();
      state.connection = null;
      state.player = null;
    }
  },
};
