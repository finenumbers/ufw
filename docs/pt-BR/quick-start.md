# Início rápido (local)

Execute o UFW Remote Manager na sua máquina com Docker. Este caminho é para **avaliação e desenvolvimento**, não para produção.

## 1. Clonar e configurar

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

O `.env` padrão usa valores adequados para desenvolvimento. **Não** use esses padrões em produção.

## 2. Iniciar a stack

```bash
docker compose up -d --build
```

Aguarde até que todos os containers estejam saudáveis:

```bash
docker compose ps
```

Você deve ver `ufw-postgres` (healthy), `ufw-migrate` (exited 0) e `ufw-app` (healthy).

## 3. Abrir a interface

Abra **http://localhost:8088** no navegador.

- **Primeira visita:** `/setup` — crie a única conta de administrador
- **Visitas posteriores:** `/login`

## 4. Primeiro fluxo na interface

1. **Identidades SSH** (`/identities`) — crie credenciais (senha ou chave privada)
2. **Adicionar servidor** — escolha a identidade, informe host/porta; o teste SSH roda antes de salvar
3. Na página do servidor — instale/ative o UFW se necessário, depois abra **Regras**
4. Edite regras, execute **Salvar regras**, confirme para enviar alterações via SSH

## Comandos úteis

```bash
docker compose logs -f app          # logs da aplicação
docker compose down                 # parar a stack
docker compose down -v              # parar e excluir o volume do banco de dados
```

## Desenvolvimento no host (opcional)

Execute apenas o Postgres no Docker e a aplicação no host:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Use a porta **5434** em `DATABASE_URL` para acesso pelo host (veja `.env.example`).

## Produção

Para implantação HTTPS atrás do Nginx Proxy Manager, veja [Visão geral da implantação](./deployment/overview.md).
