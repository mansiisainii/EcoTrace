const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
console.log("Using Key:", key);

const genAI = new GoogleGenerativeAI(key);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hi');
    console.log("API Success:", result.response.text());
  } catch (error) {
    console.error("API Error:", error.message);
  }
}
run();
