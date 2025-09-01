# Data Snack v2: Master Documentation & Architecture Guide

## 🎯 Project Vision

**Data Snack** ist eine interaktive Plattform, die komplexe Datenanalyse in unterhaltsame "Snacks" verwandelt. Wir zeigen transparent, was Big Tech mit unseren Daten macht - und machen es selbst, aber ehrlich.

### Core Values
- **Radical Transparency**: Jeder Datenpunkt wird gezeigt
- **Scientific Rigor**: Basiert auf echter Forschung
- **Privacy Education**: Lernen durch Selbsterfahrung
- **Viral by Design**: Jeder Snack ist share-worthy

## 🏗️ System Architecture

### Technology Stack

```
Frontend:
├── Next.js 15.0.3      # React framework
├── TypeScript 5.3      # Type safety
├── Tailwind CSS 3.4    # Styling
├── Framer Motion 11    # Animations
├── Three.js           # 3D graphics
└── D3.js              # Data visualization

Backend:
├── Node.js 20         # Runtime
├── Fastify            # API server
├── PostgreSQL 15      # Primary database
├── TimescaleDB        # Time-series data
├── Redis              # Caching & sessions
└── Apache Kafka       # Event streaming

Infrastructure:
├── Docker             # Containerization
├── Kubernetes         # Orchestration
├── Terraform          # Infrastructure as Code
├── GitHub Actions     # CI/CD
├── Vercel             # Frontend hosting
└── Google Cloud Run   # Backend services

Analytics & Tracking:
├── GTM Server-side    # Google Tag Manager
├── Consent Mode v2    # Privacy compliance
├── Segment CDP        # Customer data platform
├── Apache Flink       # Stream processing
└── Custom SDK         # First-party tracking
```

### Architecture Patterns

1. **Domain-Driven Design (DDD)**
   - Clear bounded contexts
   - Rich domain models
   - Ubiquitous language

2. **Event-Driven Architecture**
   - Event sourcing for audit trail
   - CQRS for read/write separation
   - Eventual consistency

3. **Microservices**
   - Service per domain
   - API Gateway pattern
   - Service mesh for communication

4. **Privacy by Design**
   - GDPR compliance built-in
   - Consent management first
   - Data minimization

## 📦 Monorepo Structure

### Directory Layout

```
data-snack-v2/
├── apps/                      # Applications
│   ├── web/                   # Main website (Next.js)
│   ├── admin/                 # Admin dashboard
│   ├── docs/                  # Documentation site
│   └── mobile/                # React Native app
│
├── packages/                  # Shared packages
│   ├── @data-snack/core/     # Business logic
│   ├── @data-snack/ui/       # Design system
│   ├── @data-snack/tracking/ # Tracking SDK
│   ├── @data-snack/snacks/   # Snack library
│   ├── @data-snack/database/ # DB schemas
│   ├── @data-snack/auth/     # Authentication
│   ├── @data-snack/i18n/     # Translations
│   └── @data-snack/testing/  # Test utilities
│
├── services/                  # Microservices
│   ├── gateway/              # API Gateway
│   ├── tracking/             # Tracking service
│   ├── analytics/            # Analytics engine
│   ├── ml-engine/            # Machine learning
│   ├── personalization/      # User profiles
│   └── stream-processor/     # Event processing
│
├── infrastructure/           # Infrastructure
│   ├── terraform/           # IaC definitions
│   ├── kubernetes/          # K8s manifests
│   ├── docker/              # Dockerfiles
│   └── scripts/             # Automation
│
└── tools/                    # Development tools
    ├── cli/                  # CLI tools
    ├── generators/           # Code generators
    └── migrations/           # DB migrations
```

### Package Dependencies

```mermaid
graph TD
    A[apps/web] --> B[@data-snack/ui]
    A --> C[@data-snack/tracking]
    A --> D[@data-snack/snacks]
    D --> E[@data-snack/core]
    B --> E
    C --> E
    F[services/tracking] --> E
    F --> G[@data-snack/database]
    H[services/analytics] --> E
    H --> G
```

## 🍔 Snack Categories & Series

### 1. Tracking Exposed Series 🔍
*"Was Big Tech über dich weiß"*

| Snack | Description | Data Points | Duration |
|-------|-------------|-------------|----------|
| Click DNA Analyzer | Personality aus Click-Patterns | 500+ | 30 sec |
| Privacy Leak Detector | Browser Fingerprinting | 50+ | 2-3 min |
| Scroll Behavior Decoder | Reading Pattern Analysis | 100+ | 5 min |
| Keyboard DNA Sequencer | Typing Rhythm Analysis | 200+ | 3 min |
| Social Media Addiction Radar | Infinite Scroll Analysis | 150+ | 5 min |

### 2. Psychological Profiling Series 🧠
*"Die Wissenschaft der Manipulation"*

| Snack | Description | Research Base | Impact |
|-------|-------------|---------------|--------|
| Dark Pattern Detector | UX Manipulation Test | Stanford HCI | High |
| Cognitive Bias Explorer | 20+ Bias Tests | Kahneman/Tversky | High |
| Attention Economy Calculator | Value of Attention | Time Well Spent | Medium |
| Emotion Manipulation Engine | Trigger Detection | MIT Media Lab | High |

### 3. Data Stories Series 📊
*"Geschichten aus Daten"*

| Snack | Data Source | Update Freq | Viral Score |
|-------|-------------|-------------|-------------|
| Climate Twin Cities | NOAA/NASA | Monthly | 8/10 |
| Inequality Visualizer | World Bank | Quarterly | 9/10 |
| Information Bubble Mapper | Twitter/Reddit | Real-time | 10/10 |

## 🔐 Data Model

### Core Entities

```typescript
// User Entity
interface User {
  id: UUID
  fingerprint: string        // Browser fingerprint
  consentState: ConsentState
  profile: UserProfile
  createdAt: Date
  lastSeenAt: Date
  deletionRequestedAt?: Date
}

// Snack Session
interface SnackSession {
  id: UUID
  userId: UUID
  snackId: string
  startedAt: Date
  completedAt?: Date
  dataCollected: DataPoint[]
  analysis: Analysis
  result: PersonalityResult
  shareToken?: string
}

// Tracking Event
interface TrackingEvent {
  id: UUID
  sessionId: UUID
  type: EventType
  name: string
  properties: Record<string, any>
  context: EventContext
  timestamp: Date
}

// Personality Profile
interface PersonalityProfile {
  type: PersonalityType
  traits: PersonalityTraits
  marketValue: number
  confidence: number
  comparison: string
}
```

### Event Flow

```
User Action → Client SDK → GTM Server → Kafka → Flink → PostgreSQL
                ↓                         ↓        ↓
           Consent Check            Analytics   Real-time
                ↓                      API      Dashboard
            Local Storage
```

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Monorepo setup with Turborepo
- [ ] Core packages structure
- [ ] Database schema with Supabase
- [ ] Basic Next.js app
- [ ] Design system components
- [ ] Testing infrastructure

### Phase 2: Core Features (Weeks 3-4)
- [ ] Tracking SDK implementation
- [ ] GTM Server setup
- [ ] Consent Management
- [ ] First 3 Snacks
- [ ] Analytics dashboard
- [ ] User profiles

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Apache Kafka integration
- [ ] Stream processing with Flink
- [ ] Machine learning models
- [ ] Personalization engine
- [ ] A/B testing framework
- [ ] Social sharing

### Phase 4: Scale & Polish (Weeks 7-8)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation
- [ ] Marketing site
- [ ] Launch preparation

## 📊 Success Metrics

### Technical KPIs
- Page Load Time: <2s
- Time to Interactive: <3s
- Lighthouse Score: >95
- Test Coverage: >80%
- API Response: <200ms (p95)
- Error Rate: <0.1%

### Business KPIs
- User Acquisition: 1000 users/week
- Retention: >25% DAU/MAU
- Viral Coefficient: >1.2
- Snack Completion: >60%
- Share Rate: >15%
- Consent Rate: >70%

### Data Quality
- Tracking Accuracy: >95%
- Data Points/Session: >100
- Event Loss: <5%
- Privacy Compliance: 100%

## 🛠️ Development Workflow

### Git Strategy
```bash
main
├── develop
│   ├── feature/snack-privacy-leak
│   ├── feature/tracking-sdk
│   └── feature/consent-manager
├── release/v1.0
└── hotfix/critical-bug
```

### Commit Convention
```
feat: Add privacy leak detector
fix: Resolve tracking event loss
docs: Update API documentation
test: Add unit tests for SDK
refactor: Simplify consent logic
perf: Optimize bundle size
style: Format code with prettier
chore: Update dependencies
```

### Testing Strategy

1. **Unit Tests** (Jest)
   - Domain logic
   - Utilities
   - Components

2. **Integration Tests** (Testing Library)
   - API endpoints
   - Database operations
   - Service communication

3. **E2E Tests** (Playwright)
   - User flows
   - Snack completion
   - Sharing features

4. **Performance Tests** (Lighthouse CI)
   - Bundle size
   - Load time
   - Runtime performance

## 🔒 Security & Privacy

### Security Measures
- HTTPS everywhere
- CSP headers
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens
- Secure cookies

### Privacy Implementation
- GDPR compliance
- CCPA compliance
- Consent Mode v2
- Data minimization
- Purpose limitation
- Storage limitation
- Right to deletion
- Data portability

### Data Retention
- Anonymous data: Indefinite
- User data: 90 days
- Consent records: 3 years
- Deletion requests: 30 days

## 📈 Monitoring & Observability

### Logging
- Structured logging (JSON)
- Log levels (ERROR, WARN, INFO, DEBUG)
- Centralized log aggregation
- Real-time log streaming

### Metrics
- Application metrics (Prometheus)
- Business metrics (Custom)
- Infrastructure metrics (GCP)
- User metrics (Analytics)

### Tracing
- Distributed tracing (OpenTelemetry)
- Request correlation
- Performance profiling
- Error tracking (Sentry)

### Alerting
- Error rate thresholds
- Performance degradation
- Security incidents
- Business KPI alerts

## 🚢 Deployment

### Environments
1. **Development** - Local Docker
2. **Staging** - GCP staging cluster
3. **Production** - Multi-region GCP

### CI/CD Pipeline
```yaml
1. Code Push
2. Automated Tests
3. Build Docker Images
4. Security Scanning
5. Deploy to Staging
6. Integration Tests
7. Deploy to Production
8. Smoke Tests
9. Monitor & Rollback
```

### Infrastructure as Code
- Terraform for GCP resources
- Kubernetes manifests
- Helm charts for services
- GitOps with ArgoCD

## 📝 Documentation

### Types
1. **API Documentation** - OpenAPI/Swagger
2. **Code Documentation** - JSDoc/TSDoc
3. **Architecture Docs** - ADRs
4. **User Guides** - Docusaurus
5. **Developer Guides** - README files

### Documentation Structure
```
/docs
├── /architecture      # System design
├── /api              # API references
├── /guides           # How-to guides
├── /snacks           # Snack documentation
├── /deployment       # Deployment guides
└── /contributing     # Contribution guidelines
```

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Create monorepo structure
2. ✅ Setup core packages
3. ✅ Initialize databases
4. ✅ Configure build tools
5. ✅ Deploy first version

### This Week
1. Implement Privacy Leak Detector
2. Setup GTM Server
3. Create consent management
4. Build analytics dashboard
5. Write API documentation

### This Month
1. Launch 10 Snacks
2. Implement all tracking features
3. Setup ML pipeline
4. Beta user testing
5. Marketing campaign

## 📞 Contact & Support

- **Project Lead**: Frank Bueltge
- **Repository**: github.com/data-snack/v2
- **Documentation**: docs.data-snack.com
- **Support**: support@data-snack.com
- **Discord**: discord.gg/datasnack

---

*This document is the single source of truth for Data Snack v2 development.*

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Active Development