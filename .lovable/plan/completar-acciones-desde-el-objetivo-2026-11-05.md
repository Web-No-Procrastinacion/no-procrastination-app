# Completar acciones desde el objetivo

- Reutilizar la fila con casilla de Hoy en el detalle, sin cambiar su apariencia ni comportamiento en Hoy.
- Conectar las casillas del detalle con las acciones existentes: completar/desmarcar hoy, bloquear tareas de días cerrados y desactivar hábitos que no tocan hoy. Conservar el conteo histórico de cada hábito.
- Destacar título, fecha meta, barra grande y acciones completadas en una tarjeta superior; debajo, Tareas y Hábitos. Mantener asociación, creación de tarea asociada y un estado vacío amable.
- Mostrar la confirmación «+1 punto» y conservar el mismo aviso y reintento ante errores de guardado. Todos los datos seguirán actualizándose desde el historial compartido.
- Agregar pruebas con el store real para completar/desmarcar tareas y hábitos, días cerrados, programación, sincronización con Hoy y fallo/reintento de guardado.

## Alcance y detalles técnicos
- No cambiar gamificación, almacenamiento ni otras pantallas. La única modificación en Hoy será importar la fila compartida extraída sin cambios visibles.
- Usar los colores y componentes existentes sin rediseñar globalmente la aplicación. La identidad visual general de AKTIVA queda fuera de este cambio.
- Ejecutar pruebas existentes y nuevas, y verificar el flujo en navegador con tamaños de escritorio y móvil.
