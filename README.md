# Help School — Sistema de Gestão

Sistema interno de gestão de aulas, turmas, professores e escalas da Help School.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| Autenticação | NextAuth.js v4 |
| Formulários | React Hook Form + Zod |
| Notificações | Sonner |
| Importação/Exportação | xlsx |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18 ou superior → https://nodejs.org
- **PostgreSQL** 14 ou superior → https://postgresql.org/download
- **npm** (incluso no Node.js)

### Verificar se está tudo instalado:
```bash
node --version    # deve exibir v18.x.x ou superior
npm --version     # deve exibir 9.x.x ou superior
psql --version    # deve exibir psql 14.x ou superior
```

---

## Instalação Passo a Passo

### 1. Entre na pasta do projeto

```bash
cd helpschool
```

### 2. Instale as dependências

```bash
npm install
```

> ⏳ Pode levar 1–2 minutos na primeira vez.

### 3. Configure o banco de dados

#### Crie o banco no PostgreSQL

Abra o terminal do PostgreSQL:

```bash
# No Linux/Mac:
psql -U postgres

# No Windows (Prompt de Comando como Admin):
psql -U postgres
```

Dentro do psql, execute:

```sql
CREATE DATABASE helpschool;
\q
```

#### Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Abra o arquivo `.env` e edite com suas credenciais:

```env
# Formato: postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/helpschool"

# Gere uma chave aleatória com: openssl rand -base64 32
# Ou acesse: https://generate-secret.now.sh/32
NEXTAUTH_SECRET="cole_aqui_sua_chave_aleatoria_longa"

NEXTAUTH_URL="http://localhost:3000"
```

> **Dica:** Se o seu PostgreSQL usa usuário e senha diferentes, ajuste o `DATABASE_URL` correspondentemente.

### 4. Execute as migrations do banco

```bash
npx prisma db push
```

Você verá algo como:

```
✔ Your database is now in sync with your schema.
```

### 5. Popule o banco com dados iniciais (seed)

```bash
npm run db:seed
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Funcionalidades

### Dashboard
- Visão geral: total de turmas, professores, aulas da semana
- Alertas automáticos: aulas pendentes, sem professor, flexíveis sem aula
- Tabela de aulas por dia da semana

### Turmas
- Listagem com filtros: nível, modalidade, status
- Cadastro completo com todos os campos das planilhas originais
- Edição e exclusão (admin)
- Exportação para Excel

### Professores
- Cards com disponibilidade por dia da semana
- Cadastro de horários de disponibilidade por dia
- Sugestão inteligente de professores ao criar aulas

### Alunos Flexíveis
- Lista com alerta de alunos sem próxima aula
- Controle de frequência semanal
- Status: ativo, aguardando, pausado, cancelado

### Escala Semanal
- Grade visual hora × dia da semana
- Clicar em qualquer célula para adicionar aula
- Sugestões automáticas de professor disponível
- Validação de conflitos de horário em tempo real
- Confirmar / cancelar aulas diretamente na grade
- Copiar semana anterior (criar nova semana automaticamente)
- Filtros por dia, professor e modalidade

### Escala Diária
- Visão do dia selecionado com ações rápidas
- Confirmar ou cancelar aulas com um clique
- Geração automática de resumo para WhatsApp

### Impressão / WhatsApp
- Filtro por semana, dia e professor
- Formato WhatsApp com emoji e copiar com um clique
- Formato geral para impressão
- Exportação para Excel

### Importação de Planilhas
- Arraste e solte arquivos `.xlsx`
- **Pré-visualização** completa antes de confirmar importação
- Suporte a: `Help_Inglês.xlsx` e `Escala_semana.xlsx`
- Relatório de erros após importação

### Relatórios
- Turmas por nível, modalidade e status
- Carga de professores
- Exportação em Excel (turmas, professores, escala)

### Usuários
- Cadastro de usuários com perfis de acesso
- Perfis: Administrador, Coordenação, Secretaria, Professor

---

## Perfis de Acesso

| Perfil | Turmas | Professores | Escala | Relatórios | Usuários |
|--------|--------|------------|--------|-----------|---------|
| Administrador | CRUD + excluir | CRUD + excluir | CRUD | ✅ | ✅ |
| Coordenação | CRUD | CRUD | CRUD | ✅ | ❌ |
| Secretaria | Ver + editar | Ver | Ver + editar | ❌ | ❌ |
| Professor | Ver suas | Ver | Ver suas | ❌ | ❌ |

---

## Comandos Úteis

```bash
# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção (após build)
npm start

# Abrir Prisma Studio (interface visual do banco)
npm run db:studio

# Resetar banco e re-popular
npm run db:reset

# Gerar cliente Prisma após alterar o schema
npx prisma generate

# Ver migrations pendentes
npx prisma migrate status
```

---

## Estrutura de Pastas

```
helpschool/
├── prisma/
│   ├── schema.prisma       # Modelos do banco de dados
│   └── seed.ts             # Dados iniciais
├── src/
│   ├── app/
│   │   ├── api/            # Rotas de API (REST)
│   │   │   ├── auth/       # NextAuth
│   │   │   ├── classes/    # CRUD turmas
│   │   │   ├── teachers/   # CRUD professores + sugestões
│   │   │   ├── lessons/    # CRUD aulas + validação de conflitos
│   │   │   ├── schedules/  # Semanas
│   │   │   ├── flexible-students/
│   │   │   ├── import/     # Importação de planilhas
│   │   │   ├── export/     # Exportação Excel
│   │   │   ├── dashboard/  # Stats do dashboard
│   │   │   └── users/      # Gestão de usuários
│   │   ├── (auth)/login/   # Tela de login
│   │   └── (dashboard)/    # Páginas do sistema
│   │       ├── dashboard/
│   │       ├── classes/
│   │       ├── teachers/
│   │       ├── flexible-students/
│   │       ├── schedule/
│   │       ├── daily/
│   │       ├── print/
│   │       ├── reports/
│   │       ├── import/
│   │       ├── users/
│   │       └── settings/
│   ├── components/
│   │   ├── ui/index.tsx    # Componentes compartilhados
│   │   └── layout/         # Sidebar, Topbar, Providers
│   ├── lib/
│   │   ├── prisma.ts       # Cliente Prisma singleton
│   │   ├── auth.ts         # Config NextAuth
│   │   ├── utils.ts        # Funções e constantes
│   │   └── conflict.ts     # Validação de conflitos de horário
│   ├── middleware.ts        # Proteção de rotas
│   └── types/              # Tipos TypeScript
├── .env                    # Variáveis de ambiente (não commitar)
├── .env.example            # Template de variáveis
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Publicar Online (Deploy)

### Opção 1: Vercel (recomendado para Next.js)

1. Crie uma conta em https://vercel.com
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente no painel da Vercel:
   - `DATABASE_URL` → use um banco PostgreSQL externo (Supabase, Neon, Railway)
   - `NEXTAUTH_SECRET` → gere uma chave aleatória forte
   - `NEXTAUTH_URL` → URL do seu site (ex: `https://helpschool.vercel.app`)
4. Clique em Deploy

### Opção 2: Railway (banco + app juntos)

1. Crie conta em https://railway.app
2. Crie um novo projeto com PostgreSQL
3. Adicione um serviço Node.js apontando para este repositório
4. Configure as variáveis de ambiente
5. Railway faz o deploy automaticamente

### Opção 3: Supabase (banco) + Vercel (app)

1. Crie o banco no https://supabase.com (PostgreSQL gratuito)
2. Copie a connection string do Supabase para `DATABASE_URL`
3. Faça deploy do Next.js na Vercel

### Após o deploy:

```bash
# Execute no servidor / via CLI da plataforma:
npx prisma db push
npm run db:seed
```

---

## Banco de Dados

### Modelos principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema com roles |
| `classes` | Turmas (Class 1, Class 80, etc.) |
| `teachers` | Professores com tipo e disponibilidade |
| `teacher_availability` | Horários de disponibilidade por dia |
| `flexible_students` | Alunos com agendamento flexível |
| `schedules` | Semanas (ex: "Semana 19/05 - 24/05") |
| `lessons` | Aulas individuais com professor, horário e status |
| `audit_logs` | Histórico de alterações |

---

## Solução de Problemas

### Erro: "Cannot connect to database"
- Verifique se o PostgreSQL está rodando
- Confirme a senha e usuário no `DATABASE_URL`
- Certifique-se de que o banco `helpschool` foi criado

### Erro: "Module not found"
```bash
npm install
npx prisma generate
```

### Página em branco / erro 500
```bash
# Verifique os logs do servidor
npm run dev
# Leia o erro no terminal
```

### Resetar tudo do zero
```bash
npm run db:reset
```

### Porta 3000 em uso
```bash
# Use outra porta:
npm run dev -- -p 3001
# Acesse: http://localhost:3001
# Atualize NEXTAUTH_URL no .env para http://localhost:3001
```

---

## Suporte

Este sistema foi desenvolvido especificamente para a Help School.
Para dúvidas técnicas ou novas funcionalidades, entre em contato com o desenvolvedor.
