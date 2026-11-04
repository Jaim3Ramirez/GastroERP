GASTROVA - MODULO OPERATIVO

Contenido:
- index.html: vista del mesero / punto de venta.
- cocina.html: vista de cocina.
- pedidos.html: seguimiento, entrega y cobro.
- styles.css: estilos responsivos compartidos.
- script.js: lógica JavaScript y jQuery.
- platillos.json: menú de ejemplo.

COMO EJECUTAR

IMPORTANTE: no abras index.html directamente con doble clic. El navegador puede bloquear la lectura AJAX del archivo JSON.

Opción 1: Visual Studio Code
1. Abre la carpeta gastroerp-modulo-operativo.
2. Instala la extensión Live Server si no la tienes.
3. Haz clic derecho en index.html.
4. Selecciona "Open with Live Server".

Opción 2: Python
1. Abre una terminal dentro de esta carpeta.
2. Ejecuta:
   python -m http.server 5500
3. Abre en el navegador:
   http://localhost:5500/index.html

PRUEBA DEL FLUJO
1. En Punto de venta, agrega platillos, escribe mesa y mesero y envía a cocina.
2. Abre Cocina en otra pestaña y actualiza o espera la sincronización.
3. Inicia la preparación de cada platillo y después márcalos como listos.
4. En Pedidos y cobro, marca el pedido como entregado.
5. Pulsa Cobrar y prueba efectivo o tarjeta.

DATOS
Los pedidos se guardan en localStorage con la clave "gastrova_pedidos".
Las vistas deben abrirse en el mismo navegador y mismo perfil para compartir los datos.
Para borrar los datos de prueba, abre la consola del navegador y ejecuta:
localStorage.removeItem("gastrova_pedidos");

NOTAS
- Es un prototipo académico; no procesa pagos bancarios reales.
- El formulario de tarjeta valida datos de prueba, pero no almacena el número ni el CVV.
- localStorage no es una base de datos multiusuario: solo comparte información entre pestañas del mismo navegador.
- Para este ejercicio, el IVA se calcula como 16% adicional al subtotal.
