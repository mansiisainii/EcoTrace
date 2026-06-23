const Groq = require("groq-sdk");
const EmissionLog = require("../models/EmissionLog");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Smart fallback — category wise alag alag CO2 formula
const localExtract = (message) => {
  const lower = message.toLowerCase();
  const numMatch = message.match(/[\d,]+\.?\d*/);
  const value = numMatch ? parseFloat(numMatch[0].replace(',', '')) : 500;

  if (lower.includes('electric') || lower.includes('kwh') || lower.includes('power')) {
    return { category: 'electricity', value, unit: 'kWh', region: 'US', description: 'Electricity usage', clarification_needed: null };
  }
  if (lower.includes('fly') || lower.includes('flew') || lower.includes('flight') || lower.includes('travel') || lower.includes('employee') || lower.includes('km') || lower.includes('drive') || lower.includes('car')) {
    // Estimate realistic distance: long haul international flights average 5000-7000km
    const passengers = lower.match(/(\d+)\s*employee/) ? parseInt(lower.match(/(\d+)\s*employee/)[1]) : 1;
    const estimatedDistance = lower.includes('fly') || lower.includes('flew') || lower.includes('flight') ? 6000 : value;
    return { category: 'travel', value: estimatedDistance * passengers, unit: 'km', region: 'US', description: 'Business travel', clarification_needed: null };
  }
  if (lower.includes('ship') || lower.includes('freight') || lower.includes('cargo') || lower.includes('goods') || lower.includes('deliver') || lower.includes('truck')) {
    return { category: 'shipping', value, unit: 'kg', region: 'US', description: 'Freight shipping', clarification_needed: null };
  }
  if (lower.includes('fuel') || lower.includes('diesel') || lower.includes('petrol') || lower.includes('litre') || lower.includes('liter') || lower.includes('generator') || lower.includes('gas')) {
    return { category: 'fuel', value, unit: 'litre', region: 'US', description: 'Fuel combustion', clarification_needed: null };
  }
  return { category: 'electricity', value, unit: 'kWh', region: 'US', description: 'General activity', clarification_needed: null };
};

const extractEmission = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  if (process.env.GROQ_API_KEY) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are an expert carbon emission calculator. Your ONLY job is to calculate the total carbon footprint (in kg CO2e) for the user's activity and return it as JSON.

IMPORTANT RULES:
1. ALWAYS calculate the final kg CO2e yourself using THESE EXACT FACTORS:
  - electricity: 0.4 kg CO2e/kWh
  - diesel: 2.68 kg CO2e/L
  - petrol: 2.31 kg CO2e/L
  - airFreight: 0.6 kg CO2e/ton-km
  - truckFreight: 0.12 kg CO2e/ton-km
  - motorcycle: 0.08 kg CO2e/km
  - carTravel: 0.17 kg CO2e/km
  - economyFlight: 0.15 kg CO2e/passenger-km

2. You MUST perform the math. Do NOT just extract the input numbers.
  Examples: 
  - "100 litres of diesel" -> 100 * 2.68 = 268 kg CO2e.
  - "2000 kWh electricity" -> 2000 * 0.4 = 800 kg CO2e.
  - "5 employees flew from Mumbai to Dubai" -> Estimate flight distance (~1900 km) * 5 passengers = 9500 passenger-km. 9500 * 0.15 = 1425 kg CO2e.
  - "Shipped 500kg goods from Delhi to London by air" -> 500kg = 0.5 tons. Distance ~6700 km. 0.5 * 6700 * 0.6 = 2010 kg CO2e.

3. ALWAYS set "value" to your final calculated kg CO2e amount.
4. ALWAYS set "unit" to "kg CO2e".
5. If the user asks a general question, asks for advice (e.g. "How can we reduce our footprint?"), or if no actual activity occurred, DO NOT log an emission. Return: {"clarification_needed": "Not an emission logging activity"}

Return ONLY this JSON shape:
{
  "category": "<electricity | travel | shipping | fuel>",
  "value": <number, your calculated total kg CO2e>,
  "unit": "kg CO2e",
  "region": "2-letter country code like US IN GB AE",
  "description": "short summary",
  "clarification_needed": null or string
}`
          },
          { role: "user", content: message }
        ],
        temperature: 0.2,
      });

      let text = completion.choices[0]?.message?.content || '';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.clarification_needed) {
          return res.json({ success: true, type: 'clarification', clarification_needed: extracted.clarification_needed });
        }
        return res.json({ success: true, type: 'extracted', data: extracted });
      }
    } catch (err) {
      console.warn("Groq failed, using local fallback:", err.message);
    }
  }

  const extracted = localExtract(message);
  return res.json({ success: true, type: 'extracted', data: extracted });
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
      .join(', ');

    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a carbon reduction expert. Return ONLY raw JSON array, no markdown:
[
  {
    "title": "max 6 words",
    "description": "2 specific sentences",
    "potential_reduction": "like 30-40%",
    "category": "electricity or travel or shipping or fuel",
    "priority": "high or medium or low"
  }
]`
            },
            { role: "user", content: `Company emissions: ${summaryStr}. Give 3 specific carbon reduction recommendations.` }
          ],
          temperature: 0.3,
        });

        let text = completion.choices[0]?.message?.content || '';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recs = JSON.parse(jsonMatch[0]);
          return res.json({ recommendations: recs });
        }
      } catch (err) {
        console.warn("Groq recommendations failed:", err.message);
      }
    }

    const topCategory = Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0] || 'electricity';
    const fallbackRecs = {
      electricity: { title: "Switch to Renewable Energy", description: "Consider switching to a green energy supplier. Installing solar panels can reduce electricity emissions by 40-60%.", potential_reduction: "40-60%", category: "electricity", priority: "high" },
      shipping: { title: "Optimize Freight Routes", description: "Consolidate shipments and switch from air to sea freight where possible. Sea freight emits 50x less CO2 than air.", potential_reduction: "40-60%", category: "shipping", priority: "high" },
      travel: { title: "Replace Flights with Video Calls", description: "Use virtual meetings for non-essential travel. Each avoided flight saves hundreds of kg CO2.", potential_reduction: "30-50%", category: "travel", priority: "medium" },
      fuel: { title: "Upgrade to Electric Vehicles", description: "Replace diesel generators and vehicles with electric alternatives. EV adoption can cut fuel emissions by 70%.", potential_reduction: "50-70%", category: "fuel", priority: "high" }
    };

    const recs = Object.keys(summary)
      .sort((a, b) => summary[b] - summary[a])
      .slice(0, 3)
      .map(cat => fallbackRecs[cat] || fallbackRecs.electricity);

    return res.json({ recommendations: recs });
  } catch (err) {
    console.error("Recommendations error:", err.message);
    return res.status(500).json({ error: "Failed to get recommendations" });
  }
};

module.exports = { extractEmission, getRecommendations };