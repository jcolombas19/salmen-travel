// Clave personal de OpenWeather necesaria para poder hacer peticiones a la API.
const API_KEY = "PON_AQUI_TU_API_KEY";

// Como OpenWeather devuelve códigos de icono, se ha decidido asignarlos a cada uno
// de los iconos creados para seguir la temática de la web de SalmenTravel+.
const ICON_MAP = {
    "01d": "sol.png",
    "01n": "sol.png",
    "02d": "sol_nubes.png",
    "02n": "sol_nubes.png",
    "03d": "nubes.png",
    "03n": "nubes.png",
    "04d": "nubes.png",
    "04n": "nubes.png",
    "09d": "lluvia.png",
    "09n": "lluvia.png",
    "10d": "lluvia.png",
    "10n": "lluvia.png",
    "11d": "tormenta.png",
    "11n": "tormenta.png",
    "13d": "nieve.png",
    "13n": "nieve.png"
};

// Se obtiene del localStorage el destino seleccionado por el usuario 
// previamente desde la pantalla de clima general.
const destinoGuardado = JSON.parse(
    localStorage.getItem("destinoClima")
);

// Si no existe ningún destino guardado, se redirige al usuario a la 
// página principal del clima.
if (!destinoGuardado) {
    window.location.href = "clima.html";
}

// Se extraen los atributos del objeto destinoGuardado, para obtener el 
// lugar destino del usuario.
const ciudad = destinoGuardado.ciudad;
const pais = destinoGuardado.pais;
const lat = destinoGuardado.lat;
const lon = destinoGuardado.lon;

// Se selecciona el elemento donde se mostrará el nombre de la ciudad
const ciudadTitulo = document.querySelector(".ciudad-nombre");

// Condición que indica que si el elemento anterior existe, se mostrará
// la ciudad y el país.
if (ciudadTitulo) {
    ciudadTitulo.textContent = `${ciudad}, ${pais}`;
}

// Condición que indica que si existen coordenadas válidas, se obtienen
// el clima de hoy y el clima de los próximos días.
if (lat && lon) {
    obtenerClimaHoy(lat, lon);
    obtenerProximosDias(lat, lon);
}

// Función que hace de petición a la API para obtener el clima actual
function obtenerClimaHoy(lat, lon) {
    fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`
    )
        .then(res => res.json())   // La respuesta se convierte a JSON. 
        .then(pintarClimaHoy)      // Se envían los datos a la función los pinta.
        .catch(console.error);     // Se captura cualquier error.
}

// Función que pinta en pantalla el clima actual.
function pintarClimaHoy(data) {
    // Se seleccionan los elementos del DOM donde se mostrará la información.
    const icono = document.querySelector(".hoy-icon");
    const temperatura = document.querySelector(".hoy-temp");
    const estado = document.querySelector(".hoy-estado");
    const fecha = document.querySelector(".hoy-fecha");

    // Se obtienen datos relevantes de la API.
    const iconCode = data.weather[0].icon;
    const descripcion = data.weather[0].description;

    // Se obtienen temperaturas mínima y máxima redondeadas.
    const min = Math.round(data.main.temp_min);
    const max = Math.round(data.main.temp_max);

    // Se busca el icono personalizadp correspondiente
    const iconFile = ICON_MAP[iconCode] || "nubes.png";

    // Se asigna el icono y texto alternativo.
    icono.src = `assets/images/iconos/${iconFile}`;
    icono.alt = descripcion;

    // Se muestra la temperatura.
    temperatura.textContent = `${min}° - ${max}°`;
    
    // Se muestra el estado del clima con la primera letra en mayúscula.
    estado.textContent = capitalizar(descripcion);

    // Se genera la fecha actual en formato legible.
    const hoy = new Date();
    const fechaFormateada = hoy.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    // Se muestra la fecha capitalizada.
    fecha.textContent = capitalizar(fechaFormateada);
}

// Función que se encarga de obtener la previsión meteorológica de los próximos días.
function obtenerProximosDias(lat, lon) {
    fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`
    )
        .then(res => res.json())    // La respuesta se convierte a JSON. 
        .then(pintarProximosDias)   // Se envían los datos a la función los pinta.
        .catch(console.error);      // Se captura cualquier error.
}

// Función que se encarga de pintar las tarjetas de los próximos días
function pintarProximosDias(data) {

    // Contenedor donde se añadirán las tarjetas.
    const container = document.querySelector(".proximos-content");
    // Se limpia el contenido previo.
    container.replaceChildren();

    const hoyTexto = new Date().toDateString();

    // Objeto donde se agruparán las predicciones por día
    const diasMap = {};

    // Bucle que se encarga de recorrer la lista de predicciones (cada 3 horas)
    for (const item of data.list) {
        const fecha = new Date(item.dt * 1000);
        const diaTexto = fecha.toDateString();

        // Condición que excluye el día de hoy
        if (diaTexto === hoyTexto) continue;

        // Si el día aún no existe en el objeto, se inicializa
        if (!diasMap[diaTexto]) {
            diasMap[diaTexto] = {
                fecha,
                tempsMin: [],
                tempsMax: [],
                weather: item.weather[0]
            };
        }

        // Se almacenan las temperaturas mínimas y máximas de cada franja horaria
        diasMap[diaTexto].tempsMin.push(item.main.temp_min);
        diasMap[diaTexto].tempsMax.push(item.main.temp_max);
    }

    // Se convierten los días agrupados en un array y se seleccionan solo 4 días
    const dias = Object.values(diasMap).slice(0, 4);

    // Se crea una tarjeta por cada día seleccionado
    dias.forEach(dia => {

        const nombreDia = capitalizar(
            dia.fecha.toLocaleDateString("es-ES", { weekday: "long" })
        );

        const descripcion = dia.weather.description;
        const iconFile = ICON_MAP[dia.weather.icon] || "nubes.png";

        // Se calculan la temperatura mínima y máxima reales del día.
        const min = Math.round(Math.min(...dia.tempsMin));
        const max = Math.round(Math.max(...dia.tempsMax));

        // Tarjeta principal
        const card = document.createElement("div");
        card.classList.add("dia-card");

        // Etiqueta del día
        const label = document.createElement("div");
        label.classList.add("dia-label");
        label.textContent = nombreDia;

        // Contenido interno de la tarjeta
        const inner = document.createElement("div");
        inner.classList.add("dia-card-inner");

        // Icono del clima
        const img = document.createElement("img");
        img.src = `assets/images/iconos/${iconFile}`;
        img.alt = descripcion;

        // Estado del clima
        const estado = document.createElement("p");
        estado.classList.add("dia-estado");
        estado.textContent = capitalizar(descripcion);

        // Temperaturas
        const temp = document.createElement("p");
        temp.classList.add("dia-temp");
        temp.textContent = `${min}° - ${max}°`;

        // Ensamblaje de la tarjeta
        inner.appendChild(img);
        inner.appendChild(estado);
        inner.appendChild(temp);

        card.appendChild(label);
        card.appendChild(inner);
        container.appendChild(card);
    });
}

// Función que se usa para hacer que la primera letra de un string esté en mayúscula.
function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
