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
|--------|---------|
| `APP_ENCRYPTION_KEY` | Criptografa/descriptografa segredos de identidade (32 bytes, base64) |
| `BETTER_AUTH_SECRET` | Assina tokens de sessão |

**Se `APP_ENCRYPTION_KEY` for perdido, credenciais SSH criptografadas não poderão ser recuperadas** — apenas reinseridas manualmente ou restauradas a partir do backup de exportação de configuração.

## Segurança SSH

- Validação de host bloqueia SSRF para endereços privados/de metadados
- `SSH_ALLOWED_CIDRS` opcional para redes internas
- Fixação de chave host na primeira conexão bem-sucedida
- Chaves importadas marcadas como não verificadas até Testar SSH ter sucesso
- Injeção de comando prevenida via enums em lista de permissão e construção sanitizada de comandos UFW

## Salvaguardas de aplicação e exportação

- Alterações UFW exigem **visualização + confirmação explícita**
- Exportação de configuração exige **reentrada de senha** e registra evento de auditoria `CONFIG_EXPORT`
- Arquivos de exportação contêm **segredos em texto plano** — responsabilidade do operador

## Cabeçalhos de segurança HTTP (produção)

Quando `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS termina no Nginx Proxy Manager; a aplicação recebe HTTP na rede Docker.

## Checklist de exposição de rede

- [ ] Interface de administração apenas via proxy reverso HTTPS
- [ ] Postgres não exposto ao host/internet em produção
- [ ] Restringir URL de administração (VPN, lista de permissão de IP no NPM)
- [ ] Segredos `.env` fortes e únicos
- [ ] Backups regulares do Postgres + `.env` fora do host
- [ ] Rotacionar segredos se exportação ou `.env` puderem ter vazado

## Sanitização de erros

Erros voltados ao cliente nos caminhos SSH/aplicação são sanitizados para evitar vazamento de stack traces ou caminhos internos.

## Documentação relacionada

- [Variáveis de ambiente](./environment-variables.md)
- [Log de auditoria e exportação](./audit-log-and-export.md)
- [Arquitetura](../architecture.md)
