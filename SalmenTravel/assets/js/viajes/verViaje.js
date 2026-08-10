// Al entrar al html cargar el viaje
document.addEventListener("DOMContentLoaded", cargarViaje);

// Clave en donde se guarda los viajes en el LocalStorage
const STORAGE_KEY = "viajes";

// Estado de la vista
const uiState = {
    travel: null,
    mode: "days",
    dayIndex: 0
};

// Función que carga el viaje seleccionado
function cargarViaje() {
    // Se lee el id del viaje seleccionado
    const id = localStorage.getItem("viajeSeleccionado");
    if (!id) return;

    // Se busca el viaje con ese id en el LocalStorage
    const viajes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const travel = viajes.find((v) => v.id === id);
    if (!travel) return;

    // Se guarda el viaje en el estado global de la pantalla
    uiState.travel = travel;

    // Mostramos los detalles del viaje

    // Mostramos el header del viaje
    showTravelHeader(travel);

    // Renderizamos la sección de la vista de días y actividades
    renderActivitiesSection();

    // Botones de editar y borrar viaje
    wireEditDeleteButtons(travel.id);

    // Conectar los EventListeners
    initActivityModalEvents();
}

// Cargamos el header con los datos del viaje
function showTravelHeader(travel) {
    // Colocamos la ciudad y país del destino
    document.querySelector(".tituloViaje").textContent =
        `Mi viaje a ${travel.destino} - ${capitalizar(travel.pais)}`;

    // Aquí pondremos la portada de viaje que ha seleccionado el usuario, en caso de no haber portada, ponemos nuestra mascota
    const img = document.querySelector(".flag-grande");
    img.src = travel.portada ? travel.portada : "../assets/images/SalmenTravelLogoNaranja.png";
    img.alt = `Portada de ${travel.destino}`;

    // Aquí colocamos las fechas dentro del contenedor en el formato de DÍA/MES/AÑO
    document.querySelector(".fechasViaje").textContent =
        `${formatDate(travel.fechaInicio)} - ${formatDate(travel.fechaFin)}`;

    document.querySelector(".ciudad").textContent = travel.destino;
}

// Función que renderiza la sección de las actividades y decide si muestra los días o las actividades de esos días 
function renderActivitiesSection() {
    const container = document.getElementById("activitiesContent");
    if (!container || !uiState.travel) return;

    container.replaceChildren();

    // Si el modo está en días invocamos a la función para construir dicha vista
    if (uiState.mode === "days") {
        container.appendChild(buildDaysView(uiState.travel));
    } else {
        // De lo contrario construimos el detalle de un día en concreto con su index
        container.appendChild(buildDayDetailView(uiState.travel, uiState.dayIndex));
    }
}

// Esta función construye la vista de los días del viaje
function buildDaysView(travel) {
    // Obtenemos el array de días
    const days = travel.dias || [];

    // Si por alguna extraña razón el viaje no tiene días, se muestra el siguiente mensaje
    if (!days.length) {
        const p = document.createElement("p");
        p.className = "empty-text";
        p.textContent = "Este viaje aún no tiene días.";
        return p;
    }

    // Este será nuestro container principal
    const wrapper = document.createElement("div");
    wrapper.className = "days-wrapper";

    // Luego creamos el grid de los días
    const grid = document.createElement("div");
    grid.className = "days-grid";

    // Se recorren los días por índice
    days.forEach((dayKey, idx) => {
        // Creamos un botón por día
        const btn = document.createElement("button");
        btn.className = "day-card";
        btn.type = "button";

        // Si hay actividades en el día podemos mostrar un sello de imagen en el botón
        // para indicar que hay tiene actividades
        const activitiesByDay = travel.actividades || {};
        const hasActivities = (activitiesByDay[dayKey] || []).length > 0;

        if (hasActivities) {
            const imgAct = document.createElement("img");
            imgAct.className = "activity-stamp";
            imgAct.src = "../assets/images/activity_day.png";
            imgAct.alt = "Este día tiene actividades";
            imgAct.loading = "lazy";

            // Agregamos la imagen al botón
            btn.appendChild(imgAct);
        }

        // Texto del botón
        const span = document.createElement("span");
        span.className = "day-card-title";
        span.textContent = `DÍA ${idx + 1}`;

        // Agregamos el texto al botón
        btn.appendChild(span);

        // Al hacer click en el botón, guardamos el index del día, cambiamos el modo de la lista y volvemos a invocar la función 
        // de renderizar la sección de actividades donde se mostrarán las actividades del día
        btn.addEventListener("click", () => {
            uiState.dayIndex = idx;
            uiState.mode = "day";
            renderActivitiesSection();
        });

        // agregamos el botón al grid
        grid.appendChild(btn);
    });

    // Luego el grid finalmente lo añadimos al container
    wrapper.appendChild(grid);
    return wrapper;
}


// Se construye la vista de ver las actividades de un día en concreto
function buildDayDetailView(travel, dayIndex) {
    // Obtenemos la key del día
    const dayKey = (travel.dias || [])[dayIndex];

    // Actividades por día
    const activitiesByDay = travel.actividades || {};

    // Lista de actividades del día
    const listData = activitiesByDay[dayKey] || [];

    const root = document.createElement("div");
    root.className = "day-detail";

    // Creamos el contenedor interno con 3 columnas
    const inner = document.createElement("div");
    inner.className = "day-detail-inner row align-items-center g-2 g-md-3";

    // Creamos el botón de ir a un día anterior (el botón izquierdo)
    const prev = document.createElement("button");
    prev.className = "nav-arrow left col-auto";
    prev.type = "button";
    prev.dataset.nav = "prev";
    prev.setAttribute("aria-label", "Día anterior");
    prev.textContent = "‹";

    // Se crea los elementos centrales
    const center = document.createElement("div");
    center.className = "day-center col";

    // Primero colocamos el día que se verá en pantalla
    const pill = document.createElement("div");
    pill.className = "day-title-pill";
    pill.textContent = `Actividades en el día ${dayIndex + 1}`;

    // Luego se coloca el área de la lista de actividades del día junto con el botón de añadir actividad
    const listArea = document.createElement("div");
    listArea.className = "d-grid gap-3";

    // Creamos el elemento donde pondremos la lista
    const body = document.createElement("div");
    body.className = "day-panel-body";

    // Creamos el elemento donde pondremos cada actividad
    const ul = document.createElement("ul");
    ul.className = "list-group";

    // Si no hay actividades, mostramos el siguiente mensaje
    if (!listData.length) {
        const p = document.createElement("p");
        p.className = "empty-text";
        p.textContent = "No hay actividades en este día.";
        ul.appendChild(p);
    } else {
        // Si hay actividades se printa una fila por cada actividad
        listData.forEach((a) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex align-items-center justify-content-between gap-3";

            // Aqui colocaremos el nombre de la actividad
            const name = document.createElement("span");
            name.className = "activity-name flex-grow-1";
            // invocamos linkifyToFragment por si el nombre de la actividad es unn URL
            name.replaceChildren(linkifyToFragment(a.name || ""));

            // Pondremos un nuevo elemento con la hora de inicio y final de la actividad
            const time = document.createElement("span");
            time.className = "activity-time text-nowrap small opacity-75";
            time.textContent = (a.start && a.end) ? `${a.start} - ${a.end}` : "";

            // Con este botón se puede eliminar una actividad
            const del = document.createElement("button");
            del.className = "activity-delete btn btn-link p-0";
            del.type = "button";
            del.dataset.id = a.id;
            del.title = "Eliminar";

            // Le agregamos el ícono de papelera al botón de eliminar actividad
            const img = document.createElement("img");
            img.src = "../assets/images/trash.png";
            img.alt = "Eliminar";
            del.appendChild(img);

            // Le añadimos un EventListener al eliminar una actividad
            del.addEventListener("click", () => {
                const id = del.dataset.id;
                const dk = travel.dias[uiState.dayIndex];

                // Quitamos la actividad del array de actividades del día
                travel.actividades[dk] = (travel.actividades[dk] || []).filter((x) => x.id !== id);

                // Guardamos los cambios en LocalStorage y se actualiza el estado del viaje
                persistTravel(travel);

                // Se renderiza nuevamente la sección de actividades al relizar este cambio
                renderActivitiesSection();
            });

            // Montamos la fila de la actividad
            li.append(name, time, del);
            // La agregamos a la lista
            ul.appendChild(li);
        });
    }
    // Se agrega la lista 
    body.appendChild(ul);

    // Creamos el botón de añadir actividad
    const addBtn = document.createElement("button");
    addBtn.className = "add-activity btn mx-auto d-inline-flex align-items-center gap-2";
    addBtn.type = "button";

    const plus = document.createElement("span");
    plus.className = "plus";
    plus.textContent = "+";

    addBtn.append(plus, document.createTextNode(" Añadir actividad"));
    addBtn.addEventListener("click", openActivityModal);

    // Agregamos tanto el elemento de la lista y el botón de añadir actividad
    listArea.append(body, addBtn);

    // Agregamos en el centro el día y la lista completa
    center.append(pill, listArea);

    // Agregamos el botón de ir al siguiente día
    const next = document.createElement("button");
    next.className = "nav-arrow right col-auto";
    next.type = "button";
    next.dataset.nav = "next";
    next.setAttribute("aria-label", "Día siguiente");
    next.textContent = "›";

    // Programamos los botones de avanzar o volver de día
    [prev, next].forEach((btn) => {
        btn.addEventListener("click", () => {
            const dir = btn.dataset.nav;
            // Máximo de días disponibles
            const max = (travel.dias || []).length - 1;

            // Si la dirección es atrás "prev" vamos al día anterior, si el día anterior no existe porque es el primer día seguramente
            // no avanzamos al índice -1 sino a 0, es decir nos mantenemos en el primer día
            if (dir === "prev") uiState.dayIndex = Math.max(0, uiState.dayIndex - 1);
            // Si la dirección es el siguiente día "next" vamos a mostrar el siguiente día, nuevamente si es el último día
            // nos mantenemos en ese día
            if (dir === "next") uiState.dayIndex = Math.min(max, uiState.dayIndex + 1);

            // Volvemos a renderizar la sección de actividades
            renderActivitiesSection();
        });
    });

    // Montamos el layout interior
    inner.append(prev, center, next);

    // Creamos el botón para vover a la lista de días
    const back = document.createElement("button");
    back.className = "back-to-days";
    back.type = "button";
    back.textContent = "Volver a la lista de días";
    // Realizamos un EventListener para que actualice el estado de la vista y la renderice nuevamente
    back.addEventListener("click", () => {
        uiState.mode = "days";
        renderActivitiesSection();
    });

    root.append(inner, back);
    return root;
}

// Se utiliza para guardar nuevamente el viajel, por si hay algún cambio en las actividades
function persistTravel(updatedTravel) {
    // Se obtienen los viajes
    const viajes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    // Buscamos el viaje a reemplazar mediante su índice
    const idx = viajes.findIndex((v) => v.id === updatedTravel.id);
    if (idx === -1) return;

    // Se reemplaza el viaje previo por el actualizado
    viajes[idx] = updatedTravel;

    // Se guarda el array de viajes en LocalStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viajes));

    // Se actualiza el estado de la UI
    uiState.travel = updatedTravel;
}

// Función para programar los botones de editar y eliminar viaje
function wireEditDeleteButtons(travelId) {
    // Seleccionamos en el documento los dos botones
    const btnEdit = document.querySelector(".editar");
    const btnDelete = document.querySelector(".eliminar");

    // Si se presiona el botón se envía al usuario a la página de modificar viaje
    btnEdit.addEventListener("click", () => {
        window.location.href = "../viajes/modificarViaje.html";
    });

    // Si se presiona el botón de eliminar viaje se le advierte al usuario de su acción
    btnDelete.addEventListener("click", async () => {
        const ok = await uiConfirm("¿Seguro que quieres eliminar este viaje?", {
            title: "Eliminar viaje",
            type: "warning",
            okText: "Sí, eliminar",
            cancelText: "Cancelar"
        });

        // Si no confirma la eliminación, no se realiza nada
        if (!ok) return;

        // De lo contrario, se elimina el viaje del LocalStorage
        const viajes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const filtered = viajes.filter((v) => v.id !== travelId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        localStorage.removeItem("viajeSeleccionado");
        // Se retorna a la página de viajes
        window.location.href = "../viajes.html";
    });
}

// Normalizamos una URL colocando https://
function normalizeUrl(url) {
    const u = String(url || "").trim();
    if (!u) return null;

    if (/^https?:\/\//i.test(u)) return u;
    if (/^www\./i.test(u)) return "https://" + u;
    if (/^[\w-]+\.[\w.-]+(\/[^\s]*)?$/i.test(u)) return "https://" + u;

    return null;
}

// Convertimos un texto en un DocumentFragment donde las URLs se transforman en links
function linkifyToFragment(text) {
    const frag = document.createDocumentFragment();
    const str = String(text || "");

    // Dominio de la ruta
    const urlRegex = /((https?:\/\/|www\.)[^\s]+|[\w-]+\.[\w.-]+(\/[^\s]*)?)/gi;

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

// Convertimos la fecha en un formato legible DÍA/MES/AÑO
function formatDate(date) {
    return new Date(date).toLocaleDateString("es-ES");
}

// Convertimos la primera letra en mayúscula
function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
// Creamos un modalDayKey para luego guardar el key de un día
let modalDayKey = null;

// 
function setDefaultTime(inputId, hour) {
    const el = document.getElementById(inputId);
    if (!el) return;
    if (!el.value) el.value = hour;
}

// Se activa el modal para escribir los datos de la una actividad nueva
function openActivityModal() {
    const overlay = document.getElementById("activityModal");
    if (!overlay) return;

    // Se toma el día actual que está viendo el usurio
    const travel = uiState.travel;
    const dayKey = travel.dias[uiState.dayIndex];
    modalDayKey = dayKey;

    // Limpia los inputs del modal para que el usuario pueda introducir los campos
    document.getElementById("modalActivityName").value = "";
    document.getElementById("modalHoraInicio").value = "";
    document.getElementById("modalHoraFin").value = "";
    setDefaultTime("modalHoraInicio", "09:00");
    setDefaultTime("modalHoraFin", "10:00");

    // Retiramos el hidden para poder mostrar el modal corrctamente
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");

    // Le añadimos focus para que el usuario pueda escribir en el input del nombre de la actividad
    setTimeout(() => document.getElementById("modalActivityName").focus(), 0);

    // Permite cerrar clickando fuera del contenido
    overlay.addEventListener("click", onOverlayClickOnce);
}

// Se cierra el modal y se limpia el modalDayKey
function closeActivityModal() {
    const overlay = document.getElementById("activityModal");
    if (!overlay) return;

    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");

    overlay.removeEventListener("click", onOverlayClickOnce);
    modalDayKey = null;
}

// Si ce hace click en cualquier zona se cierra el modal
function onOverlayClickOnce(e) {
    if (e.target.id === "activityModal") closeActivityModal();
}

// Inicializa los eventos del modal una única vez
function initActivityModalEvents() {
    // Se selecciona el modal
    const overlay = document.getElementById("activityModal");
    if (!overlay) return;

    // Se selecciona los botones de cancelar y guardar actividad
    const btnCancel = document.getElementById("modalCancel");
    const btnSave = document.getElementById("modalSave");

    // Listener para cerrar el modal
    btnCancel.addEventListener("click", closeActivityModal);

    // Cuando se hace click en el botón de guardar:
    btnSave.addEventListener("click", async () => {
        // Obtenemos los valores introducidos por el usuario de los inputs 
        const name = document.getElementById("modalActivityName").value.trim();
        const start = document.getElementById("modalHoraInicio").value;
        const end = document.getElementById("modalHoraFin").value;

        // Si no ha escrito el nombre de la actividad alertamos al usuario
        if (!name) {
            await uiAlert("Escribe el nombre de la actividad.", {
                title: "Campo obligatorio",
                type: "warning"
            });
            return;
        }

        // Si la hora de inicio es posterior a la hora final, se le informa al usuario 
        if (start && end && start >= end) {
            await uiAlert("La hora final debe ser posterior a la de inicio.", {
                title: "Horas inválidas",
                type: "warning"
            });
            return;
        }

        // Si se encuentra una actividad con el mismo rango de horas, no se puede añadir en el mismo día
        const activities = uiState.travel.actividades[modalDayKey] ?? [];

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

        // Se guarda el viaje
        const travel = uiState.travel;

        // Se asegura que trabel.actividades existe
        if (!travel.actividades) travel.actividades = {};
        // Se asegura que es un array
        if (!travel.actividades[modalDayKey]) travel.actividades[modalDayKey] = [];

        // Hacemos push de la nueva actividad creada
        travel.actividades[modalDayKey].push({
            id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
            name,
            start,
            end
        });

        // Se guarda el viaje actualizado en el LocalStorage
        persistTravel(travel);

        // Invocamos a esta función para cerrar el modal
        closeActivityModal();

        // Renderizamos nuevamente la sección para que aparezca las actividades actualizadas
        renderActivitiesSection();
    });

    // Si se presiona scape y el modal está abierto, se puede cerrar el modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const isOpen = !document.getElementById("activityModal")?.classList.contains("hidden");
            if (isOpen) closeActivityModal();
        }
    });
}