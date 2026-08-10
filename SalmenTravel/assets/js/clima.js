// Se obtiene del localStorage la lista de viajes guardados, con el JSON.pase que sirve para 
// convertir el string en array de objetos. Si no existe nada en el localStorage, se usa un
// array vacío. 
const viajes = JSON.parse(localStorage.getItem("viajes")) || [];
// Elemento que se muestra cuando NO hay viajes creados.
const noViajes = document.getElementById("no-viajes");
// Elemento que se muestra cuando SÍ hay viajes creados.
const conViajes = document.getElementById("con-viajes");

// Condición que indica que si no hay viajes creados, se muestra el mensaje de 
// "no hay viajes" y se oculta el contenido que muestra tarjetas de viajes.
if (viajes.length === 0) {
    noViajes.classList.remove("hidden");
    conViajes.classList.add("hidden");
    // Por el contrario, si hay al menos un viaje creado, se oculta el mensaje de 
    // "no hay viajes" y se muestran las tarjetas con los viajes creados.
} else {
    noViajes.classList.add("hidden");
    conViajes.classList.remove("hidden");
    pintarViajes(viajes);
}

// Función que sirve para pintar las tarjetas en base a lo que el usuario introduce en 
// el apartado de viajes, concretamente, coge la fecha de ida y vuelta, el lugar destino y
// la imagen de portada del viaje.
function pintarViajes(viajes) {
    // Variable que se usa como contenedor donde se van a insertar las tarjetas de viajes.
    const lista = document.getElementById("viajesLista");
    // Se limpia la lista, para evitar duplicados.
    lista.replaceChildren();

    // Se recorre el array de viajes.
    viajes.forEach(viaje => {

        // CONTENEDOR PRINCIPAL DE LA TARJETA
        const card = document.createElement("div");
        card.classList.add("viaje-card");

        // FECHAS DEL VIAJE
        const fechas = document.createElement("div");
        fechas.classList.add("viaje-fechas", "pointer");
        // Se muestran las fechas formateadas
        fechas.textContent = `${formatDate(viaje.fechaInicio)} - ${formatDate(viaje.fechaFin)}`;

        // CONTENEDOR INTERNO DE LA TARJETA
        const inner = document.createElement("div");
        inner.classList.add("viaje-card-inner", "pointer");

        // CONTENIDO PRINCIPAL
        const contenido = document.createElement("div");
        contenido.classList.add("viaje-contenido", "pointer");

        // IMAGEN DE PORTADA
        const flagWrapper = document.createElement("div");
        flagWrapper.classList.add("viaje-flag", "pointer");

        const img = document.createElement("img");
        // Si el viaje tiene imagen de portada, se usa la imagen correspondiente, por el contrario,
        // se muestra una imagen por defecto del logo de SalmenTravel+.
        img.src = viaje.portada || "assets/images/SalmenTravelLogoNaranja.png";
        img.alt = `Portada de ${viaje.destino}`;

        flagWrapper.appendChild(img);

        // DESTINO DEL VIAJE
        const titulo = document.createElement("h3");
        titulo.classList.add("viaje-destino", "pointer");
        titulo.textContent = viaje.destino;

        // ENSAMBLAJE DE LA TARJETA
        contenido.appendChild(flagWrapper);
        contenido.appendChild(titulo);

        inner.appendChild(contenido);

        card.appendChild(fechas);
        card.appendChild(inner);

        //Cuando se haga click sobre la tarjeta del clima de un destino en concreto,
        // se guardan los datos del destino en localStorage y se redirige a la página de detalle del clima.
        card.addEventListener("click", () => {
            localStorage.setItem(
                "destinoClima",
                JSON.stringify({
                    ciudad: viaje.destino,
                    pais: viaje.pais,
                    lat: viaje.lat,
                    lon: viaje.lon
                })
            );

            window.location.href = "clima-detalle.html";
        });
        // Se añade la tarjeta al contenedor principal.
        lista.appendChild(card);
    });
}

// Función que se encarga de convertir la fecha de ida y vuelta del usuario, en
// un formato legible ("x día de y mes de z año"), para que se pueda apreciar mejor cuando aparezca en la tarjeta en el apartado de clima.
function formatDate(date) {
    return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}