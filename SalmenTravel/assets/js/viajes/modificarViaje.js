const STORAGE_KEY = "viajes"; // Clave para guardar el array de viajes en LocalStorage
const API_KEY = "PON_AQUI_TU_API_KEY"; // OpenWeather API key

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* LocalStorage helpers */

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
    // Si se guarda información con mucho peso en memoria, le avisamos al usuario que no puede guardar el viaje
    if (error.name === "QuotaExceededError") {
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

// Validamos si un string en verdad es un URL empleando URL()
function isValidUrl(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

/* Autocompletado según la API */

let resultadosGeo = [];
let lastCityQuery = "";
let lastCountrySelection = "";

// Deshabilita el select mientras está cargando
function setSelectLoading(text) {
  const select = $("#paisDestino");
  if (!select) return;

  select.replaceChildren();
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = text;
  select.appendChild(opt);
  select.disabled = true;
}

// Reestablece el select a su estado por defecto y habilitamos la selección del destino
function setSelectDefault() {
  const select = $("#paisDestino");
  if (!select) return;

  select.replaceChildren();
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "Selecciona un país";
  select.appendChild(opt);
  select.disabled = false;
}

// Llamamos a la API para obtener coincidencias con ciudades que encuentre
async function buscarCiudad(forceCity) {
  const select = $("#paisDestino");
  if (!select) return;

  // Determinamos cual es la ciudad a buscar
  const ciudad = String(forceCity ?? $("#destino")?.value ?? "").trim();
  if (!ciudad) return;

  // Evitamos llamadas innecesarias si ya buscamos la misma ciudad
  if (
    ciudad.toLowerCase() === lastCityQuery.toLowerCase() &&
    select.options.length > 1
  ) {
    return;
  }

  // Guarda selección actual
  const previousSelection = select.value || lastCountrySelection || "";

  setSelectLoading("Buscando países...");

  try {
    // Consulta de la API
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        ciudad
      )}&limit=20&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error("API error");

    // Guardamos la respuesta de la API
    resultadosGeo = await res.json();
    lastCityQuery = ciudad;

    // Rellenamos el select con los países que existen en la API
    rellenarSelectPaises(resultadosGeo);

    // Restaurar selección si sigue existiendo
    if (previousSelection) {
      select.value = previousSelection;
      if (select.value) lastCountrySelection = select.value;
    }
  } catch (err) {
    // En caso de un error de la API, establecemos el texto del select con la función setSelectLoading(text)
    resultadosGeo = [];
    setSelectLoading("No se pudo cargar países");

    // Mostramos una alerta al usuario mediante un pop up
    if (typeof uiAlert === "function") {
      await uiAlert("No se pudo conectar con la API para autocompletar países.", {
        title: "Error de conexión",
        type: "error",
      });
    } else {
      alert("No se pudo conectar con la API para autocompletar países.");
    }
  }
}

// Se rellena el select con los países que ha encontrado la API
function rellenarSelectPaises(data) {
  const select = $("#paisDestino");
  if (!select) return;

  select.replaceChildren();
  select.disabled = false;

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecciona un país";
  select.appendChild(defaultOption);

  if (!Array.isArray(data) || data.length === 0) return;

  // Empleamos Map para no repetir los códigos de los países
  const unique = new Map();
  data.forEach((item) => {
    if (item?.country && !unique.has(item.country)) unique.set(item.country, item);
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


const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

// Convertimos el Date a clave en las fechas
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
      key: toKey(current), // Foramto de clave
      label: formatDayLabel(current), // Formato en día (como se muestra en la página)
      date: new Date(current),
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/* Estado UI */

// uiState define el estado de la pantalla dependiendo de step, que indica en qué paso del formulario están
const uiState = {
  step: 1,
  tripId: null,
  original: null,
  originalDestino: "",
  originalPais: "",

  // snapshot para detectar si el viaje original tenía actividades
  originalActivitiesSnapshot: null,
  originalHadActivities: false,

  trip: {
    destination: "",
    country: "",
    lat: null,
    lon: null,
    startDate: null,
    endDate: null,
    days: [],
    activities: {},
    coverImageDataURL: null,
  },

  datepickerStart: null,
  datepickerEnd: null,
};

// Cambia el estado del formulario dependiendo del paso en el que esté el usuario
function showStep(step) {
  uiState.step = step;

  // Ponemos el estado actual oculto
  $$(".step").forEach((el) => el.classList.add("hidden"));
  // Quitamos en el paso siguiente el oculto para mostrarlo
  $$(".step-" + step).forEach((el) => el.classList.remove("hidden"));

  // Dependiendo del paso cambia el título de la página
  const title = $("#pageTitle");
  if (title) {
    if (step === 1) title.textContent = "Modifica tu viaje";
    if (step === 2) title.textContent = "Modifica actividades de tu viaje";
    if (step === 3) title.textContent = "Modifica tu portada";
  }

  // Cambiamos también el texto del botón de volver atrás si el paso es o no es el primero
  const backText = $("#buttonBackText");
  if (backText) {
    backText.textContent =
      step === 1 ? "Volver a tus viajes" : "Volver a la página anterior";
  }
}

/* Actividades (UI) */

// Rellenamos el select de los días del rango de fechas
function fillDaySelect() {
  const select = $("#diaSelect");
  if (!select) return;

  select.replaceChildren();

  uiState.trip.days.forEach((day, index) => {
    const option = document.createElement("option");
    option.value = day.key;
    option.textContent = `Día ${index + 1}: ${day.label}`;
    select.appendChild(option);
  });
}

// Se renderiza la lista de actividades según el día seleccionado
function renderActivitiesList() {
  const selectDia = $("#diaSelect");
  const list = $("#activitiesList");
  const emptyText = $("#emptyActivities");
  if (!selectDia || !list || !emptyText) return;

  // Obtenemos el día seleccionado
  const key = selectDia.value;

  // Limpiamos la lista
  list.replaceChildren();

  const activities = uiState.trip.activities[key] ?? [];

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

    let nameNode;
    // Si resulta que el nombre de una actividad es un link
    // podemos hacer que se vea como un link que se pueda hacer click y funcional
    if (isValidUrl(activity.name)) {
      const link = document.createElement("a");
      link.href = activity.name;
      link.textContent = activity.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "activity-link";
      nameNode = link;
    } else {
      // De lo contrario, ponemos simplemente el nombre
      const strong = document.createElement("strong");
      strong.textContent = activity.name;
      nameNode = strong;
    }

    // Luego colocamos en un texto pequeño la hora de inicio y final de una actividad
    const timeSpan = document.createElement("span");
    timeSpan.className = "text-small";
    const timeText =
      activity.start && activity.end ? ` (${activity.start} - ${activity.end})` : "";
    timeSpan.textContent = timeText;

    left.append(nameNode, timeSpan);

    // También creamos el botón para eliminar una actividad
    const btn = document.createElement("button");
    btn.type = "button";

    const img = document.createElement("img");
    img.src = "/assets/images/trash.png";
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
  uiState.trip.activities[dayKey] = (uiState.trip.activities[dayKey] || []).filter(
    (a) => a.id !== activityId
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
  const name = $("#activityName")?.value?.trim() ?? "";
  const start = $("#horaInicio")?.value ?? "";
  const end = $("#horaFin")?.value ?? "";
  const key = $("#diaSelect")?.value ?? "";

  // Evitamos actividades vacías
  if (!name) {
    if (typeof uiAlert === "function") {
      // Alertamos al usuario que debe escribir el nombre de la actividad
      await uiAlert("Escribe el nombre de la actividad.", {
        title: "Campo obligatorio",
        type: "warning",
      });
    } else {
      alert("Escribe el nombre de la actividad.");
    }
    return;
  }

  // Si la hora final es antes de la hora de inicio, también le alertamos al usuario
  if (start && end && start >= end) {
    if (typeof uiAlert === "function") {
      await uiAlert("La hora final debe ser posterior a la de inicio.", {
        title: "Horas inválidas",
        type: "warning",
      });
    } else {
      alert("La hora final debe ser posterior a la de inicio.");
    }
    return;
  }

  // Si se encuentra una actividad con el mismo rango de horas, no se puede añadir en el mismo día
  const activities = uiState.trip.activities[key] ?? [];

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

  // Definimos el array de actividades del día, si dicho día no tenía actividades
  if (!uiState.trip.activities[key]) uiState.trip.activities[key] = [];

  // Lo metemos en el array de actividades del día
  uiState.trip.activities[key].push(activity);

  // Limpiamos los inputs y reestablecemos la hora por default
  $("#activityName").value = "";
  $("#horaInicio").value = "";
  $("#horaFin").value = "";
  setDefaultTime("#horaInicio", "09:00");
  setDefaultTime("#horaFin", "10:00");

  // Renderizamos nuevamente las actividades
  renderActivitiesList();
}

// Esta función permite seleccionar una imagen desde el explorador de archivos para guardarla en uiState.trip.coverImageDataUrl
function handleCoverChange(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    uiState.trip.coverImageDataURL = e.target.result;
    const prev = $("#previewWrapper");
    if (prev) prev.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Si existe al menos una actividad en el día, retornamos el valor de true
function hasExistingActivities(tripActivities) {
  if (!tripActivities) return false;
  return Object.values(tripActivities).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
}

// Se obtiene as actividades desde diferentes formatos
function getRawActivities(travel) {
  return (
    travel?.actividades ??
    travel?.activities ??
    travel?.tripActivities ??
    travel?.plan ??
    {}
  );
}

// Se clona un objeto Json
function cloneActivities(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

// Detecta si el destino ha cambiado con respecto al destino anteriormente guardado
function destinationChanged() {
  const dest = ($("#destino")?.value ?? "").trim();
  const paisActual = (($("#paisDestino")?.value ?? "") + "").trim().toUpperCase();
  const paisOriginal = (uiState.originalPais ?? "").trim().toUpperCase();
  return dest !== uiState.originalDestino || paisActual !== paisOriginal;
}

// Validamos el primer paso del formulario verificando los siguientes criterios
async function validateStepOne() {
  const destination = ($("#destino")?.value ?? "").trim();
  const countryCode = $("#paisDestino")?.value ?? "";
  const startDateStr = $("#fechaIda")?.value ?? "";
  const endDateStr = $("#fechaVuelta")?.value ?? "";

  // Validamos si todos los datos están completados
  if (!destination || !countryCode || !startDateStr || !endDateStr) {
    if (typeof uiAlert === "function") {
      // Si no es así alertamos al usuario que necesita completar todos los datos
      await uiAlert("Por favor, rellena destino, país y ambas fechas.", {
        title: "Faltan datos",
        type: "warning",
      });
    } else {
      alert("Por favor, rellena destino, país y ambas fechas.");
    }
    return false;
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Validamos si las fechas son válidas
  if (isNaN(startDate) || isNaN(endDate)) {
    if (typeof uiAlert === "function") {
      // Alertamos al usuario sobre el error
      await uiAlert("Fechas no válidas.", { title: "Error", type: "error" });
    } else {
      alert("Fechas no válidas.");
    }
    return false;
  }

  // Verificamos que la fecha de vuelta no sea antes que la de ida
  if (endDate < startDate) {
    if (typeof uiAlert === "function") {
      // Alertamos al usuario sobre el error
      await uiAlert("La fecha de vuelta no puede ser anterior a la de ida.", {
        title: "Fechas inválidas",
        type: "warning",
      });
    } else {
      alert("La fecha de vuelta no puede ser anterior a la de ida.");
    }
    return false;
  }

  // Asegurar resultados geo para validar coherencia ciudad-país
  if (
    !resultadosGeo.length ||
    destination.toLowerCase() !== lastCityQuery.toLowerCase()
  ) {
    await buscarCiudad(destination);
  }

  // Verificamos que el nombre del destino introducido por el usuario es igual a la encontrada por la API
  const seleccion = (resultadosGeo || []).find((item) => item?.country === countryCode);
  // Si no es igual, se alertA al usuario
  if (!seleccion) {
    if (typeof uiAlert === "function") {
      await uiAlert("La ciudad no coincide con el país seleccionado.", {
        title: "Revisa el país",
        type: "warning",
      });
    } else {
      alert("La ciudad no coincide con el país seleccionado.");
    }
    return false;
  }

  // Se actualiza el estado del viaje
  uiState.trip.destination = destination;
  uiState.trip.country = countryCode;
  uiState.trip.lat = seleccion.lat ?? null;
  uiState.trip.lon = seleccion.lon ?? null;
  uiState.trip.startDate = startDate;
  uiState.trip.endDate = endDate;

  // Recalculamos los días
  const newDays = getDateRange(startDate, endDate);

  // Mantener actividades por fecha (solo si la key existe)
  const prevActivities = uiState.trip.activities || {};
  const nextActivities = {};
  newDays.forEach((d) => {
    nextActivities[d.key] = Array.isArray(prevActivities[d.key])
      ? [...prevActivities[d.key]]
      : [];
  });

  uiState.trip.days = newDays;
  uiState.trip.activities = nextActivities;

  // Rellena el selector de días en el nuevo rango de fechas
  fillDaySelect();
  return true;
}

// Se borran las actividades del biaje pero se dejan las heys de los días
// Esto se usa cuando se confirma el cambio del destino
function clearAllActivities() {
  const cleared = {};
  uiState.trip.days.forEach((d) => (cleared[d.key] = []));
  uiState.trip.activities = cleared;
}

// Al terminar guardamos todos los cambios del viaje en el LocalStorage
async function saveChanges() {
  const viajes = getTravels();
  const idx = viajes.findIndex((v) => String(v.id) === String(uiState.tripId));

  // Si no se encuentra el viaje, se muestra este error
  if (idx === -1) {
    if (typeof uiAlert === "function") {
      await uiAlert("No se encontró el viaje a modificar.", {
        title: "Error",
        type: "error",
      });
    } else {
      alert("No se encontró el viaje a modificar.");
    }
    return;
  }

  // construimos el viaje actualizado para guardarlo en el LocalStorage
  const updated = {
    ...viajes[idx],
    destino: uiState.trip.destination,
    pais: uiState.trip.country,
    lat: uiState.trip.lat ?? viajes[idx].lat ?? null,
    lon: uiState.trip.lon ?? viajes[idx].lon ?? null,
    fechaInicio: uiState.trip.startDate.toISOString(),
    fechaFin: uiState.trip.endDate.toISOString(),
    dias: uiState.trip.days.map((d) => d.key),
    actividades: uiState.trip.activities,
    portada: uiState.trip.coverImageDataURL ?? viajes[idx].portada ?? null,
    actualizadoEn: new Date().toISOString(),
  };

  // Reemplazamos el viaje que teníamos por el nuevo
  viajes[idx] = updated;

  // Guardamos el viaje en LocalStorage
  saveTravels(viajes);

  // Alertamos al usuario que los cambios han sido guardados
  if (typeof uiAlert === "function") {
    await uiAlert("¡Cambios guardados!", { title: "Listo", type: "success" });
  } else {
    alert("¡Cambios guardados!");
  }

  // Retornamos a la página principal de viajes
  window.location.href = "../viajes/verViaje.html";
}

/* Cargar viaje existente */

// Carga el viaje según el viaje seleccionado a modificar
async function loadTripToEdit() {
  // Obtenemos el id del viaje seleccionado
  const id = localStorage.getItem("viajeSeleccionado");
  // Si dicho id no existe volvemos a la página principal de viajes
  if (!id) {
    window.location.href = "../viajes.html";
    return;
  }

  // Obtenemos todos los viajes del LocalStorage y buscamos el que nos interesa con el id
  const viajes = getTravels();
  const travel = viajes.find((v) => String(v.id) === String(id));

  // Si no lo encontramos retornamos a la página principal de viajes
  if (!travel) {
    window.location.href = "../viajes.html";
    return;
  }

  uiState.tripId = String(id);
  uiState.original = travel;

  const destinoGuardado = travel.destino ?? travel.destination ?? "";
  const paisGuardado = travel.pais ?? travel.country ?? "";

  // Guardamos los datos del destino que se modificará para mostrarlos en las selecciones
  uiState.originalDestino = destinoGuardado;
  uiState.originalPais = paisGuardado;

  // Rellenamos el input del destino
  const inpDestino = $("#destino");
  if (inpDestino) inpDestino.value = destinoGuardado;

  // País select: lo poblamos según ciudad guardada
  setSelectDefault();
  if (destinoGuardado) {
    await buscarCiudad(destinoGuardado);

    // Asignar por value
    const selPais = $("#paisDestino");
    if (selPais) {
      selPais.value = paisGuardado || "";

      // Si no encaja, lo buscamos en el label de option
      if (!selPais.value && paisGuardado) {
        const opts = [...selPais.options];
        const match = opts.find((o) =>
          o.textContent.toUpperCase().includes(String(paisGuardado).toUpperCase())
        );
        if (match) selPais.value = match.value;
      }

      // Guardamos la selección para futuras recargas
      lastCountrySelection = selPais.value || "";
    }
  } else {
    // Si no hay un destino guardado, se deshabilita el select
    const selPais = $("#paisDestino");
    if (selPais) selPais.disabled = true;
  }

  // Fechas que se establecen en el datepicker
  const start = new Date(travel.fechaInicio);
  const end = new Date(travel.fechaFin);

  if (uiState.datepickerStart) uiState.datepickerStart.setDate(start, { render: true });
  else $("#fechaIda").value = toKey(start);

  if (uiState.datepickerEnd) uiState.datepickerEnd.setDate(end, { render: true });
  else $("#fechaVuelta").value = toKey(end);

  // Colocamos la previsualización de la portada
  const portada = travel.portada ?? travel.coverImageDataURL ?? null;
  if (portada) {
    uiState.trip.coverImageDataURL = portada;
    const prev = $("#previewWrapper");
    if (prev) prev.src = portada;
  }

  // Base del viaje
  uiState.trip.destination = destinoGuardado;
  uiState.trip.country = $("#paisDestino")?.value || paisGuardado || "";
  uiState.trip.lat = travel.lat ?? null;
  uiState.trip.lon = travel.lon ?? null;
  uiState.trip.startDate = start;
  uiState.trip.endDate = end;
  uiState.trip.days = getDateRange(start, end);

  // Normalizar actividades
  const rawActs = getRawActivities(travel);
  const normalized = {};
  uiState.trip.days.forEach((d) => {
    normalized[d.key] = Array.isArray(rawActs[d.key]) ? [...rawActs[d.key]] : [];
  });

  uiState.trip.activities = normalized;

  uiState.originalActivitiesSnapshot = cloneActivities(normalized);
  uiState.originalHadActivities = hasExistingActivities(normalized);

  fillDaySelect();
}

/* EventsListeners */


document.addEventListener("DOMContentLoaded", async () => {
  // Inicialización del Datepicker
  const datepickerOptions = {
    format: "yyyy-mm-dd",
    autohide: true,
    language: "es",
  };

  if (typeof Datepicker !== "undefined") {
    uiState.datepickerStart = new Datepicker($("#fechaIda"), datepickerOptions);
    uiState.datepickerEnd = new Datepicker($("#fechaVuelta"), datepickerOptions);
  }

  // Desplegamos el autocompletado del destino
  $("#destino")?.addEventListener("blur", async () => {
    const ciudadActual = ($("#destino")?.value ?? "").trim();
    if (!ciudadActual) return;

    // Si ya consultamos la misma ciudad, el select ya tiene las opciones
    if (
      ciudadActual.toLowerCase() === lastCityQuery.toLowerCase() &&
      ($("#paisDestino")?.options?.length ?? 0) > 1
    ) {
      return;
    }

    // se guarda la selección actual antes de nuevamente poblar el select de opciones
    lastCountrySelection = $("#paisDestino")?.value || lastCountrySelection || "";
    await buscarCiudad(ciudadActual);
  });

  // Guardar selección manual
  $("#paisDestino")?.addEventListener("change", () => {
    lastCountrySelection = $("#paisDestino")?.value || "";
  });

  // Programamos el botón de volver atrás dependiendo del paso del formulario en el que está el usuario
  $("#buttonBack")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (uiState.step === 1) window.location.href = "../viajes.html";
    else if (uiState.step === 2) showStep(1);
    else if (uiState.step === 3) showStep(2);
  });

  // Cargamos el viaje y lo mete en uiState
  await loadTripToEdit();
  showStep(1);

  // Siguiente página
  $("#primeraPagina")?.addEventListener("click", async () => {
    const ok = await validateStepOne();
    if (!ok) return;

    // Su ha cambiado el destino, advertimos al usuario que las actividades se borrarán
    const changed = destinationChanged();
    const hadActs = uiState.originalHadActivities;

    if (changed && hadActs) {
      let confirmOk = true;

      // Mostramos la alerta del cambio del destino
      if (typeof uiConfirm === "function") {
        confirmOk = await uiConfirm(
          "Si cambias el país o la ciudad, se borrarán todas las actividades del viaje y tendrás que crearlas de nuevo.\n\n¿Quieres continuar?",
          {
            title: "Cambiaste el destino",
            type: "warning",
            okText: "Continuar y borrar",
            cancelText: "Cancelar",
            lockBackdrop: true,
            lockEsc: true,
          }
        );
      } else {
        confirmOk = confirm(
          "Si cambias el país o la ciudad, se borrarán todas las actividades del viaje.\n\n¿Quieres continuar?"
        );
      }

      // Si el usuario cancela el cambio de destino, restauramos los inputs con la información que tenía el viaje original
      if (!confirmOk) {
        // Restaurar inputs
        $("#destino").value = uiState.originalDestino;

        await buscarCiudad(uiState.originalDestino);

        // intentar restaurar país original
        const sel = $("#paisDestino");
        if (sel) {
          sel.value = uiState.originalPais || "";

          if (!sel.value && uiState.originalPais) {
            const opts = [...sel.options];
            const match = opts.find((o) =>
              o.textContent.toUpperCase().includes(String(uiState.originalPais).toUpperCase())
            );
            if (match) sel.value = match.value;
          }

          lastCountrySelection = sel.value || "";
        }

        // Restaurar actividades
        uiState.trip.activities = cloneActivities(uiState.originalActivitiesSnapshot);
        fillDaySelect();
        renderActivitiesList();

        return;
      }

      // Si ha confirmado el cambio del destino borramos todas las actividades
      clearAllActivities();
    }

    // Pasamos al siguiente paso del formulario
    showStep(2);
    renderActivitiesList();
    setDefaultTime("#horaInicio", "09:00");
    setDefaultTime("#horaFin", "10:00");
  });

  // Eventos del paso 2
  $("#diaSelect")?.addEventListener("change", renderActivitiesList);
  $("#addActivityButton")?.addEventListener("click", addActivity);
  $("#buttonForm2")?.addEventListener("click", () => showStep(3));

  // Eventos del paso 3
  $("#portada")?.addEventListener("change", (e) =>
    handleCoverChange(e.target.files?.[0])
  );

  $("#btnGuardar")?.addEventListener("click", saveChanges);
});