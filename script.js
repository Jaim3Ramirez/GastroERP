const CLAVE_PEDIDOS = "gastrova_pedidos";
const IVA = 0.16;
let menuPlatillos = [];
let carrito = [];
let pedidoEnCobro = null;
let metodoPago = "efectivo";

function obtenerPedidos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS)) || [];
  } catch (error) {
    return [];
  }
}

function guardarPedidos(pedidos) {
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
}

function formatoMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[caracter]);
}

function calcularImportes(items) {
  const subtotal = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  const iva = subtotal * IVA;
  return { subtotal, iva, total: subtotal + iva };
}

function validarMenu(data) {
  if (!Array.isArray(data) || !data.length) {
    return "El menú no contiene platillos. Revisa platillos.json.";
  }

  const ids = new Set();
  for (const platillo of data) {
    if (
      !Number.isInteger(platillo.id) || ids.has(platillo.id) ||
      typeof platillo.nombre !== "string" || !platillo.nombre.trim() ||
      typeof platillo.descripcion !== "string" || !platillo.descripcion.trim() ||
      typeof platillo.categoria !== "string" || !platillo.categoria.trim() ||
      !Number.isFinite(platillo.precio) || platillo.precio <= 0 ||
      !Number.isFinite(platillo.tiempoEstimado) || platillo.tiempoEstimado <= 0
    ) {
      return "Hay datos incompletos o inválidos en un platillo de platillos.json.";
    }
    ids.add(platillo.id);
  }
  return "";
}

function normalizarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function cargarMenu() {
  $.getJSON("platillos.json")
    .done(data => {
      const error = validarMenu(data);
      if (error) {
        menuPlatillos = [];
        $("#menu").html(`<p class="empty">${escaparHTML(error)}</p>`);
        return;
      }
      menuPlatillos = data;
      renderizarMenu(menuPlatillos);
    })
    .fail(() => {
      $("#menu").html('<p class="empty">No se pudo cargar platillos.json. Ejecuta el proyecto con un servidor local.</p>');
    });
}

function renderizarMenu(platillos) {
  const html = platillos.map(platillo => `
    <article class="menu-card">
      <span class="category">${escaparHTML(platillo.categoria)}</span>
      <h3>${escaparHTML(platillo.nombre)}</h3>
      <p class="menu-description">${escaparHTML(platillo.descripcion)}</p>
      <p class="prep-time">${platillo.tiempoEstimado} min de preparación</p>
      <p class="price">${formatoMoneda(platillo.precio)}</p>
      <button class="btn btn-primary agregar-platillo" data-id="${platillo.id}">Agregar</button>
    </article>
  `).join("");
  $("#menu").html(html || '<p class="empty">No se encontraron platillos.</p>');
}

function renderizarCarrito() {
  if (!carrito.length) {
    $("#carrito").html('<p class="empty">Aún no agregas platillos.</p>');
  } else {
    const html = carrito.map(item => `
      <div class="cart-item">
        <div><strong>${escaparHTML(item.nombre)}</strong><small>${formatoMoneda(item.precio)} c/u</small>
          <button class="remove-item eliminar-platillo" data-id="${item.id}">Eliminar</button>
        </div>
        <div class="quantity">
          <button class="disminuir" data-id="${item.id}" aria-label="Disminuir">−</button>
          <strong>${item.cantidad}</strong>
          <button class="aumentar" data-id="${item.id}" aria-label="Aumentar">+</button>
        </div>
      </div>
    `).join("");
    $("#carrito").html(html);
  }
  const importes = calcularImportes(carrito);
  $("#subtotal").text(formatoMoneda(importes.subtotal));
  $("#iva").text(formatoMoneda(importes.iva));
  $("#total").text(formatoMoneda(importes.total));
  const cantidad = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  $("#cantidadCarrito").text(`${cantidad} ${cantidad === 1 ? "platillo" : "platillos"}`);
}

function iniciarMesero() {
  cargarMenu();
  renderizarCarrito();

  $("#buscarPlatillo").on("input", function () {
    const busqueda = normalizarTexto($(this).val().trim());
    renderizarMenu(menuPlatillos.filter(item =>
      normalizarTexto(item.nombre).includes(busqueda) ||
      normalizarTexto(item.descripcion).includes(busqueda) ||
      normalizarTexto(item.categoria).includes(busqueda)
    ));
  });

  $(document).on("click", ".agregar-platillo", function () {
    const id = Number($(this).data("id"));
    const platillo = menuPlatillos.find(item => item.id === id);
    if (!platillo) return;
    const existente = carrito.find(item => item.id === id);
    carrito = existente
      ? carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad + 1 } : { ...item })
      : [...carrito, { ...platillo, cantidad: 1 }];
    renderizarCarrito();
  });

  $(document).on("click", ".aumentar, .disminuir", function () {
    const id = Number($(this).data("id"));
    const cambio = $(this).hasClass("aumentar") ? 1 : -1;
    carrito = carrito
      .map(item => item.id === id ? { ...item, cantidad: item.cantidad + cambio } : { ...item })
      .filter(item => item.cantidad > 0);
    renderizarCarrito();
  });

  $(document).on("click", ".eliminar-platillo", function () {
    const id = Number($(this).data("id"));
    carrito = carrito.filter(item => item.id !== id);
    renderizarCarrito();
  });

  $("#formPedido").on("submit", function (event) {
    event.preventDefault();
    if (!carrito.length) {
      $("#mensajePedido").text("Agrega al menos un platillo antes de enviar.");
      return;
    }
    const mesa = Number($("#mesa").val());
    const mesero = $("#mesero").val().trim();
    if (!mesa || mesa < 1 || !mesero) return;

    const importes = calcularImportes(carrito);
    const pedidos = obtenerPedidos();
    const nuevoPedido = {
      id: Date.now(),
      mesa,
      mesero,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      items: carrito.map(item => ({ ...item, estado: "pendiente" })),
      subtotal: importes.subtotal,
      iva: importes.iva,
      total: importes.total
    };
    pedidos.push(nuevoPedido);
    guardarPedidos(pedidos);
    carrito = [];
    renderizarCarrito();
    this.reset();
    $("#mensajePedido").text(`Comanda #${nuevoPedido.id.toString().slice(-6)} enviada a cocina.`);
  });
}

function actualizarEstadoItem(idPedido, idPlatillo, nuevoEstado) {
  const pedidos = obtenerPedidos().map(pedido => {
    if (pedido.id !== idPedido) return pedido;
    const items = pedido.items.map(item =>
      item.id === idPlatillo ? { ...item, estado: nuevoEstado } : item
    );
    const todosListos = items.every(item => item.estado === "listo");
    const algunoPreparando = items.some(item => item.estado === "preparando");
    const estado = todosListos ? "listo" : (algunoPreparando ? "preparando" : "pendiente");
    return { ...pedido, items, estado };
  });
  guardarPedidos(pedidos);
}

function renderizarCocina() {
  const pedidos = obtenerPedidos().filter(pedido =>
    ["pendiente", "preparando"].includes(pedido.estado)
  );
  if (!pedidos.length) {
    $("#listaCocina").html('<div class="panel empty">No hay comandas pendientes de preparación.</div>');
    return;
  }

  const html = pedidos.map(pedido => {
    const items = pedido.items.map(item => {
      let boton = "";
      if (item.estado === "pendiente") {
        boton = `<button class="btn btn-primary iniciar-item" data-pedido="${pedido.id}" data-item="${item.id}">Iniciar preparación</button>`;
      } else if (item.estado === "preparando") {
        boton = `<button class="btn btn-primary listo-item" data-pedido="${pedido.id}" data-item="${item.id}">Marcar listo</button>`;
      } else {
        boton = '<span class="badge listo">Listo</span>';
      }
      const estadoTexto = item.estado === "preparando"
        ? `Preparando · ${item.tiempoEstimado} ${item.tiempoEstimado === 1 ? "minuto estimado" : "minutos estimados"}`
        : item.estado === "listo" ? "Platillo terminado" : "Pendiente";
      return `<div class="kitchen-item"><div><strong>${item.cantidad} × ${escaparHTML(item.nombre)}</strong><small>${estadoTexto}</small></div>${boton}</div>`;
    }).join("");
    return `<article class="kitchen-card ${pedido.estado === "preparando" ? "preparing" : ""}">
      <div class="section-heading"><h2>Mesa ${escaparHTML(pedido.mesa)}</h2><span class="badge ${pedido.estado}">${textoEstado(pedido.estado)}</span></div>
      <p class="order-meta">Comanda #${pedido.id.toString().slice(-6)} · Mesero: ${escaparHTML(pedido.mesero)}</p>
      ${items}
    </article>`;
  }).join("");
  $("#listaCocina").html(html);
}

function iniciarCocina() {
  renderizarCocina();
  $("#actualizarCocina").on("click", renderizarCocina);
  $(document).on("click", ".iniciar-item", function () {
    actualizarEstadoItem(Number($(this).data("pedido")), Number($(this).data("item")), "preparando");
    renderizarCocina();
  });
  $(document).on("click", ".listo-item", function () {
    actualizarEstadoItem(Number($(this).data("pedido")), Number($(this).data("item")), "listo");
    renderizarCocina();
  });
}

function textoEstado(estado) {
  return ({ pendiente: "Pendiente", preparando: "Preparando", listo: "Listo", entregado: "Entregado", pagado: "Pagado" })[estado] || estado;
}

function renderizarPedidos() {
  const pedidos = obtenerPedidos();
  const activos = pedidos.filter(pedido => pedido.estado !== "pagado");
  if (!activos.length) {
    $("#tablaPedidos").html('<tr><td colspan="7" class="empty">No hay pedidos activos.</td></tr>');
  } else {
    const html = activos.map(pedido => {
      let accion = '<span class="muted">En proceso</span>';
      if (pedido.estado === "listo") {
        accion = `<button class="btn btn-primary entregar-pedido" data-id="${pedido.id}">Marcar entregado</button>`;
      } else if (pedido.estado === "entregado") {
        accion = `<button class="btn btn-primary cobrar-pedido" data-id="${pedido.id}">Cobrar</button>`;
      }
      return `<tr>
        <td>#${pedido.id.toString().slice(-6)}</td>
        <td>${escaparHTML(pedido.mesa)}</td>
        <td>${escaparHTML(pedido.mesero)}</td>
        <td>${new Date(pedido.fecha).toLocaleString("es-MX")}</td>
        <td><span class="badge ${pedido.estado}">${textoEstado(pedido.estado)}</span></td>
        <td>${formatoMoneda(pedido.total)}</td>
        <td>${accion}</td>
      </tr>`;
    }).join("");
    $("#tablaPedidos").html(html);
  }

  const pagados = pedidos.filter(pedido => pedido.estado === "pagado");
  if (!pagados.length) {
    $("#historialPagados").text("Sin pedidos pagados.");
  } else {
    $("#historialPagados").html(`<div class="table-wrap"><table><thead><tr><th>Comanda</th><th>Mesa</th><th>Total</th><th>Método</th></tr></thead><tbody>${
      pagados.map(pedido => `<tr><td>#${pedido.id.toString().slice(-6)}</td><td>${escaparHTML(pedido.mesa)}</td><td>${formatoMoneda(pedido.total)}</td><td>${escaparHTML(pedido.metodoPago || "")}</td></tr>`).join("")
    }</tbody></table></div>`);
  }
}

function abrirCobro(id) {
  pedidoEnCobro = obtenerPedidos().find(pedido => pedido.id === id);
  if (!pedidoEnCobro) return;
  $("#numeroComanda").text(`#${pedidoEnCobro.id.toString().slice(-6)}`);
  $("#totalCobro").text(formatoMoneda(pedidoEnCobro.total));
  $("#montoRecibido").val("");
  $("#cambio").text(formatoMoneda(0));
  $("#mensajeCobro").text("");
  $("#modalCobro").addClass("open").attr("aria-hidden", "false");
  seleccionarMetodo("efectivo");
}

function cerrarCobro() {
  $("#modalCobro").removeClass("open").attr("aria-hidden", "true");
  pedidoEnCobro = null;
}

function seleccionarMetodo(metodo) {
  metodoPago = metodo;
  $(".payment-tab").removeClass("active");
  $(`.payment-tab[data-method="${metodo}"]`).addClass("active");
  $("#formEfectivo").toggleClass("hidden", metodo !== "efectivo");
  $("#formTarjeta").toggleClass("hidden", metodo !== "tarjeta");
  $("#mensajeCobro").text("");
}

function finalizarPago(metodo) {
  if (!pedidoEnCobro) return;
  const pedidos = obtenerPedidos().map(pedido =>
    pedido.id === pedidoEnCobro.id
      ? { ...pedido, estado: "pagado", metodoPago: metodo, fechaPago: new Date().toISOString() }
      : pedido
  );
  guardarPedidos(pedidos);
  cerrarCobro();
  renderizarPedidos();
}

function iniciarPedidos() {
  renderizarPedidos();
  $("#actualizarPedidos").on("click", renderizarPedidos);

  $(document).on("click", ".entregar-pedido", function () {
    const id = Number($(this).data("id"));
    const pedidos = obtenerPedidos().map(pedido =>
      pedido.id === id ? { ...pedido, estado: "entregado" } : pedido
    );
    guardarPedidos(pedidos);
    renderizarPedidos();
  });

  $(document).on("click", ".cobrar-pedido", function () {
    abrirCobro(Number($(this).data("id")));
  });

  $(".payment-tab").on("click", function () {
    seleccionarMetodo($(this).data("method"));
  });

  $("#montoRecibido").on("input", function () {
    const recibido = Number($(this).val()) || 0;
    const cambio = pedidoEnCobro ? recibido - pedidoEnCobro.total : 0;
    $("#cambio").text(formatoMoneda(Math.max(0, cambio)));
  });

  $("#formEfectivo").on("submit", function (event) {
    event.preventDefault();
    const recibido = Number($("#montoRecibido").val());
    if (!Number.isFinite(recibido) || recibido < pedidoEnCobro.total) {
      $("#mensajeCobro").text("El monto recibido debe ser igual o mayor al total.");
      return;
    }
    finalizarPago("Efectivo");
  });

  $("#formTarjeta").on("submit", function (event) {
    event.preventDefault();
    const numero = $("#numeroTarjeta").val().replace(/\s/g, "");
    const nombre = $("#nombreTarjeta").val().trim();
    const vencimiento = $("#vencimiento").val().trim();
    const cvv = $("#cvv").val().trim();
    if (!numero || !nombre || !vencimiento || !cvv) {
      $("#mensajeCobro").text("Completa todos los campos de la tarjeta.");
      return;
    }
    if (!/^\d{13,19}$/.test(numero) || !/^\d{2}\/\d{2}$/.test(vencimiento) || !/^\d{3,4}$/.test(cvv)) {
      $("#mensajeCobro").text("Verifica el número de tarjeta, vencimiento (MM/AA) y CVV.");
      return;
    }
    finalizarPago("Tarjeta");
  });

  $("#cerrarModal").on("click", cerrarCobro);
  $("#modalCobro").on("click", function (event) {
    if (event.target === this) cerrarCobro();
  });
}

$(function () {
  const vista = $("body").data("view");
  if (vista === "mesero") iniciarMesero();
  if (vista === "cocina") iniciarCocina();
  if (vista === "pedidos") iniciarPedidos();

  // Sincroniza las vistas cuando otra pestaña modifica localStorage.
  window.addEventListener("storage", function (event) {
    if (event.key !== CLAVE_PEDIDOS) return;
    if (vista === "cocina") renderizarCocina();
    if (vista === "pedidos") renderizarPedidos();
  });
});