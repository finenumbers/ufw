# Varredura externa de portas (implantação)

Administradores habilitam varredura externa de portas via variáveis de ambiente. Uso voltado ao usuário: [Varredura de portas (guia do usuário)](../user-guide/port-scan.md).

## O que faz

Do container **ufw-app**, o app varre o endereço `host` de cada servidor registrado:

1. **Naabu** — descoberta TCP portas 1–65535
2. **Nmap** — detecção de serviço nas portas descobertas

Resultados armazenados no Postgres e exibidos na página do servidor. **Nenhum SSH** é usado para varredura.

## Habilitar

```env
PORT_SCAN_ENABLED=true
```

Reinicie o container do app após alteração. A imagem deve incluir Naabu e Nmap (Dockerfile oficial inclui).

## Ajuste opcional

| Variável | Padrão | Propósito |
|----------|--------|-----------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Limitar portas enviadas ao Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout de descoberta (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout de enriquecimento (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Scans retidos por servidor |

## Requisitos de rede

O container do app deve alcançar **hosts de servidores gerenciados nas portas TCP varridas**, não apenas SSH `:22`. Permita egress do host Docker (ou rede do app) para servidores de destino.

Apenas **hosts de servidores registrados** são varridos — alvos arbitrários rejeitados.

## Concorrência (v0.9.2)

| Tópico | Comportamento |
|--------|---------------|
| Fila SSH | Varredura de portas **não** usa fila SSH por servidor — refresh/apply UFW não bloqueados por 30+ min |
| Sobreposição | Apenas um scan PENDING/RUNNING por servidor; segundo início rejeitado |
| Limite de taxa | 30 segundos entre inícios de scan por servidor (fixo no código) |
| SSR | Página do servidor carrega último scan de **qualquer status** — scans em andamento retomam após refresh |

Findings persistem via replace atômico (`deleteMany` + `createMany` em uma transação).

## Cobertura UFW

Veja [Guia do usuário de varredura de portas](../user-guide/port-scan.md#valores-de-cobertura-ufw) para semântica das colunas.

## Segurança

- Auditoria: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Scans apenas connect (`-sT`) — sem capabilities de raw socket
- Desabilitado por padrão

## Documentos relacionados

- [Variáveis de ambiente](../administration/environment-variables.md)
- [Arquitetura](../architecture.md)
- [Operações e concorrência](../concepts/operations-and-concurrency.md)
