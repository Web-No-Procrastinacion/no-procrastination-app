// Reglas de gamificación de Constancia.
// Cambia estos valores aquí; la lógica en src/lib/engine.ts los lee sin modificaciones.

export const gamification = {
  /** Puntos por cada tarea o instancia de hábito completada. */
  puntosPorTarea: 1,
  /** Completados mínimos (tareas + instancias de hábito) para que un día cuente en la racha. */
  minTareasRacha: 2,
  /** Completados en la semana (lunes a domingo) para cumplir la meta semanal. */
  metaSemanalTareas: 5,
  /** Puntos que se otorgan una sola vez al cerrar el domingo con la meta cumplida. */
  puntosMetaSemanal: 5,
  /** Puntos necesarios para pasar a cada etapa siguiente del avatar. */
  umbralesAvatar: [10, 35, 75, 130, 200],
  /** Nombres de las 6 etapas del avatar. */
  etapasAvatar: ["Huevo", "Eclosión", "Cría", "Joven", "Adulto", "Pleno"],
  /** Zona horaria con la que empieza cada cuenta. */
  zonaHorariaPorDefecto: "America/Bogota",
} as const;

export const zonasHorarias = [
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "Asia/Tokyo",
] as const;
