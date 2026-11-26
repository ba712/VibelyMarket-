import express from "express";
import cors from "cors";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "10kb" }));

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
}));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10
}));

app.get("/", (req, res) => {
  res.send("Vibely AI Backend is running!");
});

app.post("/api/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (typeof question !== "string" ||
        !question.trim() ||
        question.length > 1200) {
      return res.status(400).json({
        error: "Please enter a valid question."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI service is not configured yet."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: "You are Vibely AI, a helpful business assistant. Help sellers with product descriptions, pricing ideas, sales, stock and customer service. Do not invent sales or stock data.",
      input: question.trim()
    });

    res.json({ answer: response.output_text });

  } catch (error) {
    console.error("AI request failed:", error.status || error.name);
    res.status(500).json({
      error: "AI could not answer right now. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Vibely AI server running on port " + PORT);
});