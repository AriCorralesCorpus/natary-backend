const conexion = require("../db");
const path = require("path");

//GET productos
const getProductos = (req, res) => {
  const sql = "SELECT * FROM producto";

  conexion.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

const agregarProducto = (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;

  if (!req.files || !req.files.imagen) {
    return res.status(400).json({ message: "Imagen requerida" });
  }

  const imagen = req.files.imagen;
  const nombreImagen = Date.now() + "_" + imagen.name;
  const uploadPath = path.join(__dirname, "../uploads/", nombreImagen);

  imagen.mv(uploadPath, (err) => {
    if (err) {
      console.error("ERROR AL GUARDAR IMAGEN:", err);
      return res.status(500).json({ message: err.message });
    }

    const sqlClave = `
      SELECT IFNULL(MAX(CAST(SUBSTRING(cve_pro, 5) AS UNSIGNED)), 0) + 1 AS siguiente
      FROM producto
    `;

    conexion.query(sqlClave, (err, filas) => {
      if (err) {
        console.error("ERROR AL GENERAR CLAVE:", err);
        return res.status(500).json({ message: err.message });
      }

      const cve_pro = "PROD" + String(filas[0].siguiente).padStart(3, "0");

      const sql = `
        INSERT INTO producto
        (cve_pro, nombre_pro, des_pro, precio_pro, stock_pro, img_pro)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      conexion.query(
        sql,
        [cve_pro, nombre, descripcion, precio, stock, nombreImagen],
        (err) => {
          if (err) {
            console.error("ERROR POST PRODUCTO:", err);
            return res.status(500).json({ message: err.message });
          }
          res.json({ success: true, cve_pro });
        }
      );
    });
  });
};

//ACTUALIZAR STOCK
const actualizarStock = (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const sql = `
    UPDATE producto 
    SET stock_pro = ?
    WHERE cve_pro = ?
  `;

  conexion.query(sql, [stock, id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ success: true, message: "Stock actualizado" });
  });
};

//ELIMINAR
const eliminarProducto = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM producto WHERE cve_pro = ?";

  conexion.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ success: true, message: "Producto eliminado" });
  });
};

// EDITAR PRODUCTO
const editarProducto = (req,res)=>{

  const {id} = req.params;

  const {
    nombre,
    descripcion,
    precio,
    stock
  } = req.body;


  const sql = `
    UPDATE producto
    SET 
    nombre_pro=?,
    des_pro=?,
    precio_pro=?,
    stock_pro=?
    WHERE cve_pro=?
  `;


  conexion.query(
    sql,
    [
      nombre,
      descripcion,
      precio,
      stock,
      id
    ],
    (err)=>{

      if(err)
        return res.status(500).json(err);


      res.json({
        success:true,
        message:"Producto actualizado"
      });

    }
  );

};

module.exports = {
  getProductos,
  agregarProducto,
  actualizarStock,
  eliminarProducto,
  editarProducto
};