const Groq = require('groq-sdk');
const HelpChatCache = require('../models/HelpChatCache');
const helpFaq = require('../data/helpFaq.json');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const normalize = (text) =>
  text.toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');

const helpChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, answer: "Message is required." });
    }

    const normalized = normalize(message);
    const inputWords = normalized.split(' ');

    // STEP 2 - FAQ keyword matching
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of helpFaq) {
      let score = 0;
      for (const keyword of faq.keywords) {
        if (inputWords.includes(keyword)) {
          score++;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    if (highestScore >= 2 && bestMatch) {
      console.log(`[HelpChat] FAQ hit for: "${normalized}"`);
      return res.json({
        success: true,
        answer: bestMatch.answer,
        source: "faq"
      });
    }

    // STEP 3 - Check MongoDB cache
    const allCached = await HelpChatCache.find({});

    let bestCacheMatch = null;
    let bestCacheScore = 0;

    const normalizedWords = normalized.split(' ')
      .filter(w => w.length > 2);

    allCached.forEach(entry => {
      const cachedWords = entry.normalizedQuestion
        .split(' ')
        .filter(w => w.length > 2);

      const matchCount = normalizedWords.filter(
        word => cachedWords.includes(word)
      ).length;

      const score = matchCount /
        Math.max(normalizedWords.length, 1);

      if (score > bestCacheScore) {
        bestCacheScore = score;
        bestCacheMatch = entry;
      }
    });

    if (bestCacheScore >= 0.6 && bestCacheMatch) {
      console.log(`[HelpChat] Cache hit for: "${normalized}" (score: ${bestCacheScore})`);
      await HelpChatCache.updateOne(
        { _id: bestCacheMatch._id },
        {
          $inc: { hitCount: 1 },
          $set: { lastUsedAt: new Date() }
        }
      );
      return res.json({
        success: true,
        answer: bestCacheMatch.answer,
        source: 'cache'
      });
    }

    // STEP 4 - Call Groq
    console.log(`[HelpChat] Calling Groq for: "${normalized}"`);
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are EcoTrace's in-app help 
          assistant. EcoTrace is an AI-powered carbon 
          emission tracking web app for businesses.
          Only answer questions about how to USE 
          the EcoTrace app — its dashboard, reports, 
          AI chat for logging emissions, filters, 
          Scope 1/2/3 classification, charts, 
          recommendations tab, theme toggle, 
          and navigation.
          Do NOT answer questions about carbon 
          science, external topics, general AI, 
          or anything unrelated to using this app.
          Keep answers concise — 2 to 4 sentences 
          maximum. Be friendly and helpful.`
        },
        ...history.slice(-6).map(msg => ({
          role: msg.role === 'user' ?
            'user' : 'assistant',
          content: msg.text
        })),
        { role: "user", content: message }
      ],
      max_tokens: 250,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "I couldn't find an answer. Try rephrasing.";

    // STEP 5 - Save to cache
    try {
      await HelpChatCache.findOneAndUpdate(
        { normalizedQuestion: normalized },
        {
          normalizedQuestion: normalized,
          answer,
          lastUsedAt: new Date(),
          $inc: { hitCount: 1 }
        },
        { upsert: true, new: true }
      );
      console.log(`[HelpChat] Saved to cache: "${normalized}"`);
    } catch (cacheErr) {
      console.warn(
        'Cache save failed:',
        cacheErr.message
      );
    }

    // STEP 6 - Return answer
    return res.json({
      success: true,
      answer,
      source: "groq"
    });

  } catch (error) {
    // STEP 7 - Error handling
    console.error("HelpChat Error:", error);
    return res.status(500).json({
      success: false,
      answer: "Something went wrong. Please try rephrasing your question."
    });
  }
};

module.exports = {
  helpChat
};