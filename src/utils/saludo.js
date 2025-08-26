// src/utils/saludo.js
export function obtenerSaludoPersonalizado(nombre) {
  const hora = new Date().getHours();

  let saludo = "Hola";
  if (hora >= 6 && hora < 12) saludo = "Buen día";
  else if (hora >= 12 && hora < 18) saludo = "Buenas tardes";
  else saludo = "Buenas noches";

  const nom = (nombre ?? "").toString().trim() || "usuario";
  return `${saludo}, ${nom}. Listo para conectar con tus clientes 💬`;
}
