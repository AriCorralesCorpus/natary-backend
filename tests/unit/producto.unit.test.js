const { validarProducto, validarStock } = require("../../validators/producto");
const base = { nombre: "Conejo", descripcion: "Conejo tejido", precio: 550, stock: 10 };

describe("validarProducto (lógica pura)", () => {
  test("UT-01 válido: acepta un producto correcto", () => {
    expect(validarProducto(base)).toEqual({ valido: true, errores: [] });
  });
  test("UT-02 límite: acepta stock 0 y precio 0.01", () => {
    expect(validarProducto({ ...base, stock: 0, precio: 0.01 }).valido).toBe(true);
  });
  test("UT-03 inválido: rechaza precio negativo", () => {
    const r = validarProducto({ ...base, precio: -1 });
    expect(r.valido).toBe(false);
    expect(r.errores).toContain("El precio debe ser mayor a 0");
  });
  test("UT-04 inválido: rechaza stock negativo", () => {
    expect(validarProducto({ ...base, stock: -2 }).valido).toBe(false);
  });
  test("UT-09 inválido: rechaza nombre y descripción vacíos", () => {
  const r = validarProducto({ ...base, nombre: "  ", descripcion: "" });
  expect(r.valido).toBe(false);
  expect(r.errores).toContain("El nombre es obligatorio");
  expect(r.errores).toContain("La descripción es obligatoria");
});
});

describe("validarStock", () => {
  test("UT-06 válido: acepta stock 0 y 5", () => {
    expect(validarStock(0).valido).toBe(true);
    expect(validarStock("5").valido).toBe(true);
  });
  test("UT-07 inválido: rechaza stock negativo, decimal y vacío", () => {
    expect(validarStock(-1).valido).toBe(false);
    expect(validarStock(2.5).valido).toBe(false);
    expect(validarStock("").valido).toBe(false);
  });
});