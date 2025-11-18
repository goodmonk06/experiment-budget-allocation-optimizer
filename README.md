# Budget Allocation Optimizer

A smart engine for optimizing marketing budget allocation across experiments and campaigns based on performance metrics.

## Overview

This system helps marketing teams make data-driven decisions about budget allocation by analyzing experiment performance and suggesting optimal budget distribution across different channels.

## Features

- **Experiment Management**: Track multiple experiments across different channels (Google Ads, Facebook, Email, etc.)
- **Performance Metrics**: Monitor key metrics including CTR, CAC, conversion rate, and ROAS
- **Smart Allocation**: AI-driven budget allocation recommendations based on performance
- **Interactive Dashboard**: Real-time visualization of experiment performance and budget suggestions
- **Historical Tracking**: Store and review past allocation suggestions

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd experiment-budget-allocation-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Seed the database**
   ```bash
   npm run db:seed
   ```
   This creates 5 sample experiments with 30 days of historical metrics.

6. **Start the development servers**
   ```bash
   cd ..
   npm run dev
   ```

   This starts:
   - Backend API: http://localhost:3001
   - Frontend Dashboard: http://localhost:3000

## Architecture

```
┌─────────────────┐
│   Next.js UI    │  (Port 3000)
│   Dashboard     │
└────────┬────────┘
         │ HTTP
         │
┌────────▼────────┐
│  Fastify API    │  (Port 3001)
│                 │
│  ┌───────────┐  │
│  │ KPI Calc  │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │Allocation │  │
│  │  Engine   │  │
│  └───────────┘  │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  (Port 5432)
│   + Prisma      │
└─────────────────┘
```

## Domain Model

### Experiment
Represents a marketing campaign or experiment.

| Field     | Type     | Description                           |
|-----------|----------|---------------------------------------|
| id        | UUID     | Unique identifier                     |
| name      | String   | Experiment name                       |
| channel   | String   | Marketing channel (e.g., "Google Ads")|
| status    | Enum     | active, paused, or completed          |
| createdAt | DateTime | Creation timestamp                    |

### ExperimentMetricSnapshot
Daily performance metrics for an experiment.

| Field       | Type     | Description                    |
|-------------|----------|--------------------------------|
| id          | UUID     | Unique identifier              |
| experimentId| UUID     | Foreign key to Experiment      |
| date        | Date     | Metric date                    |
| spend       | Float    | Total spend in dollars         |
| impressions | Int      | Number of impressions          |
| clicks      | Int      | Number of clicks               |
| conversions | Int      | Number of conversions          |
| revenue     | Float    | Total revenue in dollars       |

### AllocationSuggestion
Stored budget allocation recommendations.

| Field          | Type     | Description                        |
|----------------|----------|------------------------------------|
| id             | UUID     | Unique identifier                  |
| createdAt      | DateTime | When suggestion was generated      |
| inputJson      | JSON     | Input parameters used              |
| suggestionJson | JSON     | Allocation recommendations         |

## Key Performance Indicators (KPIs)

The system calculates the following KPIs for each experiment:

### 1. Click-Through Rate (CTR)
Measures ad engagement effectiveness.

```
CTR = (Clicks / Impressions) × 100
```

**Example**: 2,500 clicks ÷ 50,000 impressions = 5% CTR

### 2. Conversion Rate
Percentage of clicks that result in conversions.

```
Conversion Rate = (Conversions / Clicks) × 100
```

**Example**: 125 conversions ÷ 2,500 clicks = 5% conversion rate

### 3. Customer Acquisition Cost (CAC)
Average cost to acquire one customer.

```
CAC = Total Spend / Conversions
```

**Example**: $25,000 spend ÷ 125 conversions = $200 CAC

### 4. Return on Ad Spend (ROAS)
Revenue generated per dollar spent.

```
ROAS = Total Revenue / Total Spend
```

**Example**: $100,000 revenue ÷ $25,000 spend = 4.0x ROAS

## Budget Allocation Algorithm

### Overview

The allocation engine uses a composite scoring system to recommend budget distribution across experiments.

### Composite Score Calculation

Each experiment receives a score based on three weighted factors:

```
Score = (ROAS × 0.4) + (Conversion Rate × 0.3) + (Revenue per Spend × 0.3)
```

**Weight Distribution**:
- **40%** - ROAS (primary indicator of profitability)
- **30%** - Conversion Rate (efficiency of turning clicks into customers)
- **30%** - Revenue per Spend (same as ROAS, but emphasized for clarity)

### Allocation Steps

1. **Calculate Scores**: Compute composite score for each active experiment
2. **Normalize to Percentages**: Convert scores to percentage allocations
   ```
   Raw Percentage = (Experiment Score / Total Score) × 100
   ```
3. **Apply Constraints**:
   - Minimum allocation (default: 5%)
   - Maximum allocation (default: 50%)
4. **Normalize to 100%**: Adjust percentages proportionally to sum to exactly 100%
5. **Calculate Budget Amounts**: If total budget provided, multiply percentages

### Configuration Parameters

| Parameter              | Default | Description                          |
|------------------------|---------|--------------------------------------|
| minAllocationPercent   | 5%      | Minimum budget % per experiment      |
| maxAllocationPercent   | 50%     | Maximum budget % per experiment      |
| totalBudget           | null    | Optional total budget amount         |

### Example Calculation

**Scenario**: 3 active experiments with a $10,000 monthly budget

| Experiment | ROAS | Conv Rate | Score | Raw % | Constrained % | Budget   |
|------------|------|-----------|-------|-------|---------------|----------|
| Email      | 5.0  | 10%       | 2.33  | 55%   | 50% (capped)  | $5,000   |
| Google Ads | 3.5  | 5%        | 1.55  | 37%   | 37%           | $3,700   |
| Instagram  | 1.0  | 2%        | 0.46  | 8%    | 13%           | $1,300   |

*Note*: After capping Email at 50%, remaining percentages are redistributed to maintain 100% total.

## API Endpoints

### Experiments

- **POST** `/api/experiments` - Create a new experiment
- **GET** `/api/experiments` - List all experiments
- **GET** `/api/experiments/:id` - Get experiment details
- **GET** `/api/experiments/:id/kpis` - Get experiment KPIs
- **PATCH** `/api/experiments/:id` - Update experiment status
- **DELETE** `/api/experiments/:id` - Delete an experiment

### Metrics

- **POST** `/api/metrics` - Upsert daily metric snapshot
- **POST** `/api/metrics/bulk` - Bulk upsert metrics
- **GET** `/api/metrics/:experimentId` - Get metrics for an experiment

### Allocations

- **POST** `/api/allocations/suggest` - Generate allocation suggestion
- **GET** `/api/allocations` - List allocation history
- **GET** `/api/allocations/:id` - Get specific allocation
- **GET** `/api/allocations/kpis/current` - Get current KPIs for all experiments

### Example: Upsert Metrics

```bash
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "experimentId": "uuid-here",
    "date": "2024-01-15",
    "spend": 1000,
    "impressions": 50000,
    "clicks": 2500,
    "conversions": 125,
    "revenue": 3500
  }'
```

### Example: Generate Allocation

```bash
curl -X POST http://localhost:3001/api/allocations/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 50000,
    "minAllocationPercent": 5,
    "maxAllocationPercent": 50
  }'
```

## Limitations & Considerations

### Algorithm Limitations

1. **Historical Data Dependency**
   - Assumes past performance predicts future results
   - Doesn't account for market changes or seasonality
   - Recommendation: Review and adjust suggestions based on domain knowledge

2. **No Diminishing Returns**
   - Doesn't model diminishing returns at scale
   - High-performing experiments may have limited capacity
   - Recommendation: Monitor performance after scaling budget

3. **Lifecycle Stage Ignorance**
   - Treats all experiments equally regardless of maturity
   - New experiments need learning phase with stable budget
   - Recommendation: Manually adjust for experiment lifecycle

4. **Channel Saturation**
   - Doesn't consider channel-specific saturation points
   - Some channels have natural audience limits
   - Recommendation: Set realistic max allocations per channel

5. **Static Weighting**
   - Uses fixed weights (40% ROAS, 30% conversion, 30% revenue)
   - Optimal weights may vary by business model
   - Recommendation: Customize weights in `allocation-engine.ts`

### Data Quality Considerations

1. **Minimum Data Requirements**
   - Requires at least some spend and conversion data
   - Empty or zero-conversion experiments receive minimum allocation

2. **Metric Accuracy**
   - Results are only as good as input data
   - Ensure accurate tracking and attribution

3. **Time Range**
   - Algorithm uses all-time aggregated metrics
   - Consider implementing date range filters for recency bias

### Operational Considerations

1. **Budget Constraints**
   - Always validate total suggested budget matches available budget
   - Consider operational constraints (minimum campaign budgets)

2. **Change Management**
   - Avoid making dramatic budget shifts immediately
   - Implement gradual reallocation (e.g., 10-20% shifts per week)

3. **Monitoring**
   - Continuously monitor performance after reallocation
   - Be prepared to revert if performance degrades

4. **Business Rules**
   - Algorithm doesn't know strategic priorities
   - Override suggestions for strategic experiments

## Extending the System

### Custom Allocation Strategies

Edit `backend/src/services/allocation-engine.ts` to implement custom strategies:

```typescript
// Example: Add recency weighting
const recentMetrics = await getMetricsFromLast30Days();
const recentScore = calculateScoreFromRecent(recentMetrics);
const finalScore = (allTimeScore × 0.7) + (recentScore × 0.3);
```

### Additional KPIs

Add new KPIs in `backend/src/services/kpi-calculator.ts`:

```typescript
// Example: Calculate LTV (Lifetime Value)
const ltv = totalRevenue / totalConversions;
```

### Custom Weighting

Modify the scoring weights based on your business model:

```typescript
// Example: Prioritize conversion rate over ROAS
const score =
  (roas × 0.2) +
  (conversionRate × 0.5) +
  (revenuePerSpend × 0.3);
```

## Project Structure

```
experiment-budget-allocation-optimizer/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/
│   │   │   ├── experiments.ts     # Experiment endpoints
│   │   │   ├── metrics.ts         # Metric endpoints
│   │   │   └── allocations.ts     # Allocation endpoints
│   │   ├── services/
│   │   │   ├── kpi-calculator.ts  # KPI calculation logic
│   │   │   └── allocation-engine.ts # Budget allocation algorithm
│   │   ├── db.ts                  # Prisma client
│   │   ├── types.ts               # TypeScript types
│   │   ├── index.ts               # Server entry point
│   │   └── seed.ts                # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   └── globals.css        # Global styles
│   │   ├── components/
│   │   │   ├── ExperimentTable.tsx          # KPI table
│   │   │   └── AllocationSuggestions.tsx    # Suggestions display
│   │   ├── lib/
│   │   │   └── api.ts             # API client functions
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   └── package.json
├── docker-compose.yml             # PostgreSQL setup
├── package.json                   # Root workspace config
└── README.md                      # This file
```

## Testing the System

1. **Verify Database**
   ```bash
   cd backend
   npx prisma studio
   ```
   Opens Prisma Studio at http://localhost:5555

2. **Test API Endpoints**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/allocations/kpis/current
   ```

3. **Test UI**
   - Open http://localhost:3000
   - View experiment table with KPIs
   - Click "Generate Allocation Suggestion"
   - Review suggested budget allocations

## Troubleshooting

### Database Connection Issues
```bash
# Restart PostgreSQL
docker-compose down
docker-compose up -d

# Reset database
cd backend
npx prisma migrate reset
npm run db:seed
```

### Port Conflicts
If ports 3000, 3001, or 5432 are in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/package.json` dev script
- PostgreSQL: Change port in `docker-compose.yml`

### Type Errors
```bash
# Regenerate Prisma client
cd backend
npx prisma generate
```

## Future Enhancements

- [ ] Time-series forecasting for budget impact prediction
- [ ] A/B testing capabilities
- [ ] Multi-objective optimization (balance ROAS, CAC, volume)
- [ ] Seasonality adjustments
- [ ] Confidence intervals for suggestions
- [ ] Real-time metric streaming
- [ ] Budget pacing recommendations
- [ ] Automated reallocation based on triggers
- [ ] Export to CSV/PDF reports
- [ ] Integration with ad platforms (Google Ads, Facebook Ads)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Support

For issues or questions, please open a GitHub issue.
