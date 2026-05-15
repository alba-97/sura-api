# SuraBank API

REST API para la aplicación bancaria SuraBank.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de datos**: PostgreSQL con Sequelize ORM
- **Cache**: Redis
- **Validación**: Zod
- **Testing**: Jest + Supertest

## Estructura

```
api/
├── src/
│   ├── config/          # Configuración (DB, Redis)
│   ├── controllers/     # Controladores (auth, cards, movements, notifications)
│   ├── middleware/     # Middleware (auth)
│   ├── models/         # Modelos Sequelize (User, Card, Transaction, Notification)
│   ├── repositories/   # Repositorios (lógica de acceso a datos)
│   ├── routes/         # Rutas de la API
│   ├── schemas/        # Schemas de validación Zod
│   ├── services/       # Servicios (lógica de negocio)
│   ├── seeders/        # Seeders de datos iniciales
│   ├── types/          # Tipos TypeScript
│   └── utils/          # Utilidades (errores)
├── app.ts              # Punto de entrada
├── docker-compose.yml  # Desarrollo local
└── Dockerfile          # Producción
```

## Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/surabank/login` | Iniciar sesión |
| GET | `/surabank/account` | Obtener datos de cuenta |
| GET | `/surabank/cards` | Listar tarjetas |
| POST | `/surabank/cards` | Crear nueva tarjeta |
| POST | `/surabank/cards/transfer` | Transferencia entre tarjetas |
| GET | `/surabank/movements` | Historial de movimientos |
| GET | `/surabank/contacts` | Lista de contactos |
| POST | `/surabank/transfer` | Transferencia a contacto |
| GET | `/surabank/notifications` | Lista de notificaciones |
| PATCH | `/surabank/notifications/read-all` | Marcar todas como leídas |

## Scripts

```bash
npm run dev        # Desarrollo con nodemon
npm run build      # Compilar TypeScript
npm run start      # Ejecutar producción
npm run seed       # Poblar base de datos
npm run test       # Ejecutar tests
npm run lint       # Linter
```

## Docker

```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

## Variables de entorno

Ver `.env.example` para las variables requeridas.