const axios = require('axios');
const EmissionLog = require('../models/EmissionLog');

const calculate = async (req, res) => {
  try {
    const { category, value, unit, region, rawMessage } = req.body;
    
    // Map category to Climatiq activity_id
    let activity_id = "";
    let scope = "";
    let parameterKeyPrefix = "";
    
    switch (category) {
      case 'electricity':
        activity_id = "electricity-supply_grid-source_residual_mix";
        scope = "Scope 2";
        parameterKeyPrefix = "energy";
        break;
      case 'travel':
        activity_id = "passenger_vehicle-vehicle_type_car-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na";
        scope = "Scope 3";
        parameterKeyPrefix = "distance";
        break;
      case 'shipping':
        activity_id = "freight_vehicle-vehicle_type_hgv-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na";
        scope = "Scope 3";
        parameterKeyPrefix = "weight";
        break;
      case 'fuel':
        activity_id = "fuel_combustion-type_diesel";
        scope = "Scope 1";
        parameterKeyPrefix = "volume";
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const parameters = {};
    parameters[parameterKeyPrefix] = value;
    parameters[`${parameterKeyPrefix}_unit`] = unit;

    const climatiqReqBody = {
      emission_factor: {
        activity_id,
        data_version: "^21",
        region: region || "US"
      },
      parameters
    };

    const response = await axios.post('https://api.climatiq.io/data/v1/estimate', climatiqReqBody, {
      headers: {
        'Authorization': `Bearer ${process.env.CLIMATIQ_API_KEY}`
      }
    });

    const { co2e, co2e_unit } = response.data;

    const newLog = new EmissionLog({
      userId: req.user.id,
      category,
      activityData: { value, unit },
      co2e,
      co2e_unit,
      region: region || "US",
      scope,
      rawMessage
    });

    await newLog.save();

    res.status(200).json({
      success: true,
      co2e,
      co2e_unit,
      log: newLog
    });

  } catch (error) {
    console.error('Climatiq API error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate emissions',
      error: error.response ? error.response.data : error.message
    });
  }
};

const getLogs = async (req, res) => {
  try {
    const logs = await EmissionLog.find({ userId: req.user.id }).sort({ date: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Fetch logs error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};

const getSummary = async (req, res) => {
  try {
    const logs = await EmissionLog.find({ userId: req.user.id });

    const summary = {};
    const monthly = {};
    const scopeSummary = {};
    let total = 0;

    logs.forEach(log => {
      // Category Summary
      if (!summary[log.category]) summary[log.category] = 0;
      summary[log.category] += log.co2e;

      // Month Summary (YYYY-MM)
      const monthStr = log.date.toISOString().substring(0, 7);
      if (!monthly[monthStr]) monthly[monthStr] = 0;
      monthly[monthStr] += log.co2e;

      // Scope Summary
      if (!scopeSummary[log.scope]) scopeSummary[log.scope] = 0;
      scopeSummary[log.scope] += log.co2e;

      // Total
      total += log.co2e;
    });

    res.status(200).json({ summary, monthly, scopeSummary, total });

  } catch (error) {
    console.error('Fetch summary error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

module.exports = { calculate, getLogs, getSummary };
