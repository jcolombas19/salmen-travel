const STORAGE_KEY = "viajes"; // Clave para guardar el array de viajes en LocalStorage
const API_KEY = "PON_AQUI_TU_API_KEY"; // OpenWeather API key
let resultadosGeo = []; // Guardamos los resultados de la consulta de la API en este array

// Retorna el JSON de viajes en el LocalStorage, si no encuentra viajes retornamos un array vacío
function getTravels() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

// Se guarda el array de viajes en el LocalStorage
function saveTravels(travels) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(travels));
    return true;
  } catch (error) {
    if (error.name === "QuotaExceededError") {
      // Si se guarda información con mucho peso en memoria, le avisamos al usuario que no puede guardar el viaje
      uiAlert(
        "No hay suficiente espacio para guardar el viaje.\n\n" +
        "La imagen de portada ocupa demasiado espacio.\n" +
        "Por favor, prueba con otra imagen.",
        { title: "Sin espacio", type: "error" }
      );
    } else {
      // Cualquier error inesperado al intentar guardar el viaje
      uiAlert("Ha ocurrido un error inesperado al guardar el viaje.", {
        title: "Error",
        type: "error",
      });
    }
    return false;
  }
}


const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// State es la memoria de lo que el usuario va rellenando en el formulario
// step indica en qué paso del formulario está y lo qué se ve por pantalla:
// 1) Rellenar el lugar del destino y las fechas del viaje
// 2) Rellenar las actividades de los días de viaje
// 3) Seleccionar una imagen como portada de viaje
const state = {
  step: 1,
  trip: {
    destination: "",
    country: "",
    startDate: null,
    endDate: null,
    days: [],
    activities: {},
    coverImage: null,
    coverImageDataURL: null,
  },
};

/* Fechas */

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

// Convierte date en una clave estable para indexar las actividades por día
const toKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Para mostrar el día lo ponemos en un formato mucho más visual "(Dia de la semana) DÍA/MES/AÑO"
const formatDayLabel = (date) => {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${days[date.getDay()]} ${pad(date.getDate())}/${pad(
    date.getMonth() + 1
  )}/${date.getFullYear()}`;
};

// Se genera el rango de días entre startDate y endDate
// Se retorna también un array de objetos donde guardaremos los objetos que generen las arrowFunctions anteriores 
function getDateRange(startDate, endDate) {
  const result = [];

  // Clonamos las fechas
  const current = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  // Bucle que recorre de día en día
  while (current <= end) {
    result.push({
      key: toKey(current),
      label: formatDayLabel(current),
      date: new Date(current),
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// Normalizamos una URL colocando https://
function normalizeUrl(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  if (/^www\./i.test(u)) return "https://" + u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[\w-]+\.[\w.-]+(\/.*)?$/i.test(u)) return "https://" + u;
  return null;
}

// Convertimos un texto en un DocumentFragment donde las URLs se transforman en links
function linkifyToFragment(text) {
  const frag = document.createDocumentFragment();
  const str = String(text || "");

  // Dominio de la ruta
  const urlRegex = /((https?:\/\/|www\.)[^\s]+|[\w-]+\.[\w.-]+\/[^\s]*)/gi;

  let lastIndex = 0;
  let match;

  // Recorremos el texto buscando URLs
  while ((match = urlRegex.exec(str)) !== null) {
    const start = match.index;
    const raw = match[0];

    // Añade el texto que hay antes del match
    if (start > lastIndex) {
      frag.appendChild(document.createTextNode(str.slice(lastIndex, start)));
    }

    // Normaliza para poder construir un href real
    const href = normalizeUrl(raw);

    // Si parece un URL, lo convertimos en un enlace
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = raw;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "activity-link";
      frag.appendChild(a);
    } else {
      // De lo contrario, lo dejamos como texto
      frag.appendChild(document.createTextNode(raw));
    }

    // Movemos el puntero del texto
    lastIndex = start + raw.length;
  }

  // Añade el resto del texto después del último match
  if (lastIndex < str.length) {
    frag.appendChild(document.createTextNode(str.slice(lastIndex)));
  }

  return frag;
}

// Cambia el estado del formulario dependiendo del paso en el que esté el usuario
function showStep(step) {
  state.step = step;

  // Ponemos el estado actual oculto
  $$(".step").forEach((el) => el.classList.add("hidden"));

  // Quitamos en el paso siguiente el oculto para mostrarlo
  $$(".step-" + step).forEach((el) => el.classList.remove("hidden"));

  const title = document.getElementById("pageTitle");

  // Dependiendo del paso cambia el título de la página
  if (step === 1) title.textContent = "Prepara tu viaje";
  else if (step === 2) title.textContent = "Añade actividades en tu viaje";
  else if (step === 3) title.textContent = "Añade tu portada";

  // Cambiamos también el texto del botón de volver atrás si el paso es o no es el primero
  const buttonBackText = document.getElementById("buttonBackText");
  buttonBackText.textContent =
    step === 1 ? "Volver a tus viajes" : "Volver a la página anterior";
}

// Cada vez que el usuario sale del input destino (blur), intentamos buscar la ciudad
$("#destino").addEventListener("blur", buscarCiudad);

// Consultamos a la API de geocoding
async function buscarCiudad() {
  // Obtenemos el nombre de la ciudad
  const ciudad = $("#destino").value.trim();
  const select = $("#paisDestino");

  // Si está vacío el input, no se hace nada
  if (!ciudad) return;

  // Limpiamos opciones existentes
  select.replaceChildren();

  // Creamos la opción de "cargando"
  const loadingOption = document.createElement("option");
  loadingOption.value = "";
  loadingOption.textContent = "Buscando países...";
  loadingOption.disabled = true;
  loadingOption.selected = true;

  // La añadimos al select
  select.appendChild(loadingOption);

  // Bloqueamos el select mientras carga
  select.disabled = true;

  // Petición a OpenWeather con límite de 10 resultados
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${ciudad}&limit=10&appid=${API_KEY}`
  );

  // Guardamos los resultados para luego validar ciudad/pais y sacar lat/lon
  resultadosGeo = await res.json();

  // Rellenamos el select con países posibles
  rellenarSelectPaises(resultadosGeo);
}

// Construye el autocompletado para rellenar el select de países
function rellenarSelectPaises(data) {
  const select = $("#paisDestino");
  select.replaceChildren();
  select.disabled = false;

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecciona un país";
  select.appendChild(defaultOption);

  // Empleamos Map para no repetir los códigos de los países
  const unique = new Map();
  data.forEach((item) => {
    if (!unique.has(item.country)) unique.set(item.country, item);
  });

  // Rellenamos el select con opciones de los distintos países que se hayan encontrado
  unique.forEach((item, code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = item.state
      ? `${item.name}, ${item.state} (${code})`
      : `${item.name} (${code})`;
    select.appendChild(option);
  });
}

// Validamos el primer paso del formulario verificando los siguientes criterios
async function validateStepOne() {
  const destination = $("#destino").value.trim();
  const countryCode = $("#paisDestino").value;
  const startDate = new Date($("#fechaIda").value);
  const endDate = new Date($("#fechaVuelta").value);

  // Validamos si todos los datos están completados
  if (!destination || !countryCode || isNaN(startDate) || isNaN(endDate)) {
    // Si no es así alertamos al usuario que necesita completar todos los datos
    await uiAlert("Rellena correctamente todos los campos.", {
      title: "Faltan datos",
      type: "warning",
    });
    return false;
  }

  // Verificamos que la fecha de vuelta no sea antes que la de ida
  if (endDate < startDate) {
    // Alertamos al usuario sobre el error
    await uiAlert("La fecha de vuelta no puede ser anterior.", {
      title: "Fechas inválidas",
      type: "warning",
    });
    return false;
  }

  // Verificamos que el nombre del destino introducido por el usuario es igual a la encontrada por la API
  const seleccion = resultadosGeo.find((item) => item.country === countryCode);
  // Si no es igual, se alertA al usuario
  if (!seleccion) {
    await uiAlert("La ciudad no coincide con el país seleccionado.", {
      title: "Revisa el país",
      type: "warning",
    });
    return false;
  }

  // Se actualiza el estado del viaje
  state.trip.destination = destination;
  state.trip.country = countryCode;
  state.trip.lat = seleccion.lat;
  state.trip.lon = seleccion.lon;
  state.trip.startDate = startDate;
  state.trip.endDate = endDate;

  // Generamos los días de viaje
  state.trip.days = getDateRange(startDate, endDate);
  state.trip.activities = {};

  // Inicializar actividades, un array vacío por cada día
  state.trip.days.forEach((day) => {
    state.trip.activities[day.key] = [];
  });

  // Rellenar el select de sías para el Paso 2 del formulario
  const select = $("#diaSelect");
  select.replaceChildren();

  state.trip.days.forEach((day, i) => {
    const option = document.createElement("option");
    option.value = day.key;
    option.textContent = `Día ${i + 1}: ${day.label}`;
    select.appendChild(option);
  });

  return true;
}

// Se renderiza la lista de actividades según el día seleccionado
function renderActivitiesList() {

  // Obtenemos la key del día seleccionado
  const key = $("#diaSelect").value;
  const list = $("#activitiesList");
  const emptyText = $("#emptyActivities");

  // Limpiamos la lista
  list.replaceChildren();

  const activities = state.trip.activities[key] ?? [];

  // Si no hay actividades, desplegamos el mensaje que tenemos en el html "No hay actividades para este día."
  if (!activities.length) {
    emptyText.style.display = "block";
    return;
  }

  // Si hay actividades, ocultamos mensaje
  emptyText.style.display = "none";

  // Por cada actividad renderizamos sus respectivos bloques
  activities.forEach((activity) => {
    const li = document.createElement("li");
    li.className = "item-actividad";

    const left = document.createElement("span");

    // El nombre lo metemos en strong y validamos si es un link con la función linkifyToFragment
    const strong = document.createElement("strong");
    strong.appendChild(linkifyToFragment(activity.name));

    // Luego colocamos en un texto pequeño la hora de inicio y final de una actividad
    const timeText =
      activity.start && activity.end ? ` (${activity.start} - ${activity.end})` : "";

    const timeSpan = document.createElement("span");
    timeSpan.className = "text-small";
    timeSpan.textContent = timeText;

    left.append(strong, timeSpan);

    // También creamos el botón para eliminar una actividad
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = activity.id;

    const img = document.createElement("img");
    img.src = "../assets/images/trash.png";
    img.alt = "Eliminar";
    btn.appendChild(img);

    // Listener para borrar la actividad al hacer click sobre el ícono de la papelera
    btn.addEventListener("click", () => removeActivity(key, activity.id));

    li.append(left, btn);
    list.appendChild(li);
  });
}

// Se elimina una actividad brindándole el día y el id de la actividad
function removeActivity(dayKey, activityId) {
  state.trip.activities[dayKey] = state.trip.activities[dayKey].filter(
    (activity) => activity.id !== activityId
  );
  // Renderizamos otra vez las actividades
  renderActivitiesList();
}

// Ayudar al usuario para mostrar una hora por defecto en el input de hora (inicio o fin) de una actividad
function setDefaultTime(selector, hour) {
  const el = $(selector);
  if (!el) return;
  if (!el.value) el.value = hour;
}


// Añadir una actividad al día seleccionado
async function addActivity() {
  const name = $("#activityName").value.trim();
  const start = $("#horaInicio").value;
  const end = $("#horaFin").value;
  const key = $("#diaSelect").value;

  // Evitamos actividades vacías
  if (!name) {
    // Alertamos al usuario que debe escribir el nombre de la actividad
    await uiAlert("Escribe el nombre de la actividad.", {
      title: "Campo obligatorio",
      type: "warning",
    });
    return;
  }

  // Si la hora final es antes de la hora de inicio, también le alertamos al usuario
  if (start && end && start >= end) {
    await uiAlert("La hora de final debe ser posterior a la de inicio.", {
      title: "Horas inválidas",
      type: "warning",
    });
    return;
  }

  // Si se encuentra una actividad con el mismo rango de horas, no se puede añadir en el mismo día
  const activities = state.trip.activities[key] ?? [];

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];

    // Se envía la alerta al usuario que no puede añadir dicha actividad
    if (activity.start === start && activity.end === end) {
      await uiAlert(
        "Las horas de esta actividad no pueden ser las mismas que las de otra actividad.",
        {
          title: "Horas inválidas",
          type: "warning",
        }
      );
      return;
    }
  }

  // Construimos la actividad con los datos que proporciona el usuario
  const activity = {
    id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
    name,
    start,
    end,
  };

  // Lo metemos en el array de actividades del día
  state.trip.activities[key].push(activity);

  // Limpiamos los inputs y reestablecemos la hora por default
  $("#activityName").value = "";
  $("#horaInicio").value = "";
  $("#horaFin").value = "";
  setDefaultTime("#horaInicio", "09:00");
  setDefaultTime("#horaFin", "10:00");

  // Renderizamos nuevamente las actividades
  renderActivitiesList();
}

// Esta función permite seleccionar una imagen desde el explorador de archivos para guardarla en state.trip.coverImageDataUrl
function handleCoverChange(file) {
  if (!file) return;

  state.trip.coverImage = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.trip.coverImageDataURL = e.target.result;
    $("#previewWrapper").src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Construimos el nuevo objeto que vamos a guardar en el LocalStorage
async function finishTrip() {
  // Obtenemos el array de viajes
  const viajes = getTravels();

  // Hacemos un push en el array para añadir el nuevo viaje
  viajes.push({
    id: crypto.randomUUID(),
    destino: state.trip.destination,
    pais: state.trip.country,
    lat: state.trip.lat,
    lon: state.trip.lon,
    fechaInicio: state.trip.startDate.toISOString(),
    fechaFin: state.trip.endDate.toISOString(),
    dias: state.trip.days.map((d) => d.key),
    actividades: state.trip.activities,
    portada: state.trip.coverImageDataURL || null,
    creadoEn: new Date().toISOString(),
  });

  // Guardamos los viajes, si falla probablemente porque el LocalStorage está lleno, no lo guardamos
  if (!saveTravels(viajes)) return;

  // Si todo está correcto brindamos un mensaje al usuario que el viaje ha sido guardado exitosamente
  await uiAlert("¡Viaje guardado!", { title: "Listo", type: "success" });
  window.location.href = "../viajes.html";
}

/* EventsListeners */

document.addEventListener("DOMContentLoaded", () => {
  const buttonBack = document.getElementById("buttonBack");

  // Inputs de fechas
  const fechaIdaInput = document.getElementById("fechaIda");
  const fechaVueltaInput = document.getElementById("fechaVuelta");

  // Inicialización del Datepicker
  const datepickerOptions = {
    format: "yyyy-mm-dd",
    autohide: true,
    language: "es",
  };

  new Datepicker(fechaIdaInput, datepickerOptions);
  new Datepicker(fechaVueltaInput, datepickerOptions);

  // Programamos el botón de volver atrás dependiendo del paso del formulario en el que está el usuario
  buttonBack.addEventListener("click", (e) => {
    e.preventDefault();

    if (state.step === 1) window.location.href = "../viajes.html";
    else if (state.step === 2) showStep(1);
    else if (state.step === 3) showStep(2);
  });

  // Siguiente página
  $("#primeraPagina").addEventListener("click", async () => {
    // Esperamos a que se valide el formulario
    if (await validateStepOne()) {
      showStep(2);
      renderActivitiesList();
      setDefaultTime("#horaInicio", "09:00");
      setDefaultTime("#horaFin", "10:00");
    }
  });


  // Eventos del paso 2
  $("#diaSelect").addEventListener("change", renderActivitiesList);
  $("#addActivityButton").addEventListener("click", addActivity);
  $("#buttonForm2").addEventListener("click", () => showStep(3));

  // Eventos del paso 3  
  $("#portada").addEventListener("change", (e) =>
    handleCoverChange(e.target.files?.[0])
  );

  // Al presionar el botón de finalizar guardamos el viaje
  $("#btnFinalizar").addEventListener("click", finishTrip);

  showStep(1);
});