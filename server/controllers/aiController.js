const { GoogleGenerativeAI } = require("@google/generative-ai");
const EmissionLog = require("../models/EmissionLog");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Smart fallback — category wise alag alag CO2 formula
const localExtract = (message) => {
  const lower = message.toLowerCase();
  const numMatch = message.match(/[\d,]+\.?\d*/);
  const value = numMatch ? parseFloat(numMatch[0].replace(",", "")) : 500;

  if (
    lower.includes("electric") ||
    lower.includes("kwh") ||
    lower.includes("power")
  ) {
    return {
      category: "electricity",
      value,
      unit: "kWh",
      region: "US",
      description: "Electricity usage",
      clarification_needed: null,
    };
  }
  if (
    lower.includes("fly") ||
    lower.includes("flew") ||
    lower.includes("flight") ||
    lower.includes("travel") ||
    lower.includes("employee") ||
    lower.includes("km") ||
    lower.includes("drive") ||
    lower.includes("car")
  ) {
    return {
      category: "travel",
      value,
      unit: "km",
      region: "US",
      description: "Business travel",
      clarification_needed: null,
    };
  }
  if (
    lower.includes("ship") ||
    lower.includes("freight") ||
    lower.includes("cargo") ||
    lower.includes("goods") ||
    lower.includes("deliver") ||
    lower.includes("truck")
  ) {
    return {
      category: "shipping",
      value,
      unit: "kg",
      region: "US",
      description: "Freight shipping",
      clarification_needed: null,
    };
  }
  if (
    lower.includes("fuel") ||
    lower.includes("diesel") ||
    lower.includes("petrol") ||
    lower.includes("litre") ||
    lower.includes("liter") ||
    lower.includes("generator") ||
    lower.includes("gas")
  ) {
    return {
      category: "fuel",
      value,
      unit: "litre",
      region: "US",
      description: "Fuel combustion",
      clarification_needed: null,
    };
  }
  return {
    category: "electricity",
    value,
    unit: "kWh",
    region: "US",
    description: "General activity",
    clarification_needed: null,
  };
};

// CO2 formula per category (fallback when Climatiq fails)
const localCO2Formula = (category, value) => {
  switch (category) {
    case "electricity":
      return parseFloat((value * 0.233).toFixed(1)); // kg CO2e per kWh
    case "travel":
      return parseFloat((value * 0.171).toFixed(1)); // kg CO2e per km car
    case "shipping":
      return parseFloat((value * 0.062).toFixed(1)); // kg CO2e per kg freight
    case "fuel":
      return parseFloat((value * 2.68).toFixed(1)); // kg CO2e per litre diesel
    default:
      return parseFloat((value * 0.5).toFixed(1));
  }
};

const extractEmission = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Extract carbon emission data from: "${message}"
Return ONLY this JSON, no markdown, no explanation:
{
  "category": "electricity" or "travel" or "shipping" or "fuel",
  "value": number,
  "unit": "kWh" or "km" or "kg" or "litre",
  "region": "2-letter country code like US IN GB AE",
  "description": "short summary",
  "clarification_needed": null or "question if unclear"
}`;
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.clarification_needed) {
          return res.json({
            success: true,
            type: "clarification",
            clarification_needed: extracted.clarification_needed,
          });
        }
        return res.json({ success: true, type: "extracted", data: extracted });
      }
    } catch (err) {
      console.warn("Gemini failed, using local fallback:", err.message);
    }
  }

  // Local fallback
  const extracted = localExtract(message);
  return res.json({ success: true, type: "extracted", data: extracted });
};

const getRecommendations = async (req, res) => {
  try {
    const logs = await EmissionLog.find({ userId: req.user.id });
    if (!logs || logs.length === 0) return res.json({ recommendations: [] });

    const summary = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + log.co2e;
      return acc;
    }, {});

    const summaryStr = Object.entries(summary)
      .map(([k, v]) => `${k}: ${v.toFixed(1)} kg CO2e`)
      .join(", ");

    // Try Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Company emissions: ${summaryStr}
Give 3 specific carbon reduction recommendations.
Return ONLY this JSON array, no markdown:
[
  {
    "title": "max 6 words",
    "description": "2 specific sentences",
    "potential_reduction": "like 30-40%",
    "category": "electricity or travel or shipping or fuel",
    "priority": "high or medium or low"
  }
]`;
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recs = JSON.parse(jsonMatch[0]);
          return res.json({ recommendations: recs });
        }
      } catch (err) {
        console.warn("Gemini recommendations failed:", err.message);
      }
    }

    // Smart fallback recommendations based on actual data
    const topCategory =
      Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "electricity";
    const fallbackRecs = {
      electricity: {
        title: "Switch to Renewable Energy",
        description:
          "Consider switching to a green energy supplier. Installing solar panels can reduce electricity emissions by 40-60%.",
        potential_reduction: "40-60%",
        category: "electricity",
        priority: "high",
      },
      shipping: {
        title: "Optimize Freight Routes",
        description:
          "Consolidate shipments and switch from air to sea freight where possible. Sea freight emits 50x less CO2 than air.",
        potential_reduction: "40-60%",
        category: "shipping",
        priority: "high",
      },
      travel: {
        title: "Replace Flights with Video Calls",
        description:
          "Use virtual meetings for non-essential travel. Each avoided flight saves hundreds of kg CO2.",
        potential_reduction: "30-50%",
        category: "travel",
        priority: "medium",
      },
      fuel: {
        title: "Upgrade to Electric Vehicles",
        description:
          "Replace diesel generators and vehicles with electric alternatives. EV adoption can cut fuel emissions by 70%.",
        potential_reduction: "50-70%",
        category: "fuel",
        priority: "high",
      },
    };

    const recs = Object.keys(summary)
      .sort((a, b) => summary[b] - summary[a])
      .slice(0, 3)
      .map((cat) => fallbackRecs[cat] || fallbackRecs.electricity);

    return res.json({ recommendations: recs });
  } catch (err) {
    console.error("Recommendations error:", err.message);
    return res.status(500).json({ error: "Failed to get recommendations" });
  }
};

module.exports = { extractEmission, getRecommendations };
