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
          content: `You are EcoTrace's in-app help assistant. 
EcoTrace is a carbon emission tracking web app.

WHAT ECOTRACE ACTUALLY HAS — only these:
- Landing page with Get Started and Demo Login buttons
- Login and Register pages
- Dashboard page with:
  4 stat cards (Total CO2e, Scope 1, Scope 2, Scope 3)
  Bar chart showing emissions by category
  Pie chart showing category distribution
  Line chart showing monthly CO2e trend
  AI Chat tab to log emissions via natural language
  Recommendations tab showing 3 AI suggestions
- Reports page with:
  Summary cards (Total Logs, Total CO2e, Top Category, Today's Logs, Monthly Change, Avg per Log)
  Search by activity
  Date filter (All Time and other ranges)
  Category filter (All, Electricity, Travel, Shipping, Fuel)
  Scope filter (All, Scope 1, Scope 2, Scope 3)
  Sort dropdown (Newest First, Oldest First, Highest Emission, Lowest Emission)
  Emissions table (Date, Category, Scope, Activity, Region, CO2e)
  Export CSV button
  Print / PDF button
- Settings page (accessed by clicking your username in the navbar):
  View profile: name, email, company name, member-since date
  Edit Profile: update name and company name
  Change Password: requires current password, new password, confirm new password
  Email address is READ-ONLY and cannot be changed
- Navbar: Dashboard link, Reports link, Theme toggle, 
  Username display (click to open Settings), Logout button
- Floating EcoTrace Guide help widget (this chatbot)
- Demo account: demo@ecotrace.com / demo123

WHAT ECOTRACE DOES NOT HAVE:
- No email change feature — email is permanently fixed to the account
- No edit or delete for individual emission logs
- No team, collaboration, or multi-user features
- No notifications or alerts
- No mobile app
- No billing or subscription
- No integrations with external tools
- No data import feature

STRICT RULES:
1. NEVER mention features that do not exist in the list above
2. If asked about a missing feature say: "EcoTrace doesn't have that feature currently."
3. Only describe features from the list above
4. Never make up navigation steps
5. If unsure whether something exists say: "I'm not sure — try exploring the app directly"`
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