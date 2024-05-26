const fs = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const path = require("path");
const state = {
  queue: [],
  player: null,
  connection: null,
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
        ephemeral: true,
      });
      return;
    }

    const youtubeUrl = interaction.options.getString("url");
    if (!ytdl.validateURL(youtubeUrl)) {
      await interaction.reply({
        content: "This is not a valid YouTube link. Please check the URL.",
        ephemeral: true,
      });
      return;
    }

    try {
      const info = await ytdl.getInfo(youtubeUrl);
      const title = info.videoDetails.title;

      state.queue.push({ url: youtubeUrl, title });

      await interaction.reply({
        content: `${title} added to the queue.`,
        ephemeral: true,
      });

      if (state.queue.length === 1) {
        playNextSong(voiceChannel);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error processing your request.",
        ephemeral: true,
      });
    }
  },
};

async function playNextSong(voiceChannel) {
  if (state.queue.length === 0) {
    return;
  }

  const { url, title } = state.queue[0];

  try {
    if (!state.connection) {
      state.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });
    }

    const sanitizedTitle = title.replace(/[<>:"\/\\|?*]/g, "");
    const audioDirectory = path.join(__dirname, "music");

    if (!fs.existsSync(audioDirectory)) {
      fs.mkdirSync(audioDirectory);
    }

    const audioFilePath = path.join(audioDirectory, `${sanitizedTitle}.mp3`);
    const tempFilePath = path.join(audioDirectory, `${sanitizedTitle}.tmp.mp3`);

    const stream = ytdl(url, { filter: "audioonly" });
    const fileWriteStream = fs.createWriteStream(tempFilePath);

    stream.pipe(fileWriteStream);

    fileWriteStream.on("finish", () => {
      fs.renameSync(tempFilePath, audioFilePath);

      if (!state.player) {
        state.player = createAudioPlayer();
      }

      const resource = createAudioResource(audioFilePath);
      state.player.play(resource);
      if (state.connection) {
        state.connection.subscribe(state.player);
      } else {
        console.error(
          "Connection is null while trying to subscribe the player."
        );
      }

      state.player.on(AudioPlayerStatus.Idle, () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(audioFilePath);
          } catch (err) {
            console.error(`Error deleting file: ${err}`);
          }
        }, 2000);

        state.queue.shift(); 
        if (state.queue.length > 0) {
          playNextSong(voiceChannel); 
        } else {
          state.connection.destroy(); 
          state.connection = null;
          state.player = null;
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports.state = state;
module.exports.playNextSong = playNextSong;
