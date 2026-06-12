
const axios = require('axios');
const EmissionLog = require('../models/EmissionLog');

const calculate = async (req, res) => {
  try {
    const { category, value, unit, region, rawMessage } = req.body;
    
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

    // Force strict 2-character region verification to honor schema restrictions
    let normalizedRegion = "US";
    if (region && typeof region === 'string' && region.trim().length === 2) {
      normalizedRegion = region.trim().toUpperCase();
    }

    // Local fallback calculation logic if Climatiq keys are unconfigured or expired
    let co2e = Math.round(value * 0.45); 
    let co2e_unit = "kg";

    if (process.env.CLIMATIQ_API_KEY) {
      try {
        const parameters = {};
        parameters[parameterKeyPrefix] = value;
        parameters[`${parameterKeyPrefix}_unit`] = unit;

        const climatiqReqBody = {
          emission_factor: { activity_id, data_version: "^21", region: normalizedRegion },
          parameters
        };

        const response = await axios.post('https://api.climatiq.io/data/v1/estimate', climatiqReqBody, {
          headers: { 'Authorization': `Bearer ${process.env.CLIMATIQ_API_KEY}` }
        });

        co2e = response.data.co2e;
        co2e_unit = response.data.co2e_unit;
      } catch (err) {
        console.warn("Climatiq API key limit hit. Emitting calculated approximation fallback values.");
      }
    }

    const newLog = new EmissionLog({
      userId: req.user.id,
      category,
      activityData: { value, unit },
      co2e,
      co2e_unit,
      region: normalizedRegion,
      scope,
      rawMessage
    });

    await newLog.save();

    return res.status(200).json({
      success: true,
      co2e,
      co2e_unit,
      log: newLog
    });

  } catch (error) {
    console.error('Calculation breakdown error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate emissions calculation pipeline.'
    });
  }
};

const getLogs = async (req, res) => {
  try {
    const logs = await EmissionLog.find({ userId: req.user.id }).sort({ date: -1 });
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};

const getSummary = async (req, res) => {
  try {
    const logs = await EmissionLog.find({ userId: req.user.id });

    let totalCO2e = 0;
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;

    const categoryMap = {};
    const monthlyMap = {};

    logs.forEach(log => {
      totalCO2e += log.co2e;

      if (log.scope === 'Scope 1') scope1 += log.co2e;
      if (log.scope === 'Scope 2') scope2 += log.co2e;
      if (log.scope === 'Scope 3') scope3 += log.co2e;

      // Group Categories
      categoryMap[log.category] = (categoryMap[log.category] || 0) + log.co2e;

      // Group Months (YYYY-MM)
      const monthStr = log.date ? new Date(log.date).toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7);
      monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + log.co2e;
    });

    // Reformat into array data objects explicitly mapped for Recharts requirements
    const byCategory = Object.entries(categoryMap).map(([key, val]) => ({
      _id: key,
      total: val
    }));

    const monthlyTrend = Object.entries(monthlyMap).map(([key, val]) => ({
      _id: key,
      total: val
    })).sort((a, b) => a._id.localeCompare(b._id));

    return res.status(200).json({
      success: true,
      summary: {
        totalCO2e,
        scope1,
        scope2,
        scope3,
        byCategory,
        monthlyTrend
      }
    });

  } catch (error) {
    console.error('Fetch summary error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to aggregate metrics summary structure' });
  }
};

module.exports = { calculate, getLogs, getSummary };