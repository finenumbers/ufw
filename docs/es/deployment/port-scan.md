# Escaneo externo de puertos (despliegue)

Los administradores activan el escaneo externo de puertos mediante variables de entorno. Uso orientado al usuario: [Escaneo de puertos (guía de usuario)](../user-guide/port-scan.md).

## Qué hace

Desde el contenedor **ufw-app**, la app escanea la dirección `host` de cada servidor registrado:

1. **Naabu** — descubrimiento TCP puertos 1–65535
2. **Nmap** — detección de servicios en puertos descubiertos

Los resultados se almacenan en Postgres y se muestran en la página del servidor. **No** se usa SSH para escanear.

## Activar

```env
PORT_SCAN_ENABLED=true
```

Reinicie el contenedor de la app tras el cambio. La imagen debe incluir Naabu y Nmap (el Dockerfile oficial lo hace).

## Ajuste opcional

| Variable | Predeterminado | Propósito |
|----------|----------------|-----------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Límite de puertos enviados a Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Tiempo de espera descubrimiento (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Tiempo de espera enriquecimiento (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Escaneos conservados por servidor |

## Requisitos de red

El contenedor de la app debe alcanzar **hosts de servidores gestionados en puertos TCP escaneados**, no solo SSH `:22`. Permita salida desde el host Docker (o red de la app) hacia servidores destino.

Solo se escanean **hosts de servidores registrados** — destinos arbitrarios rechazados.

## Concurrencia (v0.9.2)

| Tema | Comportamiento |
|------|----------------|
| Cola SSH | Escaneo de puertos **no** usa cola SSH por servidor — actualización/aplicación UFW no bloqueada 30+ min |
| Solapamiento | Solo un escaneo PENDING/RUNNING por servidor; segundo inicio rechazado |
| Límite de tasa | 30 segundos entre inicios de escaneo por servidor (fijo en código) |
| SSR | La página de servidor carga último escaneo de **cualquier estado** — escaneos en curso reanudan tras actualizar |

Los hallazgos persisten vía reemplazo atómico (`deleteMany` + `createMany` en una transacción).

## Cobertura UFW

Consulte [Guía de usuario escaneo de puertos](../user-guide/port-scan.md#valores-de-cobertura-ufw) para semántica de columnas.

## Seguridad

- Auditoría: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Escaneos connect only (`-sT`) — no se requieren capacidades raw socket
- Desactivado por defecto

## Documentos relacionados

- [Variables de entorno](../administration/environment-variables.md)
- [Arquitectura](../architecture.md)
- [Operaciones y concurrencia](../concepts/operations-and-concurrency.md)
