# Início rápido

Execute o UFW Remote Manager localmente com Docker. Este caminho é para **avaliação e desenvolvimento**, não para produção.

## Pré-requisitos

- Docker e Docker Compose
- Git
- Porta **8088** livre em localhost (configurável via `APP_PORT`)

## 1. Clonar e configurar

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Os valores padrão do `.env` funcionam para uso local. Segredos pré-preenchidos servem apenas para desenvolvimento — gere novos para qualquer implantação compartilhada ou de produção.

## 2. Iniciar a stack

```bash
docker compose up -d --build
```

Isso inicia:

| Serviço | Função |
|---------|--------|
| **postgres** | Banco de dados PostgreSQL |
| **migrate** | Executa `prisma migrate deploy` uma vez e encerra |
| **app** | UI Next.js na porta 8088 |

Verifique o status:

```bash
docker compose ps
docker compose logs -f app
```

## 3. Criar a conta de administrador

Abra **http://localhost:8088/setup**

- O registro está disponível **apenas uma vez** — enquanto não existir usuário
- Após a configuração, `/setup` redireciona para login
- Use uma senha forte; esta é a única conta de administrador

## 4. Criar uma identidade SSH

1. Barra lateral → **Identidades SSH** → **Adicionar identidade**
2. Escolha autenticação: senha, chave privada ou chave com passphrase
3. Salve — as credenciais são criptografadas com `APP_ENCRYPTION_KEY`

Veja [Identidades SSH](./concepts/ssh-identities.md).

## 5. Adicionar um servidor

1. Barra lateral → **Servidores** → **Adicionar servidor**
2. Informe nome, host, porta, selecione identidade
3. **Criar servidor** verifica SSH automaticamente

Em caso de sucesso, você acessa o painel do servidor. O badge UFW mostra estado em cache (vazio até a primeira atualização).

## 6. Atualizar e trabalhar com regras

1. Clique em **Atualizar status** — leitura SSH ao vivo; cria o primeiro snapshot UFW
2. Se UFW estiver ausente, use **Instalar UFW** (após a atualização confirmar que não está instalado)
3. Com UFW ativo, edite regras na tabela
4. Pré-visualização de apply → revisar → **Confirmar** para enviar alterações

Se ainda não existir snapshot, um **sync inicial** automático em segundo plano pode executar uma vez — veja [Gerenciar servidores](./user-guide/manage-servers.md).

## Opcional: habilitar varredura de portas localmente

Adicione ao `.env`:

```env
PORT_SCAN_ENABLED=true
```

Reconstrua/reinicie o container do app. A varredura exige Naabu e Nmap na imagem (incluídos no Dockerfile oficial).

## Desenvolvimento sem app Docker completo

Execute apenas Postgres no Docker, app no host:

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

O app escuta em **http://localhost:8088** (veja `package.json`).

## Parar e resetar

```bash
docker compose down          # parar containers
docker compose down -v       # parar e excluir volume do banco
```

## Próximos passos

- [Arquitetura](./architecture.md)
- [Implantação em produção](./deployment/overview.md)
- [Modelo de segurança](./administration/security-model.md)
