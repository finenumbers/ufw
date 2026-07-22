# Modelo de segurança

O UFW Remote Manager é uma **ferramenta admin privilegiada**: armazena segredos SSH, executa comandos remotos de firewall e expõe uma UI web. Premissas de design e controles estão documentados aqui.

## Modelo de ameaça (resumo)

| Ativo | Risco | Mitigação |
|-------|-------|-----------|
| Credenciais SSH | Divulgação | AES-256-GCM em repouso; descriptografadas apenas para conexões |
| Cookie de sessão | Sequestro | HTTPS, cookies HTTP-only, `BETTER_AUTH_SECRET` |
| Impersonação de host | MITM no SSH | Impressão digital de chave host na primeira conexão; não verificada bloqueia apply |
| Admin não autorizado | Brute force | Usuário único; limite de taxa de setup; senhas fortes |
| CSRF / XSS | Abuso de conta | Defaults do framework, CSP em produção |
| Arquivo de exportação de config | Vazamento de segredo | Senha step-up; responsabilidade do operador |

O app **não** implementa ACLs por servidor — qualquer admin logado pode gerenciar todos os servidores.

## Autenticação

- Sessões e-mail/senha Better Auth
- Registro desabilitado após primeiro usuário (`/setup` uma vez)
- Logout limpa sessão; login/logout auditados

Execute apenas sobre **HTTPS** em produção (`APP_URL` deve usar https exceto localhost).

## Criptografia em repouso

| Segredo | Chave |
|---------|-------|
| Senhas e chaves de identidade | `APP_ENCRYPTION_KEY` (32 bytes) |
| Assinatura de sessão | `BETTER_AUTH_SECRET` (mín. 32 caracteres em prod) |

Rotacionar `APP_ENCRYPTION_KEY` sem reimportar identidades torna ciphertext armazenado inutilizável.

## Exposição de rede

Compose de produção (`docker-compose.prod.yml`):

- Postgres **não** publicado no host
- App escuta na rede Docker para NPM
- SSH de destino do container do app para servidores gerenciados

TLS termina no **Nginx Proxy Manager**. HTTP interno entre NPM e `ufw-app` é intencional — veja [Nginx Proxy Manager](../deployment/nginx-proxy-manager.md).

## Segurança SSH

- Bloqueio padrão em IPs privados/metadata de destino
- `SSH_ALLOWED_CIDRS` opcional para lab/VPN
- Host key TOFU — veja [Servidores e SSH](../concepts/servers-and-ssh.md)
- Apply bloqueado até chave host verificada

## Endurecimento da aplicação

Headers HTTP de produção (CSP, HSTS, etc.) via `next.config.ts`.

Endpoint de health `/api/health` expõe versão — sem segredos.

## Auditoria

Ações sensíveis gravam linhas `auditEvent`: login, logout, apply, snapshot, varredura de portas, exportação de configuração, alterações de servidor. Veja [Log de auditoria e exportação](./audit-log-and-export.md).

## Réplica única

Limites de taxa e filas são **em memória**. Várias réplicas do app sem estado compartilhado enfraquecem rate limiting e garantias de fila.

## Reportar vulnerabilidades

Veja [SECURITY.md](../../../SECURITY.md) na raiz do repositório (inglês).

## Documentos relacionados

- [Variáveis de ambiente](./environment-variables.md)
- [Arquitetura](../architecture.md)
