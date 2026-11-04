function validarProducto({ nombre, descripcion, precio, stock }) {
  const errores = [];
  if (!nombre || !String(nombre).trim()) errores.push("El nombre es obligatorio");
  if (!descripcion || !String(descripcion).trim()) errores.push("La descripción es obligatoria");
  if (precio === "" || precio == null || !Number.isFinite(Number(precio)) || Number(precio) <= 0)
    errores.push("El precio debe ser mayor a 0");
  if (stock === "" || stock == null || !Number.isInteger(Number(stock)) || Number(stock) < 0)
    errores.push("El stock debe ser un entero mayor o igual a 0");
  return { valido: errores.length === 0, errores };
}
function validarStock(stock) {
  if (stock === "" || stock == null || !Number.isInteger(Number(stock)) || Number(stock) < 0)
    return { valido: false, errores: ["El stock debe ser un entero mayor o igual a 0"] };
  return { valido: true, errores: [] };
}

module.exports = { validarProducto, validarStock };