jest.mock("../../db", () => ({ query: jest.fn() }));
jest.mock("../../events", () => ({ avisar: jest.fn() }));
const conexion = require("../../db");
const { agregarProducto, actualizarStock, editarProducto } = require("../../controllers/productos.controller");

function fakeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

test("UT-05 (con mock de BD): agregarProducto no debe insertar precio negativo", () => {
  conexion.query.mockImplementation((sql, params, cb) => {
    const callback = typeof params === "function" ? params : cb;
    callback(null, [{ siguiente: 1 }]);
  });
  const req = {
    body: { nombre: "TEST", descripcion: "x", precio: -1, stock: 2 },
    files: { imagen: { name: "a.png", mv: (p, cb) => cb(null) } },
  };
  const res = fakeRes();
  agregarProducto(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  const hizoInsert = conexion.query.mock.calls.some((c) => String(c[0]).includes("INSERT"));
  expect(hizoInsert).toBe(false);
});

test("UT-08 (con mock de BD): actualizarStock no debe guardar stock negativo", () => {
  const req = { params: { id: "PROD001" }, body: { stock: -3 } };
  const res = fakeRes();
  conexion.query.mockClear();
  actualizarStock(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(conexion.query).not.toHaveBeenCalled();
});

test("UT-10 (con mock de BD): editarProducto no debe guardar precio negativo", () => {
  const req = { params: { id: "PROD001" }, body: { nombre: "TEST", descripcion: "x", precio: -1, stock: 2 } };
  const res = fakeRes();
  conexion.query.mockClear();
  editarProducto(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(conexion.query).not.toHaveBeenCalled();
});

test("UT-11 (con mock de BD): editarProducto con datos válidos ejecuta el UPDATE", () => {
  conexion.query.mockClear();
  conexion.query.mockImplementation((sql, params, cb) => cb(null));
  const req = { params: { id: "PROD001" }, body: { nombre: "TEST", descripcion: "x", precio: 100, stock: 2 } };
  const res = fakeRes();
  editarProducto(req, res);
  expect(String(conexion.query.mock.calls[0][0])).toContain("UPDATE");
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
});

test("UT-12 (con mock de BD): actualizarStock con stock válido ejecuta el UPDATE", () => {
  conexion.query.mockClear();
  conexion.query.mockImplementation((sql, params, cb) => cb(null));
  const req = { params: { id: "PROD001" }, body: { stock: 8 } };
  const res = fakeRes();
  actualizarStock(req, res);
  expect(String(conexion.query.mock.calls[0][0])).toContain("UPDATE");
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
});