# SuraBank API

REST API for the SuraBank banking application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis
- **Validation**: Zod
- **Testing**: Jest + Supertest

## Structure

```
api/
├── src/
│   ├── config/          # Configuration (DB, Redis)
│   ├── controllers/     # Controllers (auth, cards, movements, notifications)
│   ├── middleware/     # Middleware (auth)
│   ├── models/         # Sequelize models (User, Card, Transaction, Notification)
│   ├── repositories/   # Repositories (data access layer)
│   ├── routes/         # API routes
│   ├── schemas/        # Zod validation schemas
│   ├── services/       # Services (business logic)
│   ├── seeders/        # Initial data seeders
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities (errors)
├── app.ts              # Entry point
├── docker-compose.yml  # Local development
└── Dockerfile          # Production
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/surabank/login` | Login |
| GET | `/surabank/account` | Get account data |
| GET | `/surabank/cards` | List cards |
| POST | `/surabank/cards` | Create new card |
| POST | `/surabank/cards/transfer` | Transfer between cards |
| GET | `/surabank/movements` | Movement history |
| GET | `/surabank/contacts` | List contacts |
| POST | `/surabank/transfer` | Transfer to contact |
| GET | `/surabank/notifications` | List notifications |
| PATCH | `/surabank/notifications/read-all` | Mark all as read |

## Scripts

```bash
npm run dev        # Development with nodemon
npm run build      # Compile TypeScript
npm run start      # Run production
npm run seed       # Seed database
npm run test       # Run tests
npm run lint       # Linter
```

## Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

See `.env.example` for required variables.