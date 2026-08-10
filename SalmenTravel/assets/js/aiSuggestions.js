import { GoogleGenerativeAI } from "@google/generative-ai";
import { parse } from "marked";

// --- CONFIGURACIÓN GENERAL DEL ASISTENTE ---

// Clave de acceso a la API de Google Generative AI
const API_KEY = "PON_AQUI_TU_API_KEY";
// Instrucciones del sistema que definen el comportamiento del asistente. Aquí,
// se establece la personalidad, idioma, formato y límites de Salmen.
const SYSTEM_INSTRUCTION = `
Eres un asistente de viajes amigable y entusiasta llamado Salmen. 
1. Rol: Actúa como un experto explorador de viajes. Usa emojis frecuentemente.
2. Idioma: RESPONDE SIEMPRE EN ESPAÑOL.
3. Formato: Usa Markdown. Pon en negrita los nombres de ciudades. Usa viñetas para actividades. Mantén los párrafos cortos.
4. Estructura: [Nombre del Destino] [Bandera]. Breve descripción. Lista de Top 3 Actividades.
5. Límites: NO reserves billetes. Si el tema no es de viajes, declina educadamente. Máximo 3 sugerencias.
`;

// --- ELEMENTOS DEL DOM ---

// Contenedor principal donde se muestran los mensajes del chat.
const chatWindow = document.getElementById('chatWindow');
// Campo de texto donde el usuario escribe su mensaje.
const userInput = document.getElementById('userInput');
// Botón para enviar el mensaje.
const sendBtn = document.getElementById('sendBtn');
// Indicador visual que muestra que la IA está escribiendo.
const typingIndicator = document.getElementById('typingIndicator');

// --- INICIALIZAR API Y SESIÓN ---

// Se crea una instancia del cliente de Google Generative AI.
const genAI = new GoogleGenerativeAI(API_KEY);
// Se obtiene el modelo generativo, especificando: el modelo a utilizar y
// las instrucciones del sistema.
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction: SYSTEM_INSTRUCTION
});

// Se inicia una sesión de chat persistente para mantener el contexto de la conversación 
// entre mensajes, y así ahorrar memoria.
const chatSession = model.startChat({
    // Historial inicial de la conversación.
    history: [
        {
            role: "user",
            parts: [{ text: "Hola" }],
        },
        {
            role: "model",
            parts: [{ text: "¡Hola! Estoy aquí para ayudarte a encontrar tu próxima aventura. ✈️ ¡Dime qué tipo de paisaje disfrutas!" }],
        },
    ],
    // Configuración de generación de texto
    generationConfig: {
        maxOutputTokens: 2000,  // Límite máximo de tokens por respuesta
        temperature: 0.8,       // Nivel de creatividad del modelo.
    }
});

// --- FUNCIONES PRINCIPALES ---

async function sendMessage() {
    // Se obtiene el texto introducido por el usuario.
    const text = userInput.value.trim();
    // Condición que indica que si el campo está vacío, no se envía nada.
    if (!text) return;

    // 1. Se añade el mensaje del usuario a la interfaz.
    addMessageToUI(text, 'user');

    // Se limpia el input.
    userInput.value = '';
    
    // 2. Se muestra el indicador de que la IA está escribiendo.
    typingIndicator.style.display = 'block';

    // Se desactiva el botón de enviar para evitar envíos múltiples.
    sendBtn.disabled = true;

    // Se hace un scroll automático al final del chat.
    chatWindow.scrollTop = chatWindow.scrollHeight; 

    try {
        // 3. Se envía el mensaje del usuario a la sesión del chat.
        const result = await chatSession.sendMessage(text);

        // Se obtiene el texto de respuesta del modelo.
        const responseText = result.response.text();

        // 4. Se actualiza la interfaz con la respuesta de la IA.
        typingIndicator.style.display = 'none';
        sendBtn.disabled = false;
        addMessageToUI(responseText, 'ai');

    } catch (error) {
        //console.error("Error:", error);

        // Se oculta el indicador y se reactica el botón.
        typingIndicator.style.display = 'none';
        sendBtn.disabled = false;

        // Se muestra un mensaje de error en el chat.
        addMessageToUI("⚠️ Lo siento, tuve un problema de conexión. ⚠️ Inténtalo de nuevo.", 'ai');
    }
}

function addMessageToUI(text, sender) {
  // Contenedor principal del mensaje
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  // Contenedor del contenido del mensaje
  const contentDiv = document.createElement("div");
  contentDiv.classList.add("message-content");

    // Se intenta parsear el texto como Markdown a HTML.
    let parsedContent;
    try {
        parsedContent = parse(text);
    } catch (error) {
        // Si falla el parseo, se usa el texto plano.
        parsedContent = text;
    }

    // Se crea un contenedor temporal para convertir el HTML en nodos reales del DOM.
    const tempWrapper = document.createElement("div");
    tempWrapper.innerHTML = parsedContent;

    // Bucle para mover los nodos parseados al contenedor del mensaje.
    while (tempWrapper.firstChild) {
        contentDiv.appendChild(tempWrapper.firstChild);
    }

    // Se crea el temestamp del mensaje.
    const timeSpan = document.createElement("span");
    timeSpan.classList.add("timestamp");

  const time = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  timeSpan.textContent = time;

    // Se ensamblan las partes del mensaje
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);

    // El mensaje se inserta justo antes del indicador de escritura.
    chatWindow.insertBefore(messageDiv, typingIndicator);

    // Scroll automático al último mensaje.
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- EVENT LISTENERS ---

// Se envía un mensaje al hacer click en el botón.
sendBtn.addEventListener('click', sendMessage);

// Se envía un mensaje al pulsar la tecla Enter.
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Referencias a los botones que abren y cierran el chat.
const botButton = document.getElementById("botButton");
const closeButton = document.getElementById("closeButton");

// Función que se encarga de la animación del apartado de IA. Se encarga de
// alternar la clase "is-flipped", que activa la animación 3D definida en el CSS,
// permitiendo mostrar u ocultar la parte trasera del "teléfono".
function toggleChat() {
  const card = document.getElementById("chatCard");
  card.classList.toggle("is-flipped");
}

// Cuando se hace click en el icono del bot (Salmen), se ejecuta la animación
// para mostrar el chat.
botButton.addEventListener("click", e => toggleChat())
closeButton.addEventListener("click", e => toggleChat())

// Referencias al contenedor completo del chat y al área interna donde están
// los mensajes.
const cardBack = document.querySelector(".card-back");
const chatBody = document.querySelector(".chat-body");

// // Se captura el evento de la rueda del ratón sobre el teléfono.
cardBack.addEventListener("wheel", (e) => {
        // Se cancela el comportamiento por defecto del navegador
        // para evitar que el body haga scroll.
        e.preventDefault();
        // Se redirige manualmente el movimiento de la rueda al contenedor
        // de mensajes (.chat-body).
        chatBody.scrollTop += e.deltaY;
        },
      // Se pone passive a false para permitir el uso de preventDefault() en 
      // eventos de tipo "wheel".
    { passive: false }

);