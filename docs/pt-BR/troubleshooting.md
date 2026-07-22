# Solução de problemas

Sintoma → causa provável → correção. Para conceitos, veja os documentos vinculados.

## Autenticação e configuração

| Sintoma | Causa | Correção |
|---------|-------|----------|
| `/setup` redireciona para login | Usuário já existe | Use `/login` |
| Falha no login após deploy | `APP_URL` incorreto ou HTTP em vez de HTTPS | Corresponda ao domínio NPM; defina `APP_URL=https://...` |
| Limite de taxa de setup agressivo | `TRUST_PROXY` ausente atrás do NPM | Defina `TRUST_PROXY=1` |

## SSH e criação de servidor

| Sintoma | Causa | Correção |
|---------|-------|----------|
| IP privado rejeitado | Validação de host | Use IP/hostname público ou `SSH_ALLOWED_CIDRS` |
| Conexão recusada | Firewall, porta errada, host inativo | Verifique do host Docker: `ssh -p PORT user@host` |
| Falha de auth | Credenciais de identidade incorretas | Edite identidade; reinsira segredo |
| Aviso de chave host | Primeira conexão ou servidor reconstruído | **Atualizar status** para capturar nova impressão digital |

## UFW e regras

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Apply desabilitado | Chave host não verificada | **Atualizar status** |
| Apply rejeitado após pré-visualização | UFW remoto alterado | **Apply preview** novamente |
| Apply parcial | Comandos ou sync interrompidos | **Ressincronização forçada do servidor**; verifique histórico de operações |
| Pré-visualização mostra exclusões inesperadas | Deriva do rascunho | **Ressincronização forçada do servidor** |
| Regras reaparecem após exclusão no servidor | Sync obsoleto (pré-v0.9.2) | Atualize para v0.9.2+; ressincronização forçada |
| Bloqueado fora do SSH | Regra deny aplicada | Acesso console; corrija UFW fora de banda |

## Banner de operações

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Banner EM EXECUÇÃO para sempre | Navegador desconectou no meio da op | Atualize página; aguarde sweeper |
| Tabela obsoleta após sync | Fim de operação não detectado (raro pós-v0.9.2) | Atualize navegador |
| Tráfego API ocioso | Versão antiga fazia poll eternamente | Atualize v0.9.2 — poll ocioso para |

## Varredura de portas

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Painel ausente | Recurso desabilitado | `PORT_SCAN_ENABLED=true` |
| Scan falhou por timeout | Faixa grande / rede lenta | Aumente `PORT_SCAN_*_TIMEOUT_MS`; verifique egress |
| Erro scan em andamento | Guarda de sobreposição | Aguarde scan atual |
| Sem findings | Todas portas filtradas/fechadas | Esperado; verifique status SUCCESS do scan |
| Progresso perdido ao atualizar (antigo) | SSR carregava apenas scans SUCCESS | Atualize v0.9.2 |

## Docker e migrate

| Sintoma | Causa | Correção |
|---------|-------|----------|
| `EACCES` prisma no app | Container errado | `docker compose run --rm migrate` |
| Migrate falha na atualização | Permissões DB ou versão antiga | Verifique `docker compose logs migrate` |
| App unhealthy | Segredos ruins ou DB inativo | Logs: `docker compose logs app` |

## Importação/exportação de configuração

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Importação bloqueada | Operações ativas no servidor | Aguarde fila ociosa |
| Exportação limitada | Muitas tentativas | Aguarde 60 segundos |
| Segredos descriptografados corrompidos após restore | `APP_ENCRYPTION_KEY` errado | Restaure `.env` correspondente |

## Documentos relacionados

- [FAQ](./faq.md)
- [Operações e concorrência](./concepts/operations-and-concurrency.md)
- [Variáveis de ambiente](./administration/environment-variables.md)
