document.addEventListener("DOMContentLoaded", showTravels);

// Retorna el JSON de viajes en el LocalStorage, si no encuentra viajes retornamos un array vacío
function getTravels() {
  return JSON.parse(localStorage.getItem("viajes")) || [];
}

// Guarda el array de travels en el LocalStorage
function saveTravels(travels) {
  localStorage.setItem("viajes", JSON.stringify(travels));
}

// Convertimos la fecha en un formato legible DÍA/MES/AÑO
function formatDate(date) {
  return new Date(date).toLocaleDateString("es-ES");
}

// Función para borrar un viaje dependiendo de su id
function deleteTravel(id) {
  // Obtenemos todos los viajes
  let viajes = getTravels();
  // Buscamos el id dentro de los viajes
  viajes = viajes.filter((v) => v.id !== id);
  // Guardamos el array de viajes sin el viaje que acabamos de borrar
  saveTravels(viajes);
  // Renderizamos nuevamente los viajes
  showTravels();
}

// Con esta función al seleccionar un viaje con su id, utilizaremos el LocalStorage para luego mostrar sus detalles
// en la página de verViaje
function showParticularTravel(id) {
  localStorage.setItem("viajeSeleccionado", id);
  window.location.href = "viajes/verViaje.html";
}

// Vacíamos un contenedor
function clearElement(el) {
  el.replaceChildren();
}

// Mensaje que aparece al no encontrar viajes guardados en LocalStorage
function createEmptyMessage() {
  const p = document.createElement("p");
  p.className = "empty-text";
  p.textContent = "No hay viajes programados, ¡anímate a viajar y crea uno!";
  return p;
}

// Creamos un botoón de acción con una imagen
function createActionButton(className, imgSrc, alt) {
  const btn = document.createElement("button");
  btn.className = className;

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = alt;

  btn.appendChild(img);
  return btn;
}

// Al presionar el botón de editar viaje, se toma el viaje seleccionado para poder modificarlo en la pantalla de modificarViaje
function editTravel(id) {
  localStorage.setItem("viajeSeleccionado", String(id));
  window.location.href = "viajes/modificarViaje.html";
}

// Con esta función construimos una fila en la que podamos mostrar información del viaje
function createTravelRow(travel) {
  // Este será el contenedor principal
  const travelBox = document.createElement("div");
  travelBox.classList.add("travel-row");

  // Nombre del destino y la imagen de portada
  const destino = document.createElement("div");
  destino.className = "destino";

  const flag = document.createElement("img");
  flag.className = "flag";
  flag.src = travel.portada || "../assets/images/SalmenTravelLogoNaranja.png";
  flag.alt = `Portada de ${travel.destino}`;

  const strong = document.createElement("strong");
  strong.textContent = travel.destino;

  destino.append(flag, strong);

  // Fechas de inicio y de final del viaje
  const inicio = document.createElement("div");
  inicio.textContent = formatDate(travel.fechaInicio);

  const fin = document.createElement("div");
  fin.textContent = formatDate(travel.fechaFin);

  // Acciones de ver el clima, edición y borrado del viaje
  const acciones = document.createElement("div");
  acciones.className = "acciones";

  // Creamos los botones con la función createActionButton
  const weatherBtn = createActionButton("btn-weather", "assets/images/weather.svg", "Clima");
  const editBtn = createActionButton("btn-edit", "assets/images/pen.png", "Editar");
  const deleteBtn = createActionButton("btn-delete", "assets/images/trash.png", "Eliminar");

  // Si hacemos click a la fila el usuario se redirige a la página de verViaje con los detalles de dicho viaje
  travelBox.addEventListener("click", () => showParticularTravel(travel.id));

  // Si se hace click en el ícono del clima, primero se obtiene los datos del clima del destino 
  // y el usuario se redirige a la página de clima-detalle
  weatherBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    localStorage.setItem(
      "destinoClima",
      JSON.stringify({
        ciudad: travel.destino,
        pais: travel.pais,
        lat: travel.lat,
        lon: travel.lon
      })
    );

    window.location.href = "clima-detalle.html";
  });

  // Si se hace click en el botón de eliminar viaje, como es una acción destructiva, alertamos al usuario de esta modificación
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    // Alertamos al usuario de la acción que desea hacer
    const ok = await uiConfirm("¿Seguro que quieres eliminar este viaje?", {
      title: "Eliminar viaje",
      type: "warning",
      okText: "Sí, eliminar",
      cancelText: "Cancelar"
    });

    // Si cancela no se realiza nada
    if (!ok) return;

    // Si confirma se elimina el viaje
    deleteTravel(travel.id);
  });

  // Si hacemos click en el botón del lápiz, se procede a realizar la función de editTravel
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    editTravel(travel.id);
  });

  // Se añaden los tres botones
  acciones.append(weatherBtn, editBtn, deleteBtn);


  // Montamos la fila total
  travelBox.append(destino, inicio, fin, acciones);

  return travelBox;
}

// Mediante esta función renderizamos todos los viajes dentro del container InfoContenido
function showTravels() {
  const container = document.querySelector(".InfoContenido");

  // Se carga los viajes
  const travels = getTravels();

  // Limpiamos el contenedor
  clearElement(container);

  // Si no hay viajes deendiendo de la longitud del array, mostramos el mensaje de viajes vacíos añadiéndolo al container
  if (travels.length === 0) {
    container.appendChild(createEmptyMessage());
    return;
  }

  // Para cada viaje renderizamos una fila con su información básica
  travels.forEach((travel) => {
    container.appendChild(createTravelRow(travel));
  });
}
