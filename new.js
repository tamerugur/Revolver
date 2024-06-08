const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectDB() {
  await client.connect();
  db = client.db("dcserver");
  console.log("Connected to MongoDB");
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
