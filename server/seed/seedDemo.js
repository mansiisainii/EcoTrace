require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const EmissionLog = require('../models/EmissionLog');

const seedDemo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Delete existing demo user and logs
    const existingUser = await User.findOne({ email: 'demo@ecotrace.com' });
    if (existingUser) {
      await EmissionLog.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ email: 'demo@ecotrace.com' });
    }

    // Create demo user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    const demoUser = new User({
      name: 'Acme Corporation',
      email: 'demo@ecotrace.com',
      password: hashedPassword,
      company: 'Acme Corp',
    });

    await demoUser.save();

    // Generate 20 logs
    const categories = [
      { name: 'electricity', min: 800, max: 2000, scope: 'Scope 2', unit: 'kWh' },
      { name: 'shipping', min: 1000, max: 3500, scope: 'Scope 3', unit: 'kg' },
      { name: 'travel', min: 400, max: 1800, scope: 'Scope 3', unit: 'km' },
      { name: 'fuel', min: 200, max: 600, scope: 'Scope 1', unit: 'litre' },
    ];
    const regions = ['IN', 'US', 'GB', 'AE'];

    const logs = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const catDef = categories[Math.floor(Math.random() * categories.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const co2e = Math.floor(Math.random() * (catDef.max - catDef.min + 1)) + catDef.min;
      
      // Random date within the last 3 months (90 days)
      const daysAgo = Math.floor(Math.random() * 90);
      const logDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      logs.push({
        userId: demoUser._id,
        category: catDef.name,
        activityData: {
          value: Math.floor(co2e * 1.5), // fake value calculation
          unit: catDef.unit
        },
        co2e: co2e,
        co2e_unit: 'kg',
        region: region,
        scope: catDef.scope,
        rawMessage: `Demo generated log for ${catDef.name} in ${region}`,
        date: logDate
      });
    }

    await EmissionLog.insertMany(logs);
    console.log('Demo data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDemo();
