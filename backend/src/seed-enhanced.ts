import { prisma } from './db';
import { logger } from './lib/logger';

async function main() {
  logger.info('🌱 Starting enhanced database seeding...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.experimentTagAssignment.deleteMany();
  await prisma.experimentTag.deleteMany();
  await prisma.performanceAlert.deleteMany();
  await prisma.experimentMetricSnapshot.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.allocationSuggestion.deleteMany();
  await prisma.budgetPlan.deleteMany();
  await prisma.experimentGroup.deleteMany();
  await prisma.allocationStrategy.deleteMany();

  logger.info('✅ Cleared existing data');

  // Create allocation strategies
  const compositeStrategy = await prisma.allocationStrategy.create({
    data: {
      name: 'composite',
      description: 'Balanced strategy weighing ROAS, conversion rate, and revenue',
      type: 'composite',
      config: {
        weights: { roas: 0.4, conversionRate: 0.3, revenuePerSpend: 0.3 },
      },
    },
  });

  const revenueStrategy = await prisma.allocationStrategy.create({
    data: {
      name: 'revenue-focused',
      description: 'Prioritizes total revenue generation',
      type: 'custom',
      config: {
        weights: { revenue: 0.6, roas: 0.3, conversionRate: 0.1 },
      },
    },
  });

  const efficiencyStrategy = await prisma.allocationStrategy.create({
    data: {
      name: 'efficiency-focused',
      description: 'Optimizes for low CAC and high conversion rates',
      type: 'custom',
      config: {
        weights: { cac: 0.4, conversionRate: 0.4, ctr: 0.2 },
      },
    },
  });

  logger.info('✅ Created 3 allocation strategies');

  // Create experiment groups (hierarchical)
  const ecommerceGroup = await prisma.experimentGroup.create({
    data: {
      name: 'E-commerce Campaigns',
      description: 'All e-commerce related marketing experiments',
    },
  });

  const paidSocialGroup = await prisma.experimentGroup.create({
    data: {
      name: 'Paid Social',
      description: 'Social media advertising campaigns',
      parentId: ecommerceGroup.id,
    },
  });

  const paidSearchGroup = await prisma.experimentGroup.create({
    data: {
      name: 'Paid Search',
      description: 'Search engine marketing campaigns',
      parentId: ecommerceGroup.id,
    },
  });

  const saasGroup = await prisma.experimentGroup.create({
    data: {
      name: 'SaaS Growth',
      description: 'SaaS product growth experiments',
    },
  });

  logger.info('✅ Created 4 experiment groups with hierarchy');

  // Create tags
  const highPriorityTag = await prisma.experimentTag.create({
    data: {
      name: 'High Priority',
      color: '#FF0000',
      description: 'Critical campaigns requiring close monitoring',
    },
  });

  const seasonalTag = await prisma.experimentTag.create({
    data: {
      name: 'Seasonal',
      color: '#FFA500',
      description: 'Time-sensitive seasonal campaigns',
    },
  });

  const testingTag = await prisma.experimentTag.create({
    data: {
      name: 'A/B Testing',
      color: '#0000FF',
      description: 'Experiments under active testing',
    },
  });

  const evergreen Tag = await prisma.experimentTag.create({
    data: {
      name: 'Evergreen',
      color: '#008000',
      description: 'Continuously running campaigns',
    },
  });

  logger.info('✅ Created 4 tags');

  // Scenario 1: E-commerce company with diverse channels
  const exp1 = await prisma.experiment.create({
    data: {
      name: 'Google Shopping - Holiday Sale',
      channel: 'Google Ads',
      status: 'active',
      description: 'Product listing ads for holiday season',
      groupId: paidSearchGroup.id,
      metadata: { targetAudience: 'bargain hunters', geo: 'US' },
    },
  });

  const exp2 = await prisma.experiment.create({
    data: {
      name: 'Facebook Retargeting - Cart Abandoners',
      channel: 'Facebook',
      status: 'active',
      description: 'Retargeting campaign for abandoned carts',
      groupId: paidSocialGroup.id,
      metadata: { targetAudience: 'cart abandoners', geo: 'US+CA' },
    },
  });

  const exp3 = await prisma.experiment.create({
    data: {
      name: 'Instagram Influencer - Fashion',
      channel: 'Instagram',
      status: 'active',
      description: 'Influencer partnership for fashion products',
      groupId: paidSocialGroup.id,
      metadata: { influencer: '@fashionista', geo: 'Global' },
    },
  });

  const exp4 = await prisma.experiment.create({
    data: {
      name: 'Email Drip - Welcome Series',
      channel: 'Email',
      status: 'active',
      description: 'Automated welcome email sequence',
      groupId: ecommerceGroup.id,
      metadata: { sequence: '5-email series', trigger: 'signup' },
    },
  });

  const exp5 = await prisma.experiment.create({
    data: {
      name: 'LinkedIn B2B - Enterprise',
      channel: 'LinkedIn',
      status: 'paused',
      description: 'B2B campaign targeting enterprise customers',
      groupId: saasGroup.id,
      metadata: { targetCompanySize: '1000+', industry: 'tech' },
    },
  });

  const exp6 = await prisma.experiment.create({
    data: {
      name: 'TikTok Brand Awareness',
      channel: 'TikTok',
      status: 'active',
      description: 'Brand awareness campaign targeting Gen Z',
      groupId: paidSocialGroup.id,
      metadata: { targetAge: '18-24', contentType: 'video' },
    },
  });

  const exp7 = await prisma.experiment.create({
    data: {
      name: 'Google Search - Brand Defense',
      channel: 'Google Ads',
      status: 'active',
      description: 'Protecting brand keywords from competitors',
      groupId: paidSearchGroup.id,
      metadata: { strategy: 'brand defense', keywords: 'brand terms' },
    },
  });

  const exp8 = await prisma.experiment.create({
    data: {
      name: 'Pinterest Shopping - Home Decor',
      channel: 'Pinterest',
      status: 'active',
      description: 'Product pins for home decor category',
      groupId: paidSocialGroup.id,
      metadata: { category: 'home decor', format: 'product pins' },
    },
  });

  logger.info('✅ Created 8 experiments');

  // Tag assignments
  await prisma.experimentTagAssignment.createMany({
    data: [
      { experimentId: exp1.id, tagId: highPriorityTag.id },
      { experimentId: exp1.id, tagId: seasonalTag.id },
      { experimentId: exp2.id, tagId: highPriorityTag.id },
      { experimentId: exp2.id, tagId: evergreenTag.id },
      { experimentId: exp3.id, tagId: testingTag.id },
      { experimentId: exp4.id, tagId: evergreenTag.id },
      { experimentId: exp6.id, tagId: testingTag.id },
      { experimentId: exp7.id, tagId: evergreenTag.id },
      { experimentId: exp8.id, tagId: seasonalTag.id },
    ],
  });

  logger.info('✅ Tagged experiments');

  // Generate 90 days of historical metrics with varied performance
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  // Exp1: High performer with seasonal boost
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const seasonalMultiplier = i > 60 ? 1.5 : 1.0; // Boost in last 30 days

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp1.id,
        date,
        spend: (800 + Math.random() * 200) * seasonalMultiplier,
        impressions: Math.floor((50000 + Math.random() * 10000) * seasonalMultiplier),
        clicks: Math.floor((2500 + Math.random() * 500) * seasonalMultiplier),
        conversions: Math.floor((125 + Math.random() * 25) * seasonalMultiplier),
        revenue: (3500 + Math.random() * 500) * seasonalMultiplier,
      },
    });
  }

  // Exp2: Consistent medium performer
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp2.id,
        date,
        spend: 600 + Math.random() * 100,
        impressions: Math.floor(100000 + Math.random() * 20000),
        clicks: Math.floor(1500 + Math.random() * 300),
        conversions: Math.floor(45 + Math.random() * 15),
        revenue: 1200 + Math.random() * 300,
      },
    });
  }

  // Exp3: Variable performer with improving trend
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const trendMultiplier = 0.7 + (i / 90) * 0.5; // Improving over time

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp3.id,
        date,
        spend: (500 + Math.random() * 100) * trendMultiplier,
        impressions: Math.floor((80000 + Math.random() * 15000) * trendMultiplier),
        clicks: Math.floor((800 + Math.random() * 200) * trendMultiplier),
        conversions: Math.floor((16 + Math.random() * 8) * trendMultiplier),
        revenue: (400 + Math.random() * 200) * trendMultiplier,
      },
    });
  }

  // Exp4: Best performer - email marketing excellence
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp4.id,
        date,
        spend: 300 + Math.random() * 100,
        impressions: Math.floor(15000 + Math.random() * 3000),
        clicks: Math.floor(900 + Math.random() * 150),
        conversions: Math.floor(90 + Math.random() * 20),
        revenue: 2000 + Math.random() * 400,
      },
    });
  }

  // Exp5: Paused - only first 30 days of data
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp5.id,
        date,
        spend: 400 + Math.random() * 100,
        impressions: Math.floor(20000 + Math.random() * 5000),
        clicks: Math.floor(400 + Math.random() * 100),
        conversions: Math.floor(20 + Math.random() * 10),
        revenue: 500 + Math.random() * 200,
      },
    });
  }

  // Exp6: New experiment - last 30 days only
  for (let i = 60; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp6.id,
        date,
        spend: 700 + Math.random() * 150,
        impressions: Math.floor(120000 + Math.random() * 30000),
        clicks: Math.floor(1800 + Math.random() * 400),
        conversions: Math.floor(50 + Math.random() * 15),
        revenue: 1500 + Math.random() * 350,
      },
    });
  }

  // Exp7: Steady brand defense
  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp7.id,
        date,
        spend: 200 + Math.random() * 50,
        impressions: Math.floor(30000 + Math.random() * 5000),
        clicks: Math.floor(2400 + Math.random() * 300),
        conversions: Math.floor(180 + Math.random() * 40),
        revenue: 900 + Math.random() * 200,
      },
    });
  }

  // Exp8: Seasonal with recent ramp-up
  for (let i = 45; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    await prisma.experimentMetricSnapshot.create({
      data: {
        experimentId: exp8.id,
        date,
        spend: 450 + Math.random() * 100,
        impressions: Math.floor(60000 + Math.random() * 12000),
        clicks: Math.floor(1200 + Math.random() * 250),
        conversions: Math.floor(36 + Math.random() * 12),
        revenue: 850 + Math.random() * 250,
      },
    });
  }

  logger.info('✅ Generated 90 days of metrics for all experiments');

  // Create performance alerts
  const alert1 = await prisma.performanceAlert.create({
    data: {
      experimentId: exp1.id,
      name: 'ROAS below 2x threshold',
      description: 'Alert when ROAS drops below 2.0',
      metricName: 'roas',
      operator: 'lt',
      threshold: 2.0,
    },
  });

  const alert2 = await prisma.performanceAlert.create({
    data: {
      experimentId: exp2.id,
      name: 'CAC exceeds $30',
      description: 'Alert when customer acquisition cost exceeds $30',
      metricName: 'cac',
      operator: 'gt',
      threshold: 30.0,
    },
  });

  const alert3 = await prisma.performanceAlert.create({
    data: {
      experimentId: exp4.id,
      name: 'Conversion rate below 8%',
      description: 'Alert when email conversion rate drops below 8%',
      metricName: 'conversionRate',
      operator: 'lt',
      threshold: 8.0,
    },
  });

  const alert4 = await prisma.performanceAlert.create({
    data: {
      name: 'Global CTR threshold',
      description: 'Alert for any experiment with CTR below 1%',
      metricName: 'ctr',
      operator: 'lt',
      threshold: 1.0,
    },
  });

  logger.info('✅ Created 4 performance alerts');

  // Create budget plans
  const q4Plan = await prisma.budgetPlan.create({
    data: {
      name: 'Q4 Holiday Budget Plan',
      description: 'Increased budget allocation for holiday shopping season',
      groupId: ecommerceGroup.id,
      totalBudget: 150000,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-12-31'),
      status: 'active',
      strategyId: compositeStrategy.id,
    },
  });

  const q1Plan = await prisma.budgetPlan.create({
    data: {
      name: 'Q1 2025 Growth Plan',
      description: 'Revenue-focused plan for new year growth',
      groupId: saasGroup.id,
      totalBudget: 80000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      status: 'draft',
      strategyId: revenueStrategy.id,
    },
  });

  const efficiencyPlan = await prisma.budgetPlan.create({
    data: {
      name: 'Efficiency Optimization Plan',
      description: 'Focus on reducing CAC while maintaining volume',
      groupId: paidSocialGroup.id,
      totalBudget: 60000,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-01-31'),
      status: 'active',
      strategyId: efficiencyStrategy.id,
    },
  });

  logger.info('✅ Created 3 budget plans');

  // Generate some allocation suggestions
  const allocation1 = await prisma.allocationSuggestion.create({
    data: {
      strategyId: compositeStrategy.id,
      budgetPlanId: q4Plan.id,
      inputJson: {
        config: { minAllocationPercent: 5, maxAllocationPercent: 40, totalBudget: 150000 },
        experimentCount: 6,
      },
      suggestionJson: [
        { experimentId: exp1.id, experimentName: exp1.name, suggestedPercentage: 35.5 },
        { experimentId: exp4.id, experimentName: exp4.name, suggestedPercentage: 28.2 },
        { experimentId: exp2.id, experimentName: exp2.name, suggestedPercentage: 18.7 },
        { experimentId: exp7.id, experimentName: exp7.name, suggestedPercentage: 10.3 },
        { experimentId: exp6.id, experimentName: exp6.name, suggestedPercentage: 7.3 },
      ],
    },
  });

  logger.info('✅ Generated allocation suggestions');

  // Create some audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        entityType: 'experiment',
        entityId: exp1.id,
        action: 'create',
        changes: { name: exp1.name, channel: exp1.channel },
        userId: 'system',
      },
      {
        entityType: 'budgetPlan',
        entityId: q4Plan.id,
        action: 'create',
        changes: { name: q4Plan.name, totalBudget: q4Plan.totalBudget },
        userId: 'admin',
      },
      {
        entityType: 'allocation',
        entityId: allocation1.id,
        action: 'create',
        changes: { strategyUsed: 'composite', experimentsIncluded: 6 },
        userId: 'system',
      },
    ],
  });

  logger.info('✅ Created audit log entries');

  logger.info('\n📊 Seed Summary:');
  logger.info('  - 3 Allocation Strategies (composite, revenue-focused, efficiency-focused)');
  logger.info('  - 4 Experiment Groups (hierarchical structure)');
  logger.info('  - 8 Experiments across 6 channels');
  logger.info('  - 4 Tags with varied color coding');
  logger.info('  - 90 days of performance metrics');
  logger.info('  - 4 Performance alerts (3 specific, 1 global)');
  logger.info('  - 3 Budget plans (1 active Q4, 1 draft Q1, 1 active efficiency)');
  logger.info('  - Sample allocation suggestions');
  logger.info('  - Audit trail of key actions\n');

  logger.info('✨ Enhanced seeding complete!\n');
  logger.info('Try these commands:');
  logger.info('  npm run cli experiment:list');
  logger.info('  npm run cli kpis');
  logger.info('  npm run cli allocate --strategy revenue-focused --budget 100000');
  logger.info('  npm run cli alerts:check');
  logger.info('  npm run cli db:stats\n');
}

main()
  .catch((e) => {
    logger.error(e, 'Error seeding database');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
