(() => {
    // ID del overlay del popup
    const POPUP_ID = "uiPopupOverlay";

    // En esta función se construyen los elementos de un pop up
    function buildPopupDOM() {
        // Overlay del popUp en el documento
        const overlay = document.createElement("div");
        overlay.id = POPUP_ID;
        overlay.className = "ui-popup-overlay hidden";
        overlay.setAttribute("aria-hidden", "true");

        // Se crea la card del pop up
        const card = document.createElement("div");
        card.className = "ui-popup-card";
        card.setAttribute("role", "dialog");
        card.setAttribute("aria-modal", "true");

        // Se crea el título del pop up
        const title = document.createElement("h3");
        title.className = "ui-popup-title";
        title.id = "uiPopupTitle";
        title.textContent = "Aviso";
        card.setAttribute("aria-labelledby", title.id);

        // Se crea el texto que contiene el pop up
        const message = document.createElement("p");
        message.className = "ui-popup-message";
        message.textContent = "";

        // Se crea el lugar donde se van a colocar los botones
        const actions = document.createElement("div");
        actions.className = "ui-popup-actions";

        // Botón de cancelar
        const btnCancel = document.createElement("button");
        btnCancel.type = "button";
        btnCancel.className = "ui-popup-btn cancel hidden";
        btnCancel.textContent = "Cancelar";

        // Botón para aceptar
        const btnOk = document.createElement("button");
        btnOk.type = "button";
        btnOk.className = "ui-popup-btn ok";
        btnOk.textContent = "Aceptar";

        // Añadimos los botones a las acciones
        actions.appendChild(btnCancel);
        actions.appendChild(btnOk);

        // Añadimos a la card el título, el mensaje y las acciones del pop up
        card.appendChild(title);
        card.appendChild(message);
        card.appendChild(actions);

        // La card la añadimos al overlay
        overlay.appendChild(card);

        // Por último lo añadimos finalmente al body
        document.body.appendChild(overlay);

        // Retornamos las referencias para poder modificarlas
        return { overlay, card, title, message, btnOk, btnCancel };
    }

    // Función para asegurar que existe un pop up en el DOM
    function ensurePopup() {
        // Si ya existe un elemento con el id del POPUP_ID no creamos duplicados
        const existing = document.getElementById(POPUP_ID);
        if (existing) {
            // Cacheamos las referencias de los elementos
            return {
                overlay: existing,
                card: existing.querySelector(".ui-popup-card"),
                title: existing.querySelector(".ui-popup-title"),
                message: existing.querySelector(".ui-popup-message"),
                btnOk: existing.querySelector(".ui-popup-btn.ok"),
                btnCancel: existing.querySelector(".ui-popup-btn.cancel"),
            };
        }
        // Si no existe, creamos el pop up
        return buildPopupDOM();
    }

    // Se abre el pop up con la configuración pasada por parámetro
    function openPopup({ title, message, type, mode, okText, cancelText, lockBackdrop, lockEsc }) {
        const ui = ensurePopup();

        // Información del pop up
        ui.card.dataset.type = type || "info";
        ui.title.textContent = title || (mode === "confirm" ? "Confirmación" : "Aviso");
        ui.message.textContent = message || "";
        
        // Textos de botones
        ui.btnOk.textContent = okText || "Aceptar";
        ui.btnCancel.textContent = cancelText || "Cancelar";
        
        // Si es un pop up de modo de confirmación se muestra el botón de cancelar
        if (mode === "confirm") ui.btnCancel.classList.remove("hidden");
        // Si es simplemente una alerta le agregamos el hidden al botón de cancelar
        else ui.btnCancel.classList.add("hidden");

        // flags de cierre
        ui.overlay.dataset.lockBackdrop = lockBackdrop ? "1" : "0";
        ui.overlay.dataset.lockEsc = lockEsc ? "1" : "0";

        ui.overlay.classList.remove("hidden");
        ui.overlay.setAttribute("aria-hidden", "false");

        // focus
        setTimeout(() => ui.btnOk.focus(), 0);

        return ui;
    }

    // Función para cerrar un pop up
    function closePopup(ui) {
        ui.overlay.classList.add("hidden");
        ui.overlay.setAttribute("aria-hidden", "true");
    }

    // Cerrar al hacer click fuera del pop up
    document.addEventListener("click", (e) => {
        const overlay = document.getElementById(POPUP_ID);
        if (!overlay || overlay.classList.contains("hidden")) return;

        if (e.target === overlay && overlay.dataset.lockBackdrop !== "1") {
            const ok = overlay.querySelector(".ui-popup-btn.ok");
            ok && ok.click();
        }
    });

    // Lo mismo al presionar la tecla ESC
    document.addEventListener("keydown", (e) => {
        const overlay = document.getElementById(POPUP_ID);
        if (!overlay || overlay.classList.contains("hidden")) return;

        if (e.key === "Escape" && overlay.dataset.lockEsc !== "1") {
            const cancel = overlay.querySelector(".ui-popup-btn.cancel:not(.hidden)");
            const ok = overlay.querySelector(".ui-popup-btn.ok");
            (cancel || ok) && (cancel || ok).click();
        }
    });

    // Configuración de la uiAlert personalizada
    window.uiAlert = (message, opts = {}) => {
        return new Promise((resolve) => {
            // Se abre un pop up con el modo alert
            const ui = openPopup({
                title: opts.title,
                message,
                type: opts.type || "info",
                mode: "alert",
                okText: opts.okText || "Aceptar",
                lockBackdrop: !!opts.lockBackdrop,
                lockEsc: !!opts.lockEsc,
            });

            // Listener del botón de ok
            const onOk = () => {
                ui.btnOk.removeEventListener("click", onOk);
                closePopup(ui);
                resolve(true);
            };

            ui.btnOk.addEventListener("click", onOk);
        });
    };
    
    // Configuración de uiConfirm personalizada
    window.uiConfirm = (message, opts = {}) => {
        return new Promise((resolve) => {
            // Se abre un pop up con el modo confirm
            const ui = openPopup({
                title: opts.title,
                message,
                type: opts.type || "warning",
                mode: "confirm",
                okText: opts.okText || "Sí",
                cancelText: opts.cancelText || "Cancelar",
                lockBackdrop: !!opts.lockBackdrop,
                lockEsc: !!opts.lockEsc,
            });

            // Se realiza la gestión de ambos botones
            const cleanup = () => {
                ui.btnOk.removeEventListener("click", onOk);
                ui.btnCancel.removeEventListener("click", onCancel);
                closePopup(ui);
            };
            // En confirmar se hace un resolve con un true
            const onOk = () => { cleanup(); resolve(true); };

            // En cancelar se hace un resolve con false
            const onCancel = () => { cleanup(); resolve(false); };

            ui.btnOk.addEventListener("click", onOk);
            ui.btnCancel.addEventListener("click", onCancel);
        });
    };
})();