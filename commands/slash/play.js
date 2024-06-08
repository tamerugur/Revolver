// play.js

const fs = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const path = require("path");

const state = {
  title: null,
  queue: [],
  player: null,
  connection: null,
  timeout: null,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays audio from a YouTube URL")
    .addStringOption((option) =>
      option.setName("url").setDescription("YouTube URL").setRequired(true)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "You need to be in a voice channel to use this command!",
      });
      return;
    }

    const youtubeUrl = interaction.options.getString("url");
    if (!ytdl.validateURL(youtubeUrl)) {
      await interaction.reply({
        content: "This is not a valid YouTube link. Please check the URL.",
      });
      return;
    }

    try {
      const info = await ytdl.getInfo(youtubeUrl);
      const title = info.videoDetails.title;
      state.title = info.videoDetails.title;

      if (!state.connection) {
        state.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        // Listen for the disconnect event to delete files when leaving the voice channel
        state.connection.on(VoiceConnectionStatus.Disconnected, () => {
          deleteFiles();
        });
      }

      state.queue.push({ url: youtubeUrl, title });

      await interaction.reply({
        content: `${title} added to the queue.`,
      });

      if (state.queue.length === 1) {
        playNextSong(voiceChannel);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error processing your request.",
      });
    }
  },
};

async function playNextSong(voiceChannel) {
  if (state.queue.length === 0) {
    // Stop the current song if it is playing
    if (state.player) {
      state.player.stop(true);
    }
    return;
  }

  const { url, title } = state.queue[0];

  try {
    const sanitizedTitle = title.replace(/[<>:"\/\\|?*]/g, "");
    const audioDirectory = path.join(__dirname, "music");

    if (!fs.existsSync(audioDirectory)) {
      fs.mkdirSync(audioDirectory);
    }

    const audioFilePath = path.join(
      audioDirectory,
      `${sanitizedTitle}_${Date.now()}.mp3`
    );
    const tempFilePath = path.join(
      audioDirectory,
      `${sanitizedTitle}_${Date.now()}.tmp.mp3`
    );

    if (!fs.existsSync(audioFilePath)) {
      const stream = ytdl(url, { filter: "audioonly" });
      const fileWriteStream = fs.createWriteStream(tempFilePath);

      stream.pipe(fileWriteStream);

      fileWriteStream.on("finish", () => {
        fs.renameSync(tempFilePath, audioFilePath);
        playAudioFile(audioFilePath, voiceChannel, title);
      });
    } else {
      playAudioFile(audioFilePath, voiceChannel, title);
    }
  } catch (error) {
    console.error(error);
  }
}

function playAudioFile(audioFilePath, voiceChannel, title) {
  if (!state.player) {
    state.player = createAudioPlayer();
  }

  const resource = createAudioResource(audioFilePath);
  state.player.play(resource);
  if (state.connection) {
    state.connection.subscribe(state.player);
  } else {
    console.error("Connection is null while trying to subscribe the player.");
  }

  state.player.on(AudioPlayerStatus.Idle, () => {
    state.queue.shift();
    if (state.queue.length > 0) {
      playNextSong(voiceChannel);
    } else {
      // Set a timeout to disconnect after 5 minutes (300000 ms) of inactivity
      state.timeout = setTimeout(() => {
        if (state.connection) {
          state.connection.destroy();
          state.connection = null;
          state.player = null;
          state.title = null;
        }
      }, 300000); // 5 minutes
    }
  });
}

// New deleteFiles function
function deleteFiles() {
  const audioDirectory = path.join(__dirname, "music");
  fs.rm(audioDirectory, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error("Error deleting directory:", err);
    } else {
      console.log("Directory deleted successfully");
    }
  });
}

module.exports.state = state;
module.exports.playNextSong = playNextSong;
module.exports.deleteFiles = deleteFiles;
