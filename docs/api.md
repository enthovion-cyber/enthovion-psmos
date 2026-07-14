# API

Base path: `/api/v1`

## Foundation Endpoints

- `POST /auth/login`
- `GET /users/me`
- `GET /actions`
- `GET /search?q=term`

All protected endpoints use Bearer JWT authentication and tenant context from the token. `x-tenant-id` is also accepted for explicit tenant routing in multi-site tools.
