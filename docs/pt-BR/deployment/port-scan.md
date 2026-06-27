# Varredura de portas externa

O UFW Remote Manager pode executar uma **varredura de portas externa** do container `ufw-app` em direção ao endereço `host` de cada servidor registrado. O pipeline usa:

1. **Naabu** — descoberta TCP nas portas 1–65535 (`host/port/protocol/open`)
2. **Nmap** — detecção de serviços apenas nas portas descobertas (`-sV`, saída XML)

Os resultados aparecem em uma tabela **abaixo das regras UFW** na página do servidor.

## Ativar

Definir no ambiente do app (Compose / Portainer):

```env
PORT_SCAN_ENABLED=true
```

Ajustes opcionais:

| Variável | Padrão | Propósito |
|----------|--------|-----------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Máx. portas enviadas ao enriquecimento Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout de descoberta de portas completas (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout de enriquecimento |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Execuções de varredura armazenadas por servidor |

Varreduras repetidas no mesmo servidor são limitadas a **uma a cada 30 segundos** (fixo no código do app desde v0.5.1). O legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` em `.env` é **ignorado**.

## Requisitos de rede

O container do app deve alcançar **hosts de servidores gerenciados nas portas TCP varridas**, não apenas SSH `:22`. Garanta que regras de roteamento/firewall permitam saída do host Docker (ou rede `ufw-app`) para servidores de destino.

Este recurso varre **apenas hosts já registrados no UFW Remote Manager** — alvos arbitrários são rejeitados.

## Coluna de cobertura UFW

Cada porta aberta é comparada com o último snapshot UFW usando **semântica de varredura externa**:

| Valor | Significado |
|-------|-------------|
| **Allowed** | ALLOW/LIMIT de entrada de **qualquer** origem (`From = any`) cobre esta porta |
| **Not in UFW** | Porta aberta externamente mas não coberta por ALLOW de entrada público — revisar |
| **Denied** | DENY/REJECT de entrada de **qualquer** origem direciona esta porta |
| **Unknown** | UFW inativo ou sem snapshot |

Regras de whitelist (`From = specific IP/CIDR`, `To Port = any`) **não** contam como permitidas para varredura externa. Apenas regras que permitem explicitamente tráfego de qualquer lugar são tratadas como exposição pública.

## Notas de segurança

- Limitado por taxa (30 segundos entre varreduras repetidas por servidor; não configurável por env)
- Eventos de auditoria: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Varreduras executam na fila por servidor junto com operações SSH (serializadas)
- Usa varreduras connect (`naabu -scan-type c`, `nmap -sT`) — não requer capacidades raw socket

## Polling de progresso

Enquanto uma varredura está em execução, a interface faz polling de um endpoint de status leve (não releituras SSH completas). Polling **imediato**, depois a cada **1s** enquanto a operação está ativa (backoff após ~30 min). Ao concluir no banner, os painéis atualizam na hora. O banner consulta a API a cada **1s** em RUNNING.

## Documentação relacionada

- [Visão geral de implantação](./overview.md)
- [Modelo de segurança](../administration/security-model.md)
