// src/utils/saludo.js
/**
 * Genera un saludo contextual con horario local.
 * - TZ por defecto: America/Argentina/Mendoza (evita depender del navegador).
 * - Puro/testeable: podés inyectar `date` para tests.
 * - Sanea el nombre y permite desactivar el emoji.
 *
 * @param {string} nombre
 * @param {{ date?: Date, timeZone?: string, withEmoji?: boolean }} opts
 * @returns {string}
 */
export function obtenerSaludoPersonalizado(nombre, opts = {}) {
  const {
    date = new Date(),
    timeZone = "America/Argentina/Mendoza",
    withEmoji = true,
  } = opts;

  // Hora en la TZ indicada (0-23)
  let hour = 0;
  try {
    const hStr = new Intl.DateTimeFormat("es-AR", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(date);
    hour = parseInt(hStr, 10);
    if (Number.isNaN(hour)) hour = date.getHours();
  } catch {
    // fallback si Intl falla en el entorno
    hour = date.getHours();
  }

  let saludo = "Hola";
  if (hour >= 6 && hour < 12) saludo = "Buen día";
  else if (hour >= 12 && hour < 18) saludo = "Buenas tardes";
  else saludo = "Buenas noches";

  const nom = String(nombre ?? "").trim() || "usuario";
  const tail = withEmoji ? " Conectemos con tus clientes 💬" : "";
  return `${saludo}, ${nom}.${tail}`;
}
