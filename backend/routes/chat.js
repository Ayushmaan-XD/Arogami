const express = require("express");
let run = require("../chatAI/chat_api");
const logger = require('../config/logger');
const router = express.Router();

router.get("/", (req, res) => {
  res.send("chatBot up and running :)");
});

router.post("/bot1", async (req, res) => {
  try {
    let prompt = req.body.prompt;
    
    if (!prompt || prompt.trim() === '') {
      logger.warn('Empty prompt received');
      return res.status(400).json({
        user: prompt,
        response: "Please provide a valid question.",
      });
    }

    logger.info(`Chat request received: ${prompt.substring(0, 50)}...`);
    
    let data = await run(prompt);
    
    if (!data || data === "Something Went Wrong :(") {
      logger.error('Chat API returned error response');
      return res.status(200).json({
        user: prompt,
        response: "I'm having trouble generating a response right now. Please try again.",
      });
    }

    logger.info('Chat response generated successfully');
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      user: prompt,
      response: data,
    });
  } catch (err) {
    logger.error(`Chat error: ${err.message}`);
    console.error('Chat error details:', err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      user: req.body.prompt || '',
      response: "Something went wrong 😢. Please try again in a moment.",
    });
  }
});

module.exports = router;
