import { prisma } from './db';

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.experimentMetricSnapshot.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.allocationSuggestion.deleteMany();

  // Create experiments
  const experiment1 = await prisma.experiment.create({
    data: {
      name: 'Google Search Campaign - Summer Sale',
      channel: 'Google Ads',
      status: 'active',
    },
  });

  const experiment2 = await prisma.experiment.create({
    data: {
      name: 'Facebook Awareness Campaign',
      channel: 'Facebook',
      status: 'active',
    },
  });

  const experiment3 = await prisma.experiment.create({
    data: {
      name: 'Email Newsletter - Product Launch',
      channel: 'Email',
      status: 'active',
    },
  });

  const experiment4 = await prisma.experiment.create({
    data: {
      name: 'Instagram Influencer Partnership',
      channel: 'Instagram',
      status: 'active',
    },
  });

  const experiment5 = await prisma.experiment.create({
    data: {
      name: 'LinkedIn B2B Campaign',
      channel: 'LinkedIn',
      status: 'paused',
    },
  });

  console.log('✅ Created 5 experiments');

  // Generate 30 days of historical metrics for each experiment
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Experiment 1: High performer - Good ROAS and conversion
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: experiment1.id,
        date,
        spend: 800 + Math.random() * 200, // $800-1000/day
        impressions: Math.floor(50000 + Math.random() * 10000),
        clicks: Math.floor(2500 + Math.random() * 500), // ~5% CTR
        conversions: Math.floor(125 + Math.random() * 25), // ~5% conversion rate
        revenue: 3500 + Math.random() * 500, // ~3.5-4x ROAS
      },
    });
  }

  // Experiment 2: Medium performer - Decent metrics
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: experiment2.id,
        date,
        spend: 600 + Math.random() * 100, // $600-700/day
        impressions: Math.floor(100000 + Math.random() * 20000),
        clicks: Math.floor(1500 + Math.random() * 300), // ~1.5% CTR
        conversions: Math.floor(45 + Math.random() * 15), // ~3% conversion rate
        revenue: 1200 + Math.random() * 300, // ~2x ROAS
      },
    });
  }

  // Experiment 3: Best performer - Excellent efficiency
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: experiment3.id,
        date,
        spend: 300 + Math.random() * 100, // $300-400/day
        impressions: Math.floor(15000 + Math.random() * 3000),
        clicks: Math.floor(900 + Math.random() * 150), // ~6% CTR
        conversions: Math.floor(90 + Math.random() * 20), // ~10% conversion rate
        revenue: 2000 + Math.random() * 400, // ~5x ROAS
      },
    });
  }

  // Experiment 4: Low performer - Needs improvement
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: experiment4.id,
        date,
        spend: 500 + Math.random() * 100, // $500-600/day
        impressions: Math.floor(80000 + Math.random() * 15000),
        clicks: Math.floor(800 + Math.random() * 200), // ~1% CTR
        conversions: Math.floor(16 + Math.random() * 8), // ~2% conversion rate
        revenue: 400 + Math.random() * 200, // ~1x ROAS (break-even)
      },
    });
  }

  // Experiment 5: Paused - Has some historical data
  for (let i = 0; i < 15; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: experiment5.id,
        date,
        spend: 400 + Math.random() * 100,
        impressions: Math.floor(20000 + Math.random() * 5000),
        clicks: Math.floor(400 + Math.random() * 100),
        conversions: Math.floor(20 + Math.random() * 10),
        revenue: 500 + Math.random() * 200, // ~1.25x ROAS
      },
    });
  }

  console.log('✅ Created 30 days of metrics for each experiment');

  console.log('\n📊 Seed Summary:');
  console.log('  - Experiment 1 (Google Ads): High performer, good ROAS');
  console.log('  - Experiment 2 (Facebook): Medium performer, decent metrics');
  console.log('  - Experiment 3 (Email): Best performer, excellent efficiency');
  console.log('  - Experiment 4 (Instagram): Low performer, needs optimization');
  console.log('  - Experiment 5 (LinkedIn): Paused, limited data\n');

  console.log('✨ Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
