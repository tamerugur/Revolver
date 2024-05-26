const fs = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const path = require("path");

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
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      await interaction.reply({
        content: `playing`,
      });

      const player = createAudioPlayer();
      const stream = ytdl(youtubeUrl, { filter: "audioonly" });

      console.log("Stream created");

      const info = await ytdl.getInfo(youtubeUrl);
      const title = info.videoDetails.title;
      const audioDirectory = path.join(__dirname, "music");
      const audioFilePath = path.join(audioDirectory, `${title}.mp3`);
      // Create directory if it doesn't exist

      const fileWriteStream = fs.createWriteStream(audioFilePath);
      fileWriteStream.on("finish", () => {
        console.log("Audio file downloaded:", audioFilePath);
      });
      stream.pipe(fileWriteStream);
      console.log("8");
      stream.on("end", async () => {
        // Create an audio resource from the downloaded file
        console.log("8");
        const resource = createAudioResource(audioFilePath);
        console.log("9");
        // Play the audio resource
        player.play(resource);
        console.log("10");
        // Subscribe the connection to the player
        connection.subscribe(player);
        // Log a message indicating that the audio is playing
        console.log("Audio playback started");

        // Event listener for when the player finishes playing
        player.on(AudioPlayerStatus.Idle, () => {
          // Send a message to indicate that the bot has finished playing the audio
          console.log("Audio playback finished");
          // Cleanup resources, such as deleting the temporary audio file
          setTimeout(() => {
            // Cleanup resources, such as deleting the temporary audio file
            fs.unlinkSync(audioFilePath);
            // Destroy the connection
            connection.destroy();
          }, 60000);
        });
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "There was an error joining the voice channel or playing the audio file!",
        ephemeral: true,
      });
    }
  },
};
