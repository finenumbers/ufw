# Solução de problemas

Sintoma → causa provável → o que fazer.

## Autenticação

| Sintoma | Causa | Correção |
|---------|-------|-----|
| Loop de redirecionamento no login | `APP_URL` não corresponde à URL do navegador | Defina `APP_URL` com a URL HTTPS pública exata; reinicie a aplicação |
| Login funciona localmente, mas não via domínio | NPM ou flag de cookie seguro | Force SSL no NPM; verifique se o esquema de `APP_URL` é `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` não carregado | Use `--env-file .env` no compose |

## Docker / NPM

| Sintoma | Causa | Correção |
|---------|-------|-----|
| NPM 502 Bad Gateway | App fora da rede do NPM | Defina `NPM_NETWORK`; verifique se `ufw-app` entra na rede externa |
| `ufw-app` unhealthy | Banco indisponível ou segredos ausentes | Verifique `docker logs ufw-app`, saúde do postgres |
| `ufw-migrate` failed | Erro de migração | Leia `docker logs ufw-migrate`; restaure backup se necessário |
| `pull access denied` | Pacote GHCR privado | Defina visibilidade do pacote como Public ou `docker login ghcr.io` |

## SSH

| Sintoma | Causa | Correção |
|---------|-------|-----|
| Teste SSH falha | Credenciais incorretas, firewall, host indisponível | Verifique identidade, porta, se o servidor permite o IP do host Docker |
| Erro de validação de host | IP privado bloqueado | Defina `SSH_ALLOWED_CIDRS` para redes internas |
| Chave host alterada | Reinstalação do servidor ou MITM | Verifique a impressão digital no servidor; atualize após confirmação |
| Chave host não verificada | Importada da configuração | Execute Testar SSH na página de edição do servidor |

## Regras / aplicação

| Sintoma | Causa | Correção |
|---------|-------|-----|
| Página de regras vazia / desabilitada | UFW inativo | Instale e ative o UFW no painel |
| Visualização mostra exclusões inesperadas | Deriva do rascunho | Ressincronização forçada do servidor |
| Aviso de aplicação parcial | Aplicação anterior interrompida | Ressincronize; revise `ufw status` remotamente |
| Bloqueado fora do SSH | Regra deny aplicada | Acesso via console/fora de banda; corrija o UFW no servidor diretamente |

## Dados

| Sintoma | Causa | Correção |
|---------|-------|-----|
| Credenciais inválidas após restauração | `APP_ENCRYPTION_KEY` incorreto | Restaure o `.env` correspondente do backup |
| Não é possível descriptografar identidades | Rotação de chave sem reentrada | Reinsira os segredos ou restaure o JSON de exportação |

## API de saúde

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(console.log)"
```

Esperado: `{"status":"ok","db":"ok"}`

## Ainda com problemas?

Envie e-mail para **[apps@finenumbers.com](mailto:apps@finenumbers.com)** com a tag de versão, logs sanitizados (sem segredos) e passos para reproduzir.
