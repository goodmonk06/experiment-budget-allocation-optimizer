# Changelog

All notable changes to the Budget Allocation Optimizer will be documented in this file.

## [2.0.0] - Phase 2 & 3 Enhancements

### Added

#### Phase 2: Foundation & Consistency

**Testing Infrastructure**
- Vitest test framework with coverage support
- Unit tests for allocation engine (10+ test cases)
- Unit tests for KPI calculator with database integration
- Test configuration with proper TypeScript support
- `npm test`, `npm run test:watch`, `npm run test:coverage` commands

**Code Quality**
- ESLint configuration with TypeScript support
- Prettier formatting with consistent rules
- `npm run lint`, `npm run format` commands
- Pre-configured rules for code consistency

**Error Handling & Logging**
- Centralized error handler with custom error classes (AppError, NotFoundError, ValidationError, ConflictError)
- Structured logging with Pino
- Context-aware logging with correlation
- Error response standardization

**Docker & DevOps**
- Dockerfiles for backend and frontend with multi-stage builds
- Enhanced docker-compose.yml with all services
- Health checks for all containers
- Network isolation and proper service dependencies
- `.env.example` files for configuration

**Developer Experience**
- Standardized npm scripts across backend and root
- `npm run typecheck` for type checking
- `npm run db:push`, `npm run db:reset` for database operations
- Graceful shutdown handling for server

#### Phase 3: Deep Expansion & Utility Maximization

**Domain Expansion (7 New Entities)**
1. **ExperimentGroup**: Hierarchical organization with parent-child relationships
2. **BudgetPlan**: Template-based planning with date ranges and strategies
3. **AllocationStrategy**: Pluggable algorithm system (composite, revenue-focused, efficiency-focused)
4. **PerformanceAlert**: Threshold-based monitoring with operators (gt, lt, gte, lte, eq)
5. **ExperimentTag**: Flexible categorization with colors
6. **ExperimentTagAssignment**: Many-to-many tagging relationships
7. **AuditLog**: Comprehensive change tracking across all entities

**Additional Vertical Slices**
- Budget plan management (CRUD + association with strategies)
- Alert configuration and monitoring with check endpoint
- Tag management with experiment assignments
- Group hierarchy management with tree views
- Full API coverage for all new entities

**Extension Points & Adapters**
- **Notification System**: Console, Webhook, Email adapters
- **Metrics Export**: In-memory, Datadog, Prometheus adapters
- **Allocation Strategies**: 3 built-in strategies with registry pattern
- **Event System**: Domain events with pub/sub pattern
- Adapter interfaces for easy extension

**CLI Tools**
- `experiment:create` - Interactive experiment creation
- `experiment:list` - List with filtering and formatting
- `allocate` - Generate allocations with strategy selection
- `kpis` - Display KPIs for all or specific experiments
- `alerts:check` - Check and trigger alerts
- `db:stats` - Database statistics

**Enhanced Seed Data**
- Multiple scenarios (e-commerce, SaaS)
- 8 experiments across 6 channels
- 90 days of varied performance metrics
- 4 experiment groups with hierarchy
- 4 color-coded tags with assignments
- 4 performance alerts
- 3 budget plans (active and draft)
- Sample allocation suggestions
- Audit trail data
- Command: `npm run db:seed:enhanced`

**Comprehensive Testing**
- Event system tests (subscribe, emit, error handling)
- Allocation strategy tests for all 3 strategies
- Strategy registry tests
- Test coverage for extension points
- Integration tests with database

**Documentation**
- PHASE3_OVERVIEW.md - Detailed expansion plan and roadmap
- ARCHITECTURE.md - Complete technical documentation
- Code examples for all extension points
- API documentation
- Deployment guides

### Changed

**Prisma Schema**
- Added `updatedAt` field to Experiment
- Added `description`, `groupId`, `metadata` fields to Experiment
- Added optional relationships for all new entities
- Added comprehensive indexes for performance
- Added audit log relationships with explicit foreign key names

**API Server**
- Integrated centralized error handler
- Added structured logging throughout
- Registered 4 new route modules
- Added graceful shutdown handlers
- Enhanced CORS configuration

**Allocation System**
- Extended AllocationSuggestion with strategy and budget plan links
- Added `appliedAt` and `appliedBy` tracking
- Support for strategy-based allocation

### Technical Improvements

**Type Safety**
- End-to-end type safety from API to database
- Zod validation schemas for all inputs
- Strongly typed event payloads
- Adapter interface contracts

**Performance**
- Database indexes on all foreign keys and query patterns
- Efficient query patterns with selective includes
- Pagination support for large datasets
- Metric aggregation at database level

**Observability**
- Structured JSON logging
- Metrics collection framework
- Request correlation IDs
- Health check endpoints
- Alert monitoring system

**Code Organization**
- Clear separation: routes, services, lib, adapters
- Consistent file naming conventions
- Modular architecture for easy testing
- Extension point documentation

## [1.0.0] - Initial Release

### Added
- Core experiment management
- Metric ingestion API
- Basic KPI calculations (CTR, CAC, conversion rate, ROAS)
- Composite allocation algorithm
- Next.js dashboard
- PostgreSQL database with Prisma
- Docker Compose setup
- Basic seed data
- README documentation

---

## Migration Guide

### From 1.0.0 to 2.0.0

**Database Migration Required**
```bash
npm run db:migrate
# or for development
npm run db:push
```

**Environment Variables**
Add to `.env`:
```
LOG_LEVEL=info
NODE_ENV=development
```

**New Dependencies**
```bash
npm install  # Installs new dependencies including pino, commander, etc.
```

**Optional: Use Enhanced Seed Data**
```bash
npm run db:reset  # Clears existing data
npm run db:seed:enhanced  # Loads rich multi-scenario data
```

**Breaking Changes**
- None - all changes are additive and backward compatible
- Existing experiments and metrics are preserved
- New fields are optional or have defaults

**New Features Available**
- Organize experiments into groups
- Create budget plans with strategies
- Configure performance alerts
- Tag experiments for organization
- Use CLI tools for management
- Choose from 3 allocation strategies
- Complete audit trail of changes

**Recommended Next Steps**
1. Run enhanced seed data to explore new features
2. Try CLI tools: `npm run cli experiment:list`
3. Review ARCHITECTURE.md for technical details
4. Experiment with different allocation strategies
5. Set up performance alerts for your experiments
