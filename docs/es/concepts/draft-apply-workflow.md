# Flujo de borrador y aplicación

UFW Remote Manager nunca aplica cambios de cortafuegos en silencio. Cada mutación sigue **editar → vista previa → confirmar → aplicar**.

![Flujo de aplicación](../../assets/ufw-apply-workflow.svg)

## Pasos

### 1. Editar borrador

Modifique reglas en la tabla: añadir, editar, eliminar, reordenar, importar. Los cambios permanecen en el **borrador local** hasta aplicar.

### 2. Vista previa de aplicación

Pulse **Vista previa de aplicación**. La aplicación:

1. Carga el estado UFW actual del servidor (snapshot SSH)
2. Calcula un **plan** — comandos que alinearían UFW con su borrador
3. Muestra reglas añadidas, eliminadas y reordenadas

Revise la vista previa con cuidado. Preste atención a reglas que podrían bloquearle el acceso (p. ej. bloquear SSH).

### 3. Confirmar

Confirme en el diálogo. Solo entonces se ejecutan los comandos UFW por SSH.

### 4. Ejecución de la aplicación

Los comandos se ejecutan secuencialmente en el servidor (cola por servidor, concurrencia 1). El progreso aparece en el **banner de operación** con estado paso a paso.

### 5. Sincronización post-aplicación

Tras el éxito, la aplicación actualiza el snapshot y sincroniza los estados de origen del borrador para que los colores de fila reflejen la nueva realidad.

## Diagrama de secuencia

```mermaid
sequenceDiagram
  participant User
  participant App as ufw_app
  participant DB as Postgres
  participant Remote as Linux_UFW

  User->>App: Editar reglas borrador
  User->>App: Vista previa aplicación
  App->>Remote: Lectura snapshot SSH
  App->>App: Construir diff plan
  User->>App: Confirmar aplicación
  App->>Remote: Lectura snapshot SSH
  alt Remoto cambió desde vista previa
    App-->>User: Rechazo — nueva vista previa requerida
  else Plan coincide
    App->>Remote: Comandos ufw SSH
    App->>DB: Actualizar snapshot y auditoría
  end
```

## Aplicación parcial y deriva

UFW remoto puede cambiar entre vista previa y confirmación, o la aplicación puede fallar a mitad de camino. La aplicación maneja tres casos distintos:

| Escenario | Estado de sesión | Qué hacer |
|-----------|------------------|-----------|
| UFW remoto cambió **entre vista previa y confirmación** | Aplicación rechazada (`needsRePreview`) | Ejecutar **Vista previa de aplicación** de nuevo — no forzar resincronización |
| Comandos UFW **interrumpidos** en el servidor | `PARTIAL` (`needsResync`) | **Forzar resincronización desde servidor**, luego revisar antes de editar |
| Comandos UFW exitosos pero **sincronización post-aplicación fallida** | `PARTIAL` (`needsResync`) | **Forzar resincronización desde servidor** — UFW remoto ya cambió |

**Nunca ignore avisos de aplicación parcial** — continuar a ciegas puede causar reglas duplicadas o errores de orden.

## Salvaguarda de SSH permitido

El planificador de aplicación incluye salvaguardas en torno a reglas de acceso SSH cuando está configurado — consulte tests en `src/lib/ufw/commands.allow-ssh.test.ts`. Verifique la vista previa manualmente en servidores de producción.

## Documentación relacionada

- [Reglas UFW y estados](./ufw-rules-and-states.md)
- [Editar y aplicar reglas](../user-guide/edit-and-apply-rules.md)
- [Historial de operaciones](../user-guide/operations-history.md)
