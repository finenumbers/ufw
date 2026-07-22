# Histórico de operações

Tarefas de longa duração — apply, sync, refresh, instalar UFW, varredura de portas — são rastreadas em **logs de operação** e exibidas na UI.

## Banner de operações

Enquanto o trabalho executa, um banner aparece no topo:

| Elemento | Descrição |
|----------|-----------|
| Status | EM EXECUÇÃO, PENDENTE, SUCESSO, FALHA, PARCIAL |
| Etapas | Status expansível por etapa |
| Mensagem | Texto de progresso ou erro traduzido |

**SUCESSO** fecha automaticamente após ~10 segundos. **FALHA** e **PARCIAL** permanecem até fechar.

### Comportamento de polling (v0.9.2)

- Poll ~**1 segundo** enquanto operação está EM EXECUÇÃO ou PENDENTE
- **Para polling quando ocioso** — sem loop de 5 segundos em segundo plano
- Reinicia quando nova operação começa
- Ao concluir, dispara evento para páginas de servidor refresh SSR data

Veja [Operações e concorrência](../concepts/operations-and-concurrency.md).

### Banner preso

Se banner mostra EM EXECUÇÃO após desconexão, atualize a página. Sweeper em segundo plano marca operações RUNNING antigas como falha em ~30–60 minutos.

## Página de operações

Barra lateral → **Histórico de operações** (`/operations`)

| Aba | Conteúdo |
|-----|----------|
| **Logs de operações** | Log técnico — apply, sync, refresh, varredura de portas, falhas ao criar servidor |
| **Eventos de auditoria** | Eventos de segurança — login, logout, exportação de configuração, ações UFW |

Ambas abas suportam scroll infinito para entradas antigas.

## Tipos de operação

O banco armazena nomes com ponto; a UI traduz.

| Tipo | Descrição |
|------|-----------|
| `apply.rules` | Sessão de apply UFW |
| `ufw.refresh` | Atualizar status — SSH ao vivo + sync de regras |
| `ufw.sync` | Sync inicial em segundo plano quando não há snapshot |
| `ufw.install` | Instalação e ativação remota UFW |
| `port.scan` | Varredura externa de portas |
| `server.create` | Criar servidor com falha SSH |

Legacy (apenas entradas históricas):

- `ssh_test` — pré v0.7.4; não é mais criado

## Limpar histórico

**Limpar histórico** remove entradas antigas de log de operação da UI/banco conforme ação de retenção. Não afeta servidores, regras ou UFW remoto.

A aba Auditoria pode reter eventos conforme política — veja [Log de auditoria e exportação](../administration/audit-log-and-export.md).

## Documentos relacionados

- [Operações e concorrência](../concepts/operations-and-concurrency.md)
- [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md)
- [Varredura de portas](./port-scan.md)
