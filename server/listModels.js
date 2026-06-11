const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function run() {
  try {
    // List models is not directly exposed in the @google/generative-ai Node SDK sometimes
    // But let's try calling it via fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log("Models:", data.models?.map(m => m.name).join(', '));
    if (data.error) console.error("Error:", data.error.message);
  } catch (error) {
    console.error("API Error:", error.message);
  }
}
run();
