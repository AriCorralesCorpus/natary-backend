require("dotenv").config({ path: ".env.test", override: true, quiet: true });
if (!String(process.env.MYSQLDATABASE).includes("test")) {
  throw new Error("Abortado: la BD configurada no es de pruebas");
}
jest.setTimeout(30000);

const express = require("express");
const fileUpload = require("express-fileupload");
const request = require("supertest");
const conexion = require("../../db");
const ctrl = require("../../controllers/productos.controller");

const app = express();
app.use(express.json());
app.use(fileUpload());
app.post("/api/productos", ctrl.agregarProducto);
app.get("/api/productos", ctrl.getProductos);
app.delete("/api/productos/:id", ctrl.eliminarProducto);

const q = (sql, p = []) =>
  new Promise((ok, no) => conexion.query(sql, p, (e, r) => (e ? no(e) : ok(r))));

afterEach(() => q("DELETE FROM producto WHERE nombre_pro LIKE 'TEST_%'"));
afterAll(() => new Promise((r) => conexion.end(r)));

const enviar = (d) =>
  request(app)
    .post("/api/productos")
    .field("nombre", d.nombre)
    .field("descripcion", d.descripcion)
    .field("precio", d.precio)
    .field("stock", d.stock)
    .attach("imagen", Buffer.from("img-falsa"), "test.png");

test("IT-01 flujo correcto: el producto se guarda realmente en MySQL", async () => {
  const res = await enviar({ nombre: "TEST_conejo", descripcion: "x", precio: 550, stock: 10 });
  expect(res.status).toBe(200);
  const filas = await q("SELECT * FROM producto WHERE nombre_pro = 'TEST_conejo'");
  expect(filas.length).toBe(1);
  expect(Number(filas[0].precio_pro)).toBe(550);
});

test("IT-02 error: precio negativo se rechaza y NO se guarda", async () => {
  const res = await enviar({ nombre: "TEST_malo", descripcion: "x", precio: -1, stock: 2 });
  expect(res.status).toBe(400);
  const filas = await q("SELECT * FROM producto WHERE nombre_pro = 'TEST_malo'");
  expect(filas.length).toBe(0);
});

test("IT-03 consulta y eliminaciÃ³n: aparece en GET y desaparece al borrar", async () => {
  const alta = await enviar({ nombre: "TEST_borrar", descripcion: "x", precio: 100, stock: 1 });
  const lista = await request(app).get("/api/productos");
  expect(lista.body.some((p) => p.cve_pro === alta.body.cve_pro)).toBe(true);
  await request(app).delete(`/api/productos/${alta.body.cve_pro}`);
  const filas = await q("SELECT * FROM producto WHERE cve_pro = ?", [alta.body.cve_pro]);
  expect(filas.length).toBe(0);
});
