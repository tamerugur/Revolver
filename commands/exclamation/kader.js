module.exports = {
  name: "kader",
  description: "Decides the fate",
  execute: async (message) => {
    const players = ["Tamer", "Berke"];
    const index = Math.floor(Math.random() * 2);
    const result = players[index] + " haklı.";
    message.channel.send(result);
  },
};
