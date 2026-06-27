# Escaneo de puertos externo

UFW Remote Manager puede ejecutar un **escaneo de puertos externo** desde el contenedor `ufw-app` hacia la dirección `host` de cada servidor registrado. La pipeline usa:

1. **Naabu** — descubrimiento TCP en puertos 1–65535 (`host/port/protocol/open`)
2. **Nmap** — detección de servicios solo en puertos descubiertos (`-sV`, salida XML)

Los resultados aparecen en una tabla **debajo de las reglas UFW** en la página del servidor.

## Activar

Definir en el entorno de la app (Compose / Portainer):

```env
PORT_SCAN_ENABLED=true
```

Ajustes opcionales:

| Variable | Predeterminado | Propósito |
|----------|----------------|-----------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Máx. puertos enviados al enriquecimiento Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Tiempo de espera de descubrimiento completo (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Tiempo de espera de enriquecimiento |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Ejecuciones de escaneo almacenadas por servidor |

Los escaneos repetidos en el mismo servidor están limitados a **una vez cada 30 segundos** (fijo en el código desde v0.5.1). El legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` en `.env` se **ignora**.

## Requisitos de red

El contenedor de la app debe alcanzar **los hosts de servidores gestionados en los puertos TCP escaneados**, no solo SSH `:22`. Asegure que las reglas de enrutamiento/firewall permitan salida desde el host Docker (o red `ufw-app`) hacia los servidores destino.

Esta función escanea **solo hosts ya registrados en UFW Remote Manager** — los destinos arbitrarios se rechazan.

## Columna de cobertura UFW

Cada puerto abierto se compara con el último snapshot UFW usando **semántica de escaneo externo**:

| Valor | Significado |
|-------|-------------|
| **Allowed** | ALLOW/LIMIT entrante de **cualquier** origen (`From = any`) cubre este puerto |
| **Not in UFW** | Puerto abierto externamente pero no cubierto por ALLOW entrante público — revisar |
| **Denied** | DENY/REJECT entrante de **cualquier** origen apunta a este puerto |
| **Unknown** | UFW inactivo o sin snapshot |

Las reglas de lista blanca (`From = specific IP/CIDR`, `To Port = any`) **no** cuentan como permitidas para escaneo externo. Solo las reglas que permiten explícitamente tráfico desde cualquier lugar se tratan como exposición pública.

## Notas de seguridad

- Limitado por tasa (30 segundos entre escaneos repetidos por servidor; no configurable por env)
- Eventos de auditoría: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Los escaneos se ejecutan en la cola por servidor junto a operaciones SSH (serializadas)
- Usa escaneos connect (`naabu -scan-type c`, `nmap -sT`) — no se requieren capacidades raw socket

## Polling de progreso

Mientras un escaneo se ejecuta, la interfaz consulta un endpoint de estado ligero (no relecturas SSH completas). Polling **inmediato**, luego cada **1s** mientras la operación está activa (backoff tras ~30 min). Al completarse en el banner, los paneles se actualizan al instante. El banner consulta la API cada **1s** en RUNNING.

## Documentación relacionada

- [Resumen de despliegue](./overview.md)
- [Modelo de seguridad](../administration/security-model.md)
