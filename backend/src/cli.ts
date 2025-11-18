#!/usr/bin/env node

import { Command } from 'commander';
import { prisma } from './db';
import { calculateAllExperimentKPIs } from './services/kpi-calculator';
import { strategyRegistry } from './lib/adapters/allocation-strategy';
import { logger } from './lib/logger';

const program = new Command();

program
  .name('budget-optimizer-cli')
  .description('CLI tools for Budget Allocation Optimizer')
  .version('1.0.0');

// Experiment commands
program
  .command('experiment:create')
  .description('Create a new experiment')
  .requiredOption('-n, --name <name>', 'Experiment name')
  .requiredOption('-c, --channel <channel>', 'Channel (e.g., Google Ads, Facebook)')
  .option('-d, --description <description>', 'Description')
  .option('-g, --group-id <groupId>', 'Group ID')
  .action(async (options) => {
    const experiment = await prisma.experiment.create({
      data: {
        name: options.name,
        channel: options.channel,
        description: options.description,
        groupId: options.groupId,
        status: 'active',
      },
    });

    console.log('✅ Experiment created:', experiment.id);
    console.log(JSON.stringify(experiment, null, 2));
    await prisma.$disconnect();
  });

program
  .command('experiment:list')
  .description('List all experiments')
  .option('-s, --status <status>', 'Filter by status')
  .action(async (options) => {
    const experiments = await prisma.experiment.findMany({
      where: options.status ? { status: options.status } : undefined,
      include: {
        group: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    console.log(`Found ${experiments.length} experiments:\n`);
    experiments.forEach((exp) => {
      console.log(`📊 ${exp.name} (${exp.id})`);
      console.log(`   Channel: ${exp.channel}`);
      console.log(`   Status: ${exp.status}`);
      if (exp.group) {
        console.log(`   Group: ${exp.group.name}`);
      }
      if (exp.tags.length > 0) {
        console.log(`   Tags: ${exp.tags.map((t) => t.tag.name).join(', ')}`);
      }
      console.log('');
    });

    await prisma.$disconnect();
  });

// Allocation commands
program
  .command('allocate')
  .description('Generate budget allocation')
  .option('-s, --strategy <strategy>', 'Strategy to use', 'composite')
  .option('-b, --budget <budget>', 'Total budget', parseFloat)
  .option('--min <min>', 'Minimum allocation %', parseFloat, 5)
  .option('--max <max>', 'Maximum allocation %', parseFloat, 50)
  .action(async (options) => {
    const kpis = await calculateAllExperimentKPIs();

    const strategy = strategyRegistry.get(options.strategy);
    if (!strategy) {
      console.error(`❌ Unknown strategy: ${options.strategy}`);
      console.log('Available strategies:', strategyRegistry.getAll().map((s) => s.name).join(', '));
      await prisma.$disconnect();
      return;
    }

    const config = {
      minAllocationPercent: options.min,
      maxAllocationPercent: options.max,
      totalBudget: options.budget,
    };

    const suggestions = strategy.calculate(kpis, config);

    console.log(`\n💡 Allocation Suggestion (${strategy.name} strategy):\n`);
    suggestions.forEach((sug, idx) => {
      console.log(`${idx + 1}. ${sug.experimentName}`);
      console.log(`   Suggested: ${sug.suggestedPercentage}%`);
      if (sug.suggestedBudget) {
        console.log(`   Budget: $${sug.suggestedBudget.toLocaleString()}`);
      }
      console.log(`   Current Spend: $${sug.currentSpend.toLocaleString()}`);
      console.log(`   Score: ${sug.score}`);
      console.log(`   Reason: ${sug.reason}`);
      console.log('');
    });

    await prisma.$disconnect();
  });

// KPI commands
program
  .command('kpis')
  .description('Display KPIs for all experiments')
  .option('-e, --experiment-id <id>', 'Show KPIs for specific experiment')
  .action(async (options) => {
    const kpis = await calculateAllExperimentKPIs();

    const filtered = options.experimentId
      ? kpis.filter((k) => k.experimentId === options.experimentId)
      : kpis;

    console.log('\n📈 Experiment KPIs:\n');
    filtered.forEach((kpi) => {
      console.log(`🎯 ${kpi.experimentName} (${kpi.channel})`);
      console.log(`   Status: ${kpi.status}`);
      console.log(`   Total Spend: $${kpi.totalSpend.toLocaleString()}`);
      console.log(`   Total Revenue: $${kpi.totalRevenue.toLocaleString()}`);
      console.log(`   Conversions: ${kpi.totalConversions}`);
      console.log(`   CTR: ${kpi.ctr}%`);
      console.log(`   Conversion Rate: ${kpi.conversionRate}%`);
      console.log(`   CAC: $${kpi.cac.toFixed(2)}`);
      console.log(`   ROAS: ${kpi.roas.toFixed(2)}x`);
      console.log('');
    });

    await prisma.$disconnect();
  });

// Alert commands
program
  .command('alerts:check')
  .description('Check all active alerts')
  .action(async () => {
    console.log('🔍 Checking all active alerts...\n');

    const alerts = await prisma.performanceAlert.findMany({
      where: { status: 'active' },
      include: {
        experiment: true,
      },
    });

    let triggeredCount = 0;

    for (const alert of alerts) {
      if (!alert.experimentId) continue;

      const kpis = await calculateAllExperimentKPIs();
      const experimentKPI = kpis.find((k) => k.experimentId === alert.experimentId);

      if (!experimentKPI) continue;

      const metricValue = experimentKPI[alert.metricName as keyof typeof experimentKPI] as number;
      const isTriggered = evaluateCondition(metricValue, alert.operator, alert.threshold);

      if (isTriggered) {
        console.log(`⚠️  ALERT TRIGGERED: ${alert.name}`);
        console.log(`   Experiment: ${alert.experiment?.name}`);
        console.log(`   Condition: ${alert.metricName} ${alert.operator} ${alert.threshold}`);
        console.log(`   Current Value: ${metricValue}`);
        console.log('');
        triggeredCount++;
      }
    }

    if (triggeredCount === 0) {
      console.log('✅ No alerts triggered');
    } else {
      console.log(`\n⚠️  ${triggeredCount} alert(s) triggered out of ${alerts.length} checked`);
    }

    await prisma.$disconnect();
  });

// Database commands
program
  .command('db:stats')
  .description('Display database statistics')
  .action(async () => {
    const experimentCount = await prisma.experiment.count();
    const metricCount = await prisma.experimentMetricSnapshot.count();
    const allocationCount = await prisma.allocationSuggestion.count();
    const groupCount = await prisma.experimentGroup.count();
    const tagCount = await prisma.experimentTag.count();
    const alertCount = await prisma.performanceAlert.count();
    const budgetPlanCount = await prisma.budgetPlan.count();

    console.log('\n📊 Database Statistics:\n');
    console.log(`   Experiments: ${experimentCount}`);
    console.log(`   Metric Snapshots: ${metricCount}`);
    console.log(`   Allocation Suggestions: ${allocationCount}`);
    console.log(`   Groups: ${groupCount}`);
    console.log(`   Tags: ${tagCount}`);
    console.log(`   Alerts: ${alertCount}`);
    console.log(`   Budget Plans: ${budgetPlanCount}`);
    console.log('');

    await prisma.$disconnect();
  });

function evaluateCondition(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'eq':
      return value === threshold;
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
    default:
      return false;
  }
}

program.parse();
