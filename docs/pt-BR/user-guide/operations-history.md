# Histórico de operações

Tarefas de longa duração (aplicar, atualizar, instalar UFW, port scan, inventário Docker) são rastreadas em **logs de operação** e exibidas na interface.

## Banner de operação

Enquanto uma operação está em execução, um banner aparece no topo do app:

- Tipo de operação e status (RUNNING, SUCCESS, FAILED)
- Lista de etapas expansível com status por etapa
- Fechamento automático em caso de sucesso após um curto atraso

O banner faz polling de atualizações enquanto o trabalho está em andamento.

Se um banner parecer preso em **RUNNING** ou **PENDING** após desconexão do navegador, atualize a página. Operações obsoletas são limpas automaticamente por uma varredura em segundo plano (tipicamente em 30–60 minutos).

## Página de operações

Barra lateral → **Histórico de operações** (`/operations`)

Duas abas:

| Aba | Conteúdo |
|-----|----------|
| **Operações** | Log técnico de operações — aplicar, sync, atualizar, port scan, Docker, etc. |
| **Audit** | Eventos relevantes para segurança — login, logout, exportação de configuração |

Ambas suportam rolagem infinita para entradas mais antigas.

## Tipos de operação

O banco de dados armazena nomes de tipo com pontos (por exemplo `ufw.refresh`). A interface os traduz com chaves com underscore (por exemplo `ufw_refresh`).

Exemplos ativos:

- `apply_rules` / `apply.rules` — aplicar UFW
- `ufw_refresh` / `ufw.refresh` — Atualizar status (leitura SSH ao vivo + sync de regras)
- `ufw_sync` / `ufw.sync` — sync inicial em segundo plano quando não existe snapshot
- `ufw_install` / `ufw.install` — instalação UFW (a ativação ocorre durante a instalação)
- `port_scan` / `port.scan` — port scan externo
- `docker_inventory` / `docker.inventory` — atualização do inventário Docker
- `docker_control` / `docker.control` — iniciar/parar/reiniciar container
- `server_create` / `server.create` — novo servidor adicionado

Legado (apenas entradas históricas no log):

- `ssh_test` — de releases anteriores a v0.7.4; não é mais criado

## Limpar histórico

Administradores podem limpar histórico de operações antigo na interface (eventos de audit podem ser retidos conforme política de retenção). A limpeza não afeta estado do servidor ou regras.

## Documentação relacionada

- [Log de audit e exportação](../administration/audit-log-and-export.md)
- [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md)
