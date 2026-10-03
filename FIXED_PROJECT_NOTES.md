# SigmaZero - Authentication Fix

## What was fixed
- JWT is attached to every protected Axios request.
- Invalid/expired JWTs now lead to HTTP 401 instead of an ambiguous 403.
- Spring Security explicitly distinguishes authentication (401) from authorization (403).
- CORS supports localhost and 127.0.0.1 Vite development origins.
- OPTIONS preflight requests are permitted.
- Tenant context synchronizes after login and logout.
- Old invalid local JWT/session data is automatically cleared after a protected 401/403 response.

## Run backend in Eclipse
1. Open `sigmazero-backend` as a Maven/Spring Boot project.
2. Ensure PostgreSQL is running and `sigmazero_db` exists.
3. Run `SigmaZeroApplication` as Spring Boot App.
4. The included development JWT fallback is intentionally local-development-only.

For a real deployment, set `SIGMAZERO_JWT_SECRET` to a random secret of at least 32 characters and remove/replace the development fallback.

## Run frontend
```text
cd sigmazero-frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Important after replacing the project
Clear any old browser session once:
```javascript
localStorage.removeItem('sigmazero_token');
localStorage.removeItem('sigmazero_session');
```
Then sign in again so a JWT generated with the current backend secret is stored.
