# HACCP Guard Dashboard (Node.js + Express + EJS)

Admin leve para visualizar sensores, alarmes e estado do sistema. Feito para consumir a tua API FastAPI.

## 🚀 Setup rápido
```bash
cp .env.example .env
npm install
npm start
# abre http://localhost:3000
```

Variáveis principais no `.env`:
- `DASHBOARD_API_BASE` → URL da tua API (ex.: `http://api:8000` em Docker)
- `MOCK=1` → usa dados de exemplo caso a API falhe (útil em dev)

## 🐳 Docker
```bash
docker build -t haccp-dashboard .
docker run --rm -p 3000:3000 --env-file .env haccp-dashboard
```
Ou usa o `docker-compose.example.yml` e adapta ao teu stack.

## 📁 Estrutura
- `server.js` → bootstrap do Express/EJS
- `routes/` → rotas (overview, sensores, alarmes)
- `lib/apiClient.js` → chamadas à API FastAPI (com fallback mock)
- `views/` → EJS templates (layout + páginas)
- `public/` → assets estáticos

## 🔒 Segurança (próximos passos)
- Ativar `helmet` com CSP adequada
- Rate limit e autenticação com roles (`admin`, `tech`, `viewer`)
- Tornar o dashboard acessível apenas via VPN/IP allowlist

## 📌 Páginas incluídas
- **Overview**: totais, online, alarmes abertos, última sync
- **Sensores**: tabela com temp, RSSI, bateria, last update
- **Alarmes**: tabela de alarmes abertos

## 🔗 Integração com a API
Ajusta `lib/apiClient.js` para corresponder aos teus endpoints reais:
- `GET /overview`
- `GET /sensors`
- `GET /alarms?status=open`
