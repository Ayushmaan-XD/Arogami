const {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} = require("@google/generative-ai");
require("dotenv").config();

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Validate API keys
if (!process.env.API_KEY || !process.env.API_KEY2) {
  console.error('ERROR: Gemini API keys not configured in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const genAI2 = new GoogleGenerativeAI(process.env.API_KEY2);

const ifFail = async (_input) => {
  try {
    console.log("Primary model failed, trying backup...");
    const model = genAI2.getGenerativeModel({
      model: process.env.MODEL_NAME2 || "gemini-1.5-flash",
      safetySettings,
    });

    const prompt = _input;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Backup model succeeded");
    return text;
  } catch (err) {
    console.error("Backup model also failed:", err.message);
    return "Something Went Wrong :(";
  }
};

async function run(_input) {
  try {
    console.log(`Generating response with model: ${process.env.MODEL_NAME}`);
    const model = genAI.getGenerativeModel({
      model: process.env.MODEL_NAME || "gemini-1.5-flash",
      safetySettings,
    });

    const prompt = _input;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Primary model succeeded");
    return text;
  } catch (err) {
    console.error("Primary model error:", err.message);
    let final = await ifFail(_input);
    return final;
  }
}

module.exports = run;
