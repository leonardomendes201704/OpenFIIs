# OpenFIIs

Dashboard web para simulacao e acompanhamento de carteiras de FIIs.

## Stack

- Next.js + TypeScript
- Recharts para graficos
- Framer Motion para animacoes
- Lucide React para icones
- PostgreSQL local por sistema
- Prisma para migrations e acesso a dados
- Deploy pronto para Vercel
- Autenticacao corporativa via PortalAuth/OpenID Connect

## Desenvolvimento

```bash
npm install
npm run dev
```

Crie um `.env.local` baseado em `.env.example` e prepare o banco local:

```powershell
$env:OPENFIIS_POSTGRES_ADMIN_PASSWORD = "senha-do-postgres"
powershell.exe -ExecutionPolicy Bypass -File .\scripts\Setup-LocalPostgres.ps1
npm run db:migrate
npm run db:generate
```

## SSO PortalAuth

O OpenFIIs nao autentica usuarios localmente. O login e feito pelo PortalAuth via OpenID Connect. O banco oficial do OpenFIIs e um PostgreSQL local proprio, acessado apenas pelas APIs server-side do Next.js.

Variaveis principais:

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=defina-um-segredo-local
PORTALAUTH_OIDC_ISSUER=http://localhost:5112
PORTALAUTH_OIDC_CLIENT_ID=openfiis-local
PORTALAUTH_OIDC_CLIENT_SECRET=openfiis-local-dev-secret
DATABASE_URL=postgresql://openfiis_app:openfiis_dev_password@localhost:5432/openfiis
```
