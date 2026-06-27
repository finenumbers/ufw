# Solução de problemas

Sintoma → causa provável → o que fazer.

## Autenticação

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Loop de redirecionamento no login | `APP_URL` não corresponde à URL do navegador | Definir `APP_URL` para a URL HTTPS pública exata; reiniciar o app |
| Login funciona localmente mas não via domínio | NPM ou flag cookie secure | Forçar SSL no NPM; verificar se o esquema `APP_URL` é `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` não carregado | Usar `--env-file .env` no compose |
| `APP_URL must use HTTPS in production` | `APP_URL` não HTTPS para um domínio real | Usar `https://your-domain`; `http://localhost` permitido apenas para smoke/CI |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Segredo muito curto | Regenerar com `openssl rand -base64 32` |

## Docker / NPM

| Sintoma | Causa | Correção |
|---------|-------|----------|
| NPM 502 Bad Gateway | App não na rede NPM | Definir `NPM_NETWORK`; verificar se `ufw-app` entra na rede externa |
| Página setup fácil de brute-force | `TRUST_PROXY` ausente | Definir `TRUST_PROXY=1` atrás do NPM |
| `ufw-app` unhealthy | BD down ou segredos ausentes | Verificar `docker logs ufw-app`, saúde do postgres |
| `ufw-migrate` falhou | Erro de migração | Ler `docker logs ufw-migrate`; restaurar backup se necessário |
| `pull access denied` | Pacote GHCR privado | Visibilidade Public ou `docker login ghcr.io` |

## SSH

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Teste SSH falha | Credenciais erradas, firewall, host down | Verificar identidade, porta; servidor permite IP do host Docker |
| Erro de validação de host | IP privado bloqueado | Definir `SSH_ALLOWED_CIDRS` para redes internas |
| Chave de host alterada | Reinstalação do servidor ou MITM | Verificar fingerprint no servidor; atualizar após confirmação |
| Chave de host não verificada | Importada da config | Executar teste SSH na página de edição do servidor |

## Regras / aplicação

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Página de regras vazia / desativada | UFW não ativo | Instalar e ativar UFW no painel |
| Pré-visualização mostra exclusões inesperadas | Drift do rascunho | Ressincronização forçada do servidor |
| Aplicação rejeitada — remoto alterado | UFW alterado entre pré-visualização e confirmação | Executar **Pré-visualização de aplicação** novamente (não resync) |
| Aviso de aplicação parcial | Aplicação anterior interrompida ou sync falhou | Ressincronizar; revisar `ufw status` remoto manualmente |
| Banner de operação preso | RUNNING/PENDING obsoleto após desconexão | Atualizar a página |
| Bloqueado fora do SSH | Regra deny aplicada | Acesso console/fora de banda; corrigir UFW diretamente no servidor |

## Dados

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Credenciais inválidas após restauração | `APP_ENCRYPTION_KEY` errado | Restaurar `.env` correspondente do backup |
| Não é possível descriptografar identidades | Rotação de chave sem reentrada | Reinserir segredos ou restaurar export JSON |

## API Health

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Esperado: `{"status":"ok","db":"ok","version":"…"}` (`revision` apenas fora de produção)

## Ainda preso?

Envie e-mail para **[apps@finenumbers.com](mailto:apps@finenumbers.com)** com tag de versão, logs sanitizados (sem segredos) e passos para reproduzir.
