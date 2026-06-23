const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  try {
    console.log("Using Key:", process.env.GROQ_API_KEY ? "Found ✅" : "Missing ❌");
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Say hello in one word" }],
    });

    console.log("API Success:", completion.choices[0]?.message?.content);
  } catch (error) {
    console.error("API Error:", error.message);
  }
}

run();