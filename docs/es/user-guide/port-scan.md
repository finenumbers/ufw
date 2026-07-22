# Escaneo de puertos (guía de usuario)

Cuando su administrador lo activa, el **panel de escaneo de puertos** en cada página de servidor descubre servicios TCP accesibles externamente y los compara con sus reglas UFW.

Los administradores activan y ajustan el escaneo mediante variables de entorno — consulte [Escaneo externo de puertos (despliegue)](../deployment/port-scan.md).

## Cuándo aparece el panel

El panel es visible solo cuando `PORT_SCAN_ENABLED=true` en el entorno de la app. Si está desactivado, la página del servidor muestra solo reglas UFW.

## Iniciar un escaneo

1. Abra el panel de un servidor.
2. En la barra de herramientas del panel UFW, haga clic en **Scan ports** (o use la sección de escaneo de puertos si aparece debajo de la tabla de reglas).
3. Aparece un banner de operaciones con pasos: resolver destino → descubrimiento → enriquecimiento → normalización.
4. Los resultados se rellenan en la tabla cuando el escaneo termina con éxito.

El descubrimiento TCP completo (puertos 1–65535) puede tardar **30 minutos o más**. El escaneo corre desde el contenedor de la app hacia el hostname o IP registrado del servidor — no por SSH.

## Estados del escaneo

| Estado | Significado | Comportamiento de interfaz |
|--------|-------------|---------------------------|
| **PENDING** | Trabajo de escaneo creado, aún no iniciado | Muestra *Scanning...*; sondeo activo |
| **RUNNING** | Naabu/Nmap en progreso | Progreso vía banner de operaciones; tabla puede estar vacía o mostrar resultados anteriores |
| **SUCCESS** | Escaneo terminado | Tabla completa de hallazgos; fecha y recuento de puertos en cabecera del panel |
| **FAILED** | Error o tiempo de espera agotado | Mensaje de error mostrado; resultados exitosos anteriores pueden seguir mostrándose |

## Reanudar tras actualizar página

Desde v0.9.2, abrir una página de servidor carga el **último escaneo de cualquier estado** desde la base de datos — no solo el último exitoso. Si actualiza el navegador mientras un escaneo está `PENDING` o `RUNNING`, el panel reanuda el sondeo y el banner de operaciones retoma la operación activa.

## Tabla de resultados

| Columna | Descripción |
|---------|-------------|
| **Port** | Número de puerto TCP |
| **Proto** | Protocolo (típicamente `tcp`) |
| **State** | Normalmente `open` para puertos descubiertos |
| **Service** | Nombre de servicio de Nmap cuando está disponible |
| **Product / Version** | Cadena de producto y versión cuando se detecta |
| **UFW** | Cobertura relativa a su último snapshot UFW |

### Valores de cobertura UFW

La cobertura usa **semántica de escaneo externo** — lo que vería un cliente anónimo en internet:

| Valor | Significado |
|-------|-------------|
| **Allowed** | ALLOW/LIMIT entrante desde **cualquier** origen cubre este puerto |
| **Not in UFW** | El puerto está abierto externamente pero no cubierto por una regla allow entrante pública — revisar |
| **Denied** | DENY/REJECT entrante desde **cualquier** origen apunta a este puerto |
| **Unknown** | UFW inactivo o no hay snapshot disponible |

Las reglas solo de lista blanca (IP/CIDR origen específico, o `To Port = any` sin allow público) **no** cuentan como *Allowed* para escaneo externo.

## Solapamiento y límites de tasa

| Situación | Mensaje / comportamiento |
|-----------|-------------------------|
| Escaneo ya en curso en este servidor | *Ya hay un escaneo de puertos en curso para este servidor.* — espere a completar |
| Repetir escaneo en 30 segundos | Mensaje de límite de tasa con cuenta atrás de reintento |

Solo se permite un escaneo activo por servidor a la vez. El escaneo de puertos no bloquea actualización UFW o aplicación en el mismo servidor.

## Relación con estadísticas de lista de servidores

La tarjeta de **lista de servidores** puede mostrar un recuento de puertos abiertos del último escaneo exitoso. La línea de inventario del panel muestra fecha de escaneo y recuento de hallazgos cuando existe un escaneo exitoso.

Los recuentos de reglas guardadas en tarjetas de lista se refieren a **metadatos locales de reglas** (`ruleRecord`), no a números de reglas UFW remotas.

## Historial de operaciones

Cada escaneo crea una entrada de registro de operaciones de tipo `port.scan`. Los eventos de auditoría `PORT_SCAN_STARTED` y `PORT_SCAN_COMPLETED` se registran al iniciar y al terminar con éxito.

Consulte [Historial de operaciones](./operations-history.md).

## Documentos relacionados

- [Escaneo externo de puertos (despliegue)](../deployment/port-scan.md)
- [Operaciones y concurrencia](../concepts/operations-and-concurrency.md)
- [Administrar servidores](./manage-servers.md)
