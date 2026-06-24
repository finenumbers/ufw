# Log de auditoria e exportação

Existem duas camadas de registro: **logs de operações** (técnicos) e **eventos de auditoria** (segurança/conformidade).

## Eventos de auditoria

Gravados na tabela `audit_event`. Exemplos:

| Ação | Quando |
|--------|------|
| `LOGIN` | Sessão de usuário criada |
| `LOGOUT` | Sessão excluída |
| `CONFIG_EXPORT` | Configuração de servidores exportada (após reentrada de senha) |

Visualize em **Histórico de operações** → aba **Eventos de auditoria**.

## Logs de operações

Gravados para trabalho de longa duração: apply, atualização de status, instalação, teste SSH, etc. Inclui metadados de etapas e mensagens de sucesso/falha.

Visualize em **Histórico de operações** → aba **Logs de operações** ou no **banner de operação** ao vivo.

## Trilha de auditoria de exportação de configuração

Cada exportação bem-sucedida cria um registro de auditoria `CONFIG_EXPORT` com ID de usuário e timestamp. Use isso para rastrear quem baixou arquivos de credenciais em texto plano.

## Retenção

A retenção de snapshots mantém os últimos **10** snapshots por servidor (purge automático dos mais antigos). A retenção de logs de operações pode ser limpa manualmente na interface.

Planeje política de backup para dados de auditoria se a conformidade exigir retenção longa — veja [Backup e restauração](../operations/backup-restore.md).

## Documentação relacionada

- [Importar e exportar configuração](../concepts/import-export-config.md)
- [Histórico de operações](../user-guide/operations-history.md)
- [SECURITY.md](../../../SECURITY.md)
