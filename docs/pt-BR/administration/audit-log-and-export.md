# Log de auditoria e exportação

Duas trilhas complementares: **logs de operação** (progresso de tarefas) e **eventos de auditoria** (segurança e conformidade).

## Eventos de auditoria

Gravados no Postgres em ações sensíveis. Exemplos:

| Ação | Quando |
|------|--------|
| `LOGIN` / `LOGOUT` | Início/fim de sessão |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Fluxo de apply |
| `SNAPSHOT_LOADED` | Snapshot UFW capturado |
| `UFW_ENABLE` | Ativação remota após install |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Ciclo de vida de varredura de portas |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | Transferência de configuração JSON v2 |
| CRUD de servidor | Criar/atualizar/excluir registros de servidor |

Visualize em **Histórico de operações** → aba **Eventos de auditoria** com scroll infinito.

Retenção de auditoria segue armazenamento do banco — sem purge automático salvo operador limpar histórico.

## Logs de operação

Registros técnicos com etapas, status, timestamps e mensagens de erro. Veja [Histórico de operações](../user-guide/operations-history.md).

## Auditoria de exportação de configuração

Cada **Salvar configuração** bem-sucedido cria entrada de auditoria. Arquivo de exportação contém **segredos SSH descriptografados** — proteja como dump de cofre de senhas.

Fluxo de exportação:

1. Confirmação de senha (step-up)
2. Token de download de curta duração
3. Download JSON via rota API

Limite de taxa: 5 exportações por minuto por usuário.

## Limpar histórico

**Limpar histórico** na página de operações remove entradas de log de operação conforme ação da UI. Não reverte alterações de servidor ou exclui eventos de auditoria em todos os casos — confirme texto do diálogo para comportamento atual.

Não modifica UFW remoto ou rascunhos locais de regras.

## Documentos relacionados

- [Importar e exportar configuração](../concepts/import-export-config.md)
- [Modelo de segurança](./security-model.md)
