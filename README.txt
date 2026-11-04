GASTROERP
Sistema de gestión para restaurante
===================================

DESCRIPCIÓN
-----------
GastroERP es una aplicación web ligera para gestionar el flujo básico de un
restaurante: crear comandas en el punto de venta, preparar platillos en cocina
y dar seguimiento a pedidos, entregas y cobros.

VISTAS
------
- index.html: punto de venta para consultar el menú y enviar comandas.
- cocina.html: pantalla de cocina para iniciar y completar platillos.
- pedidos.html: seguimiento de pedidos, entrega, cobro e historial.

ARCHIVOS DEL PROYECTO
---------------------
- styles.css: estilos compartidos y diseño adaptable a móviles.
- script.js: lógica de las vistas, comandas y cobros de demostración.
- platillos.json: menú de ejemplo; puedes editar sus platillos y precios.
- README.txt: instrucciones y notas del proyecto.

REQUISITOS
----------
- Un navegador web moderno.
- Un servidor HTTP local para cargar platillos.json.
- Conexión a Internet para cargar jQuery desde el CDN de jQuery.

INICIAR CON VISUAL STUDIO CODE
------------------------------
1. Abre esta carpeta en Visual Studio Code.
2. Instala la extensión Live Server, si aún no la tienes.
3. Haz clic derecho en index.html y selecciona "Open with Live Server".
4. Se abrirá el punto de venta en el navegador.

INICIAR CON PYTHON
------------------
1. Abre una terminal en esta carpeta.
2. Ejecuta:

   python -m http.server 5500

3. Visita en el navegador:

   http://localhost:5500/index.html

Para detener el servidor, vuelve a la terminal y presiona Ctrl+C.
No abras los archivos HTML directamente con doble clic: el navegador puede
bloquear la carga del menú JSON cuando se usa el protocolo file://.

PROBAR EL FLUJO DE UNA COMANDA
------------------------------
1. En Punto de venta, agrega uno o más platillos.
2. Escribe el número de mesa y el nombre del mesero; pulsa "Enviar a cocina".
3. Abre Cocina en otra pestaña del mismo navegador.
4. Inicia la preparación de cada platillo y márcalo como listo al terminar.
5. En Pedidos y cobro, marca la comanda lista como entregada.
6. Pulsa "Cobrar" y completa el flujo de efectivo o tarjeta de prueba.

Los cambios se sincronizan entre pestañas del mismo navegador. Si no ves una
actualización, utiliza el botón "Actualizar" de la vista correspondiente.

DATOS Y ALMACENAMIENTO
----------------------
Los pedidos se guardan localmente en el navegador mediante localStorage, bajo
la clave "gastrova_pedidos". La clave se conserva para mantener los pedidos ya
guardados al actualizar el nombre visible de la aplicación.

Las vistas deben abrirse desde el mismo origen, navegador y perfil para
compartir los pedidos. Este almacenamiento es local: no sincroniza datos entre
dispositivos ni usuarios.

Para borrar los pedidos de prueba, abre la consola del navegador en el mismo
origen y ejecuta:

   localStorage.removeItem("gastrova_pedidos");

NOTAS
-----
- Es un prototipo de demostración; no procesa pagos bancarios reales.
- Los datos de tarjeta sirven únicamente para validación de prueba. El número
  y el CVV no se guardan ni se envían a un procesador de pagos.
- El total se calcula agregando IVA del 16% al subtotal.
- jQuery se carga desde un CDN; se requiere conexión a Internet para su carga.
