# Monitoramento de containers Docker

O UFW Remote Manager pode inventariar e controlar **containers Docker** em cada servidor registrado via **SSH** (mesmo transporte das operações UFW).

Os resultados aparecem em uma tabela **abaixo do painel de varredura de portas** na página do servidor.

## Ativar

Definir no ambiente do app (Compose / Portainer):

```env
DOCKER_MONITOR_ENABLED=true
```

Ajustes opcionais:

| Variável | Padrão | Propósito |
|----------|--------|-----------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | Snapshots de inventário armazenados por servidor |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | Timeout de comandos SSH para Docker CLI |

Atualização de inventário e controle de containers (start/stop/restart) compartilham um **cooldown de 30 segundos** por servidor (fixo no código do app desde v0.5.1). Os legacy `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` e `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` em `.env` são **ignorados**.

## Requisitos nos servidores gerenciados

- **Docker CLI** instalado (`docker` no PATH)
- Daemon Docker acessível para o usuário SSH
- Membresia no grupo **`docker`** ou **sudo sem senha** para `docker`

O app tenta primeiro `docker …`, depois `sudo docker …` se a permissão for negada.

## Recursos (MVP)

- Atualizar inventário: `docker ps -a`, estatísticas para containers em execução
- Tabela: nome, imagem, status, health, portas, CPU/memória, labels Compose
- Agrupamento por projeto Compose
- Gaveta de detalhes do container (`docker inspect`, variáveis env mascaradas)
- Controle: **start**, **stop**, **restart** (confirmação para stop/restart)
- Banner de progresso de operação + eventos de auditoria

## Segurança

- Feature flag (desativado por padrão)
- Validação de ID/nome de container — sem shell arbitrário da interface
- Apenas ações de controle fixas
- Limites de taxa fixos de 30s em atualização e controle (não configuráveis por env)
- Auditoria: `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## Polling de progresso

Enquanto a atualização de inventário está em execução, a interface faz polling de um endpoint de status leve. O intervalo de polling aumenta: **3s → 5s → 10s**. O banner de operação mostra progresso por etapa.

## Documentação relacionada

- [Visão geral de implantação](./overview.md)
- [Modelo de segurança](../administration/security-model.md)
