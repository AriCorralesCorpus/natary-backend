const clientes = new Set();

function suscribir(req, res) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders();
  res.write("retry: 3000\n\n");

  clientes.add(res);

  // Latido para que Render no cierre la conexión por inactividad
  const latido = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(latido);
    clientes.delete(res);
  });
}

function avisar(tipo) {
  for (const res of clientes) {
    res.write(`data: ${JSON.stringify({ tipo })}\n\n`);
  }
}

module.exports = { suscribir, avisar };