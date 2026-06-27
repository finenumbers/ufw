# Histórico de operações

Tarefas de longa duração (aplicar, atualizar, instalar UFW, teste SSH) são rastreadas em **logs de operação** e exibidas na interface.

## Banner de operação

Enquanto uma operação está em execução, um banner aparece no topo do app:

- Tipo de operação e status (RUNNING, SUCCESS, FAILED)
- Lista de etapas expansível com status por etapa
- Fechamento automático em sucesso após breve atraso

O banner faz polling de atualizações enquanto o trabalho está em andamento.

Se um banner ficar preso em **RUNNING** ou **PENDING** após desconexão do navegador, atualize a página. Operações obsoletas são limpas automaticamente por uma varredura em segundo plano (tipicamente em 30–60 minutos).

## Página de operações

Barra lateral → **Histórico de operações** (`/operations`)

Duas abas:

| Aba | Conteúdo |
|-----|----------|
| **Operações** | Log técnico de operações — aplicar, sync, teste SSH, etc. |
| **Auditoria** | Eventos relevantes para segurança — login, logout, exportação de config |

Ambas suportam rolagem infinita para entradas mais antigas.

## Tipos de operação

Exemplos:

- `apply_rules` — aplicação UFW
- `ufw_refresh` — atualizar status e regras
- `ufw_sync` — sincronizar rascunho com servidor
- `ufw_install` / `ufw_enable` — configuração UFW
- `ssh_test` — verificação de conexão
- `server_create` — novo servidor adicionado

## Limpar histórico

Administradores podem limpar histórico antigo de operações na interface (eventos de auditoria podem ser retidos conforme política de retenção). Limpar não afeta estado do servidor ou regras.

## Documentação relacionada

- [Log de auditoria e exportação](../administration/audit-log-and-export.md)
- [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md)
