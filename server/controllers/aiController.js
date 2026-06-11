const { GoogleGenerativeAI } = require("@google/generative-ai");
const EmissionLog = require("../models/EmissionLog");
const User = require("../models/User");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractEmission = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are an emission data 
     extractor for a carbon tracking app.
     Extract emission data from the user 
     message and return ONLY a valid JSON 
     object with these exact fields:
     {
       category: electricity|travel|
                 shipping|fuel,
       value: number,
       unit: string,
       region: string (2-letter country 
               code, default US),
       description: string (human readable 
                    short summary),
       clarification_needed: string | null
     }
     Units guide:
     electricity → kWh
     travel → km
     shipping → kg
     fuel → litre
     Country codes: India=IN, UK=GB, 
     US=US, UAE=AE, Germany=DE, 
     Australia=AU, Canada=CA, Singapore=SG
     If info is missing or unclear set 
     clarification_needed to a short 
     question string.
     Return ONLY raw JSON. 
     No markdown. No backticks. 
     No explanation.
     
     User message: ${message}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();

    console.log("Gemini Response:");
    console.log(clean);

    const extracted = JSON.parse(clean);

    if (extracted.clarification_needed) {
      return res.json({
        type: "clarification",
        message: extracted.clarification_needed,
      });
    } else {
      return res.json({ type: "extracted", data: extracted });
    }
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return res.status(500).json({ error: "AI parsing failed" });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const logs = await EmissionLog.find({ userId: req.user.id });
    if (!logs || logs.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Build summary string of emissions by category
    const categoryTotals = {};
    logs.forEach((log) => {
      if (!categoryTotals[log.category]) {
        categoryTotals[log.category] = 0;
      }
      categoryTotals[log.category] += log.co2e;
    });

    const emission_summary_string = Object.entries(categoryTotals)
      .map(([cat, total]) => `${cat}: ${total} kg CO2e`)
      .join(", ");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a carbon reduction 
     expert. Based on company emission data, 
     generate exactly 3 specific actionable 
     recommendations.
     Return ONLY a valid JSON array:
     [
       {
         title: string (short max 6 words),
         description: string 
                      (specific action 
                       2 sentences),
         potential_reduction: string 
                              (e.g. 30-40%),
         category: string (emission 
                    category targeted),
         priority: high|medium|low
       }
     ]
     No markdown. No backticks. 
     Raw JSON array only.
     
     Emission data: ${emission_summary_string}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const recommendations = JSON.parse(clean);

    return res.json({ recommendations });
  } catch (error) {
    console.error("AI Recommendations Error:", error);
    return res.status(500).json({ error: "AI parsing failed" });
  }
};

module.exports = {
  extractEmission,
  getRecommendations,
};
