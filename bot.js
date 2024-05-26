require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
// Initialize collections for commands
client.commands = new Map();
client.slashCommands = new Map();

// Load exclamation commands
const exclamationCommandFiles = readdirSync("./commands/exclamation").filter(
  (file) => file.endsWith(".js")
);

for (const file of exclamationCommandFiles) {
  const command = require(`./commands/exclamation/${file}`);
  client.commands.set(command.name, command);
}

// Load slash commands
const slashCommandFiles = readdirSync(
  path.join(__dirname, "commands/slash")
).filter((file) => file.endsWith(".js"));

const commands = [];

for (const file of slashCommandFiles) {
  const command = require(path.join(__dirname, "commands/slash", file));
  client.slashCommands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("!")) {
    command(message);
  } else if (Math.random() < 0.3) {
    trashTalk(message);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing that command!",
      ephemeral: true,
    });
  }
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  try {
    console.log("Registering Slash Commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error(`Error registering slash commands: ${error}`);
  }
});

function trashTalk(message) {
  const index = Math.floor(Math.random() * 5);
  const arr = [
    "amma da konuştun be",
    "ne var len?",
    "bi sus ya",
    "<@214682641880842240> sen mi susturcaksın ben mi susturayım?",
    "Her şeyi de sen biliyosun",
  ];
  message.reply(arr[index]);
}

function command(message) {
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    command.execute(message);
  } catch (error) {
    console.error(error);
    message.reply("There was an error trying to execute that command!");
  }
}

client.login(process.env.CLIENT_TOKEN);
