export function obtenerSaludoPersonalizado(nombre: string) {
  const hora = new Date().getHours();

  let saludo = "Hola";
  if (hora >= 6 && hora < 12) saludo = "Buen día";
  else if (hora >= 12 && hora < 18) saludo = "Buenas tardes";
  else saludo = "Buenas noches";

  return `${saludo}, ${nombre}. Listo para conectar con tus clientes 💬`;
}
