// Configuración de EmailJS
const EMAILJS_USER_ID = "TU_PUBLIC_KEY_DE_EMAILJS";        // Clave pública de usuario
const EMAILJS_SERVICE_ID = "TU_SERVICE_ID";                // ej. service_xxxxxxx
const EMAILJS_TEAM_TEMPLATE_ID = "TU_TEMPLATE_ID_EQUIPO";  // Notificación al equipo
const EMAILJS_CLIENT_TEMPLATE_ID = "TU_TEMPLATE_ID_CLIENTE"; // Respuesta automática al cliente

// DOM elements
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");

// Función para enviar un correo electrónico usando EmailJS API
const sendEmail = async (templateId, templateParams) => {
  const url = "https://api.emailjs.com/api/v1.0/email/send";

  const data = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: templateId,
    user_id: EMAILJS_USER_ID,
    template_params: templateParams,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Error sending email template ${templateId}`);
  }
  return response;
};

// Funcion para manejar el envío del formulario
// https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_forms_through_JavaScript

const setupForm = () => {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Deshabilitar el botón para evitar envíos múltiples y mostrar estado de envío
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    formStatus.textContent = "";
    formStatus.className = "form-feedback";

    // Extraer datos del formulario
    const formData = new FormData(contactForm);
    const name = formData.get("name");
    const surname = formData.get("surname");
    const email = formData.get("email");
    const message = formData.get("message");
    const fullName = `${name} ${surname}`;

    // Generar fecha y hora en formato español para el email del equipo
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES"); // dd/mm/yyyy
    const timeStr = now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }); // HH:MM

    // Preparar los parámetros según las variables del template del email del equipo
    const teamParams = {
      from_name: fullName, // {{from_name}}
      from_email: email, // {{from_email}}
      message: message, // {{message}}
      date: dateStr, // {{date}}
      time: timeStr, // {{time}}
      name: fullName, // {{name}}
      email: email, // {{email}}
      team_email: "YOUR_TEAM_EMAIL_HERE", // {{team_email}}
    };

        // Preparar los parámetros según las variables del template del email del cliente
        const clientParams = {
            name: name,               // {{name}}
            email: email,             // {{email}}
            from_name: "SalmenTravel+" // Fallback for standard fields
        };

        try {
            // Se envian ambos correos electrónicos en paralelo
            await Promise.all([
                sendEmail(EMAILJS_TEAM_TEMPLATE_ID, teamParams),
                sendEmail(EMAILJS_CLIENT_TEMPLATE_ID, clientParams)
            ]);

            // Mensaje de que el envío fue exitoso
            formStatus.textContent = "✨ ¡Mensaje enviado con éxito! ✨ Te contactaremos pronto ✈️❤️";

            formStatus.classList.add("is-success", "show");
            contactForm.reset();

            // Se oculta automáticamente después de 3 segundos.
            setTimeout(() => {
              formStatus.classList.remove("show");
              formStatus.textContent = "";
            }, 3000);


        } catch (error) {
            // Gestión de errores.
            // console.error('EmailJS Error:', error);

            // Mensaje que informa al usuario por si hay algún error.
            formStatus.textContent = "Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo 😔🙏🏻";
            formStatus.classList.add("is-error", "show");

            // Se oculta automáticamente después de 4 segundos.
            setTimeout(() => {
              formStatus.classList.remove("show");
              formStatus.textContent = "";
            }, 4000);


        } finally {
            // Se reseta el estado del botón.
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Mensaje';
        }
    });
};

// Se inicializa el formulario cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  if (contactForm) {
    setupForm();
  }
});

// Se espera a que todo el HTML esté completamente cargado, antes de ejecutar el código
document.addEventListener("DOMContentLoaded", () => {
    // Se selecciona el botón que tiene la clase "back-to-top", ya que será 
    // el botón que cuando se haga click, hará subir la página.
    const backToTopBtn = document.querySelector(".back-to-top");

    // Se añade un evento de tipo "click" al botón.
    backToTopBtn.addEventListener("click", () => {
        // Se encarga de hacer que la ventana se desplace hasta la parte superior de la página.
        window.scrollTo({
            top: 0,                 
            behavior: "smooth"      // Desplazamiento suave
        });
    });
});