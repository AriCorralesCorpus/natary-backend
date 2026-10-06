const express = require("express");
const router = express.Router();
const db = require("../db");
const verificarToken = require("../middleware/auth");

// Convierte db.query en promesa
const q = (sql, params) =>
    new Promise((resolve, reject) =>
        db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
    );

router.post("/", verificarToken, async (req, res) => {

    const usuario = req.user.nombre;
    const descontados = []; // para devolver el stock si algo falla

    try {
        // 1. buscar carrito
        const carrito = await q(
            "SELECT id_carrito FROM carrito WHERE nom_usu = ?",
            [usuario]
        );
        if (!carrito.length) {
            return res.json({ success: false, msg: "No existe carrito" });
        }
        const idCarrito = carrito[0].id_carrito;

        // 2. productos del carrito
        const items = await q(
            `SELECT cd.cve_pro, cd.cantidad, p.precio_pro, p.nombre_pro
             FROM carrito_detalle cd
             INNER JOIN producto p ON p.cve_pro = cd.cve_pro
             WHERE cd.id_carrito = ?`,
            [idCarrito]
        );
        if (!items.length) {
            return res.json({ success: false, msg: "Carrito vacío" });
        }

        // 3. descontar stock solo si alcanza (atómico: gana quien llega primero)
        const agotados = [];
        for (const p of items) {
            const r = await q(
                `UPDATE producto
                 SET stock_pro = stock_pro - ?
                 WHERE cve_pro = ? AND stock_pro >= ?`,
                [p.cantidad, p.cve_pro, p.cantidad]
            );
            if (r.affectedRows === 1) descontados.push(p);
            else agotados.push({ cve_pro: p.cve_pro, nombre: p.nombre_pro });
        }

        // 4. si algo no alcanzó, devolver lo descontado y avisar
        if (agotados.length) {
            for (const p of descontados) {
                await q(
                    "UPDATE producto SET stock_pro = stock_pro + ? WHERE cve_pro = ?",
                    [p.cantidad, p.cve_pro]
                );
            }
            return res.status(409).json({
                success: false,
                msg: "Algunos productos ya no están disponibles",
                agotados
            });
        }

        // 5. todo disponible: crear compra
        let total = 0;
        let totalCantidad = 0;
        items.forEach(p => {
            total += p.precio_pro * p.cantidad;
            totalCantidad += p.cantidad;
        });

        const venta = await q(
            `INSERT INTO compra
             (fecha, aprobado_com, cantsol_com, id_usuario, folio_compra)
             VALUES (NOW(), 1, ?, ?, ?)`,
            [totalCantidad, usuario, "FOLIO-" + Date.now()]
        );

        // 6. guardar detalle
        for (const p of items) {
            await q(
                `INSERT INTO compra_detalle (cve_com, cve_pro, cantidad, precio)
                 VALUES (?, ?, ?, ?)`,
                [venta.insertId, p.cve_pro, p.cantidad, p.precio_pro]
            );
        }

        // 7. limpiar carrito
        await q("DELETE FROM carrito_detalle WHERE id_carrito = ?", [idCarrito]);

        return res.json({ success: true, total });

    } catch (err) {
        console.log("ERROR COMPRA:", err);
        // si falló a medias, devolver el stock ya descontado
        for (const p of descontados) {
            try {
                await q(
                    "UPDATE producto SET stock_pro = stock_pro + ? WHERE cve_pro = ?",
                    [p.cantidad, p.cve_pro]
                );
            } catch (_) {}
        }
        return res.status(500).json({ success: false, msg: "Error al procesar la compra" });
    }
});

module.exports = router;