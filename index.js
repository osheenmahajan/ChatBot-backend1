import express from 'express';
import dotenv from 'dotenv';
import connectDb from './database/db.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import cors from 'cors';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json()); // Parses JSON request body
app.use(cors());

app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("🚀 ChatBot Server is Live!");
});

app.post("/getans", async (req, res) => {

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  const genAI = new GoogleGenerativeAI("AIzaSyBflx3pzugWOlFiUZauZ4LIMawyUXJ4HLI");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  await chatSession.sendMessage(prompt)
    .then((response) => {
      return res.status(200).json({ response: response.response.text() });
    })
    .catch((error) => {
      return res.status(200).json({ error: "Gemini key is not valid" });
    });

});

connectDb().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`✅ Server running at http://localhost:${process.env.PORT}`);
  });
}).catch((err) => {
  console.error("❌ MongoDB connection failed", err);
});
