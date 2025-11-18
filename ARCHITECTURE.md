# Architecture Documentation

## System Overview

The Budget Allocation Optimizer is a comprehensive marketing intelligence platform built to optimize budget distribution across experiments using data-driven strategies.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│                  Dashboard & Visualization                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                 API Layer (Fastify)                          │
│  ┌─────────────┬─────────────┬──────────────┬─────────────┐ │
│  │ Experiments │  Metrics    │ Allocations  │   Alerts    │ │
│  │   Routes    │   Routes    │   Routes     │   Routes    │ │
│  └─────────────┴─────────────┴──────────────┴─────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Service Layer                              │
│  ┌────────────────┬──────────────────┬───────────────────┐  │
│  │ KPI Calculator │ Allocation Engine│ Alert Monitoring  │  │
│  └────────────────┴──────────────────┴───────────────────┘  │
│  ┌────────────────┬──────────────────┬───────────────────┐  │
│  │  Event System  │ Strategy Registry│ Notification Svc  │  │
│  └────────────────┴──────────────────┴───────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Extension Points (Adapters)                     │
│  ┌────────────────┬──────────────────┬───────────────────┐  │
│  │  Notification  │  Metrics Export  │ Allocation        │  │
│  │   Adapters     │    Adapters      │ Strategies        │  │
│  └────────────────┴──────────────────┴───────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Data Layer (Prisma ORM)                         │
│                    PostgreSQL                                │
└──────────────────────────────────────────────────────────────┘
```

## Domain Model

### Core Entities

#### Experiment
Represents a marketing campaign or experiment.
- Belongs to an optional ExperimentGroup
- Has many MetricSnapshots
- Can have Tags assigned
- Can have Alerts configured
- All changes are logged in AuditLog

#### ExperimentMetricSnapshot
Daily performance metrics for an experiment.
- Unique constraint on (experimentId, date)
- Stores: spend, impressions, clicks, conversions, revenue

#### ExperimentGroup
Hierarchical organization of experiments.
- Self-referential (parentId)
- Can contain experiments and other groups
- Used for budget plan organization

#### BudgetPlan
Template-based budget planning.
- Associated with a Group or individual experiments
- Linked to an AllocationStrategy
- Tracks multiple AllocationSuggestions
- Lifecycle: draft → active → completed

#### AllocationStrategy
Pluggable allocation algorithms.
- Type: composite, ml, custom
- JSON configuration for strategy parameters
- Can be associated with multiple BudgetPlans

#### PerformanceAlert
Threshold-based monitoring system.
- Can be experiment-specific or global
- Supports operators: gt, lt, eq, gte, lte
- Tracks trigger history
- Integrates with notification system

#### ExperimentTag
Flexible categorization system.
- Many-to-many relationship with Experiments
- Color-coded for visual organization
- Examples: "High Priority", "Seasonal", "A/B Testing"

#### AllocationSuggestion
Stored budget allocation recommendations.
- Links to Strategy and BudgetPlan
- Stores input parameters and results as JSON
- Tracks if/when applied
- Complete audit trail

#### AuditLog
Complete change history.
- Polymorphic: tracks changes across all entities
- Stores full change diff in JSON
- User attribution
- Timestamp for historical analysis

## Data Flow

### 1. Metric Ingestion Flow
```
External Source → POST /api/metrics → Validation (Zod)
    → Upsert Metric Snapshot → Emit 'metrics.ingested' Event
    → Update Derived KPIs
```

### 2. Allocation Generation Flow
```
User Request → GET /api/allocations/kpis/current
    → Calculate KPIs for all experiments
    → POST /api/allocations/suggest
    → Load Strategy from Registry
    → Apply Strategy Algorithm
    → Normalize to 100%
    → Create AllocationSuggestion Record
    → Emit 'allocation.generated' Event
    → Return Suggestions to User
```

### 3. Alert Checking Flow
```
Scheduled Job / Manual Trigger → POST /api/alerts/check
    → Load Active Alerts
    → For each alert:
        → Fetch Experiment KPIs
        → Evaluate Condition
        → If Triggered:
            → Update Alert Status
            → Emit 'alert.triggered' Event
            → Send Notifications via Adapters
            → Log to AuditLog
```

## Extension Points

### Notification Adapters

**Interface**: `INotificationAdapter`

Implementations:
- **ConsoleNotificationAdapter**: Default, logs to console
- **WebhookNotificationAdapter**: HTTP POST to configured endpoint
- **EmailNotificationAdapter**: SMTP email sending (stub)

Adding custom adapter:
```typescript
class CustomNotificationAdapter implements INotificationAdapter {
  async send(payload: NotificationPayload): Promise<void> {
    // Your implementation
  }

  isConfigured(): boolean {
    return true;
  }
}

notificationService.addAdapter(new CustomNotificationAdapter());
```

### Metrics Adapters

**Interface**: `IMetricsAdapter`

Implementations:
- **InMemoryMetricsAdapter**: Default, stores in memory
- **DatadogMetricsAdapter**: Export to Datadog (stub)
- **PrometheusMetricsAdapter**: Prometheus format export (stub)

Adding custom adapter:
```typescript
class CustomMetricsAdapter implements IMetricsAdapter {
  async recordCounter(metric: MetricData): Promise<void> {
    // Your implementation
  }
  // ... other methods
}

metricsService.addAdapter(new CustomMetricsAdapter());
```

### Allocation Strategies

**Interface**: `IAllocationStrategy`

Implementations:
- **CompositeStrategy**: Balanced (40% ROAS, 30% conversion, 30% revenue)
- **RevenueFocusedStrategy**: Maximizes total revenue
- **EfficiencyFocusedStrategy**: Minimizes CAC, maximizes conversion

Adding custom strategy:
```typescript
class CustomStrategy implements IAllocationStrategy {
  name = 'custom-strategy';

  calculate(kpis: ExperimentKPIs[], config: AllocationConfig): AllocationSuggestionOutput[] {
    // Your custom algorithm
    return suggestions;
  }
}

strategyRegistry.register(new CustomStrategy());
```

## Event System

### Domain Events

All domain events follow this structure:
```typescript
interface DomainEvent<T> {
  type: DomainEventType;
  timestamp: Date;
  data: T;
  metadata?: Record<string, unknown>;
}
```

### Event Types
- `experiment.created`
- `experiment.updated`
- `experiment.deleted`
- `allocation.generated`
- `allocation.applied`
- `budget_plan.created`
- `budget_plan.updated`
- `alert.triggered`
- `metrics.ingested`

### Subscribing to Events
```typescript
eventBus.subscribe('alert.triggered', async (event) => {
  const { alert, experiment, metricValue } = event.data;
  // Handle alert
});
```

## Service Layer Architecture

### KPI Calculator
**Location**: `src/services/kpi-calculator.ts`

Responsibilities:
- Aggregate metrics across time periods
- Calculate derived KPIs (CTR, CAC, ROAS, etc.)
- Cache results for performance
- Support experiment-specific and global KPI views

### Allocation Engine
**Location**: `src/services/allocation-engine.ts`

Responsibilities:
- Implement default composite scoring algorithm
- Apply min/max constraints
- Normalize allocations to 100%
- Generate human-readable reasons

Algorithm (Composite):
```
Score = (ROAS × 0.4) + (ConversionRate × 0.3) + (RevenuePerSpend × 0.3)
RawPercentage = (Score / TotalScore) × 100
ConstrainedPercentage = clamp(RawPercentage, min, max)
FinalPercentage = normalize(ConstrainedPercentage) to 100%
```

## Testing Strategy

### Unit Tests
- Service layer logic (KPI calculator, allocation engine)
- Adapter implementations
- Event system
- Strategy algorithms

### Integration Tests
- API endpoint flows
- Database operations
- Multi-layer interactions

### Test Data Factories
**Location**: `src/services/__tests__/`

Reusable factories for creating test data:
```typescript
const mockKPIs = createMockKPIs({
  count: 3,
  pattern: 'varied-performance'
});
```

## Security Considerations

### Input Validation
- All API inputs validated with Zod schemas
- Type-safe throughout the stack
- SQL injection prevented by Prisma ORM

### Error Handling
- Centralized error handler
- Consistent error response format
- No sensitive data in error messages (production)
- Detailed errors in development

### Audit Trail
- All entity changes logged to AuditLog
- User attribution where applicable
- Immutable audit records

## Performance Optimization

### Database Indexing
Key indexes:
- `experiments(groupId, status)`
- `metrics(experimentId, date)`
- `alerts(experimentId, status)`
- `audit_logs(entityType, entityId, createdAt)`

### Query Optimization
- Include relations selectively
- Paginate large result sets
- Use aggregations at database level where possible

### Caching Strategy
- KPI calculations cached per request
- Metric snapshots indexed by date for fast range queries

## Deployment

### Docker Compose
```bash
docker-compose up -d  # Starts all services
```

Services:
- `postgres`: Database
- `backend`: API server
- `frontend`: Next.js app

### Environment Configuration
See `.env.example` files in `backend/` and `frontend/` directories.

### Database Migrations
```bash
npm run db:migrate     # Run pending migrations
npm run db:push        # Push schema changes (development)
npm run db:seed        # Basic seed data
npm run db:seed:enhanced  # Rich multi-scenario seed data
```

## Monitoring & Observability

### Logging
- Structured JSON logs via Pino
- Context-aware (request correlation)
- Log levels: debug, info, warn, error
- Configurable via LOG_LEVEL env var

### Metrics
- Request counts and latencies
- Allocation generation performance
- Database query metrics
- External adapter success rates

Access metrics:
```typescript
metricsService.recordCounter('allocations.generated', 1);
metricsService.recordGauge('experiments.active', activeCount);
```

### Health Checks
```bash
curl http://localhost:3001/health
```

## CLI Tools

The CLI provides powerful command-line access to core functionality:

```bash
npm run cli experiment:list              # List all experiments
npm run cli experiment:create [options]  # Create experiment
npm run cli kpis                        # Display KPIs
npm run cli allocate [options]          # Generate allocation
npm run cli alerts:check                # Check all alerts
npm run cli db:stats                    # Database statistics
```

## Future Enhancements

See `docs/PHASE3_OVERVIEW.md` for detailed roadmap, including:
- Machine learning-based allocation
- Real-time budget pacing
- Multi-objective optimization
- Advanced forecasting
- GraphQL API
- WebSocket real-time updates
