# Modelo de segurança

Esta página explica como o UFW Remote Manager protege credenciais, sessões e limites de rede.

Para reportar vulnerabilidades, veja [SECURITY.md](../../../SECURITY.md) (inglês, canônico).

## Autenticação

- **Better Auth** com e-mail/senha
- Conta de administrador única após a configuração inicial — sem cadastro público
- Cookies de sessão; `BETTER_AUTH_SECRET` obrigatório em produção
- Limitação de taxa nos endpoints de autenticação (em memória, réplica única)

## Criptografia de credenciais

Senhas SSH e chaves privadas são criptografadas com **AES-256-GCM** antes do armazenamento.

| Segredo | Finalidade |
|--------|------------|
| `APP_ENCRYPTION_KEY` | Criptografa/descriptografa segredos de identidade (32 bytes, base64) |
| `BETTER_AUTH_SECRET` | Assina tokens de sessão |

**Se `APP_ENCRYPTION_KEY` for perdido, credenciais SSH criptografadas não poderão ser recuperadas** — apenas reinseridas manualmente ou restauradas a partir do backup de exportação de configuração.

## Segurança SSH

- Validação de host bloqueia SSRF para endereços privados/de metadados no momento de salvar
- **Verificação de resolução DNS:** antes de cada conexão SSH e varredura de portas, o IP resolvido é validado novamente — bloqueia DNS rebinding para endereços privados/de metadados mesmo quando o hostname parecia seguro ao salvar
- `SSH_ALLOWED_CIDRS` opcional para redes internas
- Fixação de chave host na primeira **Atualizar status** bem-sucedida (conexão SSH), ou ao salvar com sucesso ao criar/atualizar um servidor
- A importação de configuração **não** fixa automaticamente as chaves host — servidores importados permanecem `sshHostKeyVerified: false` até que o operador execute Atualizar status
- Apply e instalação de UFW ficam bloqueados até que a chave host seja verificada
- **Risco residual TOFU:** a primeira Atualizar status confia na chave apresentada nesse momento (TOFU SSH padrão). Um atacante que controla o caminho de rede na primeira conexão poderia fixar uma chave maliciosa; para hosts de alto risco, verifique a impressão digital fora de banda
- Injeção de comando prevenida via enums em lista de permissão e construção sanitizada de comandos UFW

## Varredura de portas externa (opcional)

Quando `PORT_SCAN_ENABLED=true`:

- Varreduras rodam **somente** em direção a registros `Server.host` já presentes no banco de dados
- Hostnames são resolvidos para IPv4 e validados com as mesmas regras do SSH (**sem varredura sem IP resolvido validado**)
- Naabu + Nmap executam dentro de `ufw-app` (connect scans, sem alvos arbitrários)
- Limitação de taxa por servidor; eventos de auditoria registrados
- Exige **egress de rede** do container da aplicação para os hosts gerenciados nas portas varridas — veja [Varredura de portas](../deployment/port-scan.md)

## Monitoramento Docker (opcional)

Quando `DOCKER_MONITOR_ENABLED=true`:

- Inventário e controle rodam via **SSH** apenas em servidores registrados
- Referências de contêiner validadas; somente ações `START` / `STOP` / `RESTART`
- Limites de taxa e eventos de auditoria em atualização e controle
- O usuário SSH precisa de acesso à CLI Docker — veja [Monitoramento Docker](../deployment/docker-monitor.md)

## Salvaguardas de aplicação e exportação

- Alterações UFW exigem **visualização + confirmação explícita**
- Impressões digitais de regras são **recalculadas no servidor** na visualização de apply — impressões digitais de cliente alteradas não podem remapear itens do plano
- Exportação de configuração exige **reentrada de senha** e registra evento de auditoria `CONFIG_EXPORT`
- Importação de configuração exige **reentrada de senha** (mesmos limites de taxa da exportação)
- Arquivos de exportação contêm **segredos em texto plano** — responsabilidade do operador

## Cabeçalhos de segurança HTTP (produção)

Quando `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS termina no Nginx Proxy Manager; a aplicação recebe HTTP na rede Docker.

### Nota sobre Content-Security-Policy

A CSP atual inclui `'unsafe-inline'` e `'unsafe-eval'` para scripts do Next.js App Router e hydration. CSP baseada em nonce fica adiada até o Next.js suportá-la sem quebrar os bundles client. Não remova essas diretivas sem uma regressão completa.

## Endpoints públicos

| Caminho | Auth | Notas |
|------|------|-------|
| `/api/health` | Nenhuma | Retorna `status`, `db`, `version`; `revision` (git/build id) apenas fora de produção |
| `/setup` | Nenhuma (uma vez) | Limitado por taxa; use `TRUST_PROXY=1` atrás do NPM |

## Limitação de taxa do setup

O cadastro inicial de administrador (`/setup`) é limitado a **5 tentativas por minuto** por IP do cliente quando `TRUST_PROXY=1`, caso contrário por bucket de conexão direta.

## Checklist de exposição de rede

- [ ] Interface de administração apenas via proxy reverso HTTPS
- [ ] Postgres não exposto ao host/internet em produção
- [ ] Restringir URL de administração (VPN, lista de permissão de IP no NPM)
- [ ] Segredos `.env` fortes e únicos
- [ ] Backups regulares do Postgres + `.env` fora do host
- [ ] Rotacionar segredos se exportação ou `.env` puderem ter vazado

## Sanitização de erros

Erros voltados ao cliente nos caminhos SSH/aplicação são sanitizados para evitar vazamento de stack traces ou caminhos internos.

Sessões expiradas retornam uma mensagem consistente das server actions: `Session expired. Please sign in again.` (nenhum `Unauthorized` bruto propagado para a interface).

## Documentação relacionada

- [Variáveis de ambiente](./environment-variables.md)
- [Log de auditoria e exportação](./audit-log-and-export.md)
- [Arquitetura](../architecture.md)
