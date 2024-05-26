require("dotenv").config();
const {
  REST,
  Routes,
  DefaultWebSocketManagerOptions,
  ApplicationCommandOptionType,
  Options,
} = require("discord.js");
const { name, description } = require("./commands/exclamation/kader");

const commands = [
  {
    name: "ping",
    description: "To check Revolver is online",
  },
  {
    name: "embed",
    description: "Sends an embed!",
  },
  { name: "join", description: "Joins Voice channel" },
];
const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

(async () => {
  try {
    console.log("Registering Commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commands are registered Successfully!");
  } catch (error) {
    console.log(`There was an error ${error}`);
  }
})();
