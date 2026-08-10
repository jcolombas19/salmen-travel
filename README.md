<div align="center">

![SalmenTravel+](https://capsule-render.vercel.app/api?type=waving&color=0:FFD1C1,100:FF7E5F&height=200&text=🐟%20SalmenTravel%2B&fontSize=55&fontColor=FFFFFF&fontAlignY=38&desc=Your%20digital%20travel%20notebook%20✈️&descSize=18&descAlignY=58)

*"What if planning a trip could feel like writing in a real travel journal?"*

SalmenTravel+ turns trip planning into a narrative experience -
warm tones, layered paper, and a journal that fills up as you dream. 🧳

![HTML5](https://img.shields.io/badge/HTML5-FF7E5F?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-F76C5E?style=for-the-badge&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-E85D4C?style=for-the-badge&logo=javascript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-D14836?style=for-the-badge&logo=googlegemini&logoColor=white)
![OpenWeather](https://img.shields.io/badge/OpenWeatherMap-C23B2E?style=for-the-badge&logo=openweathermap&logoColor=white)
![EmailJS](https://img.shields.io/badge/EmailJS-B02A22?style=for-the-badge&logo=gmail&logoColor=white)

</div>

---

## ✨ What it does

- **Trip planner** - create, edit and delete trips with destination, dates, cover image and activity counter.
- **Daily agenda** - each trip generates a day-by-day planner from its real date range, with activities you can add, edit and delete.
- **Live weather** - current conditions & forecast via OpenWeatherMap, styled to match the journal aesthetic.
- **Chat with Salmen** - an AI travel assistant powered by Google Gemini that suggests destinations, activities and planning ideas.
- **Contact form** - real emails sent via EmailJS, with confirmation to the user and notification to the admin.
- **No backend needed** - everything is saved in your browser with localStorage.

## 🎨 The look & feel

SalmenTravel+ is designed to feel like **writing in a real travel journal**,
not filling out a form. The UI - designed from scratch in Figma - simulates
an open journal with a central binding, warm natural tones, layered paper
textures and handwritten-style typography. Even the weather data is
translated into a custom visual system that matches the journal aesthetic,
so documenting a trip feels like part of the journey itself. 📖✈️

## 🛠️ How it's built

Pure **HTML + CSS + JavaScript** - no frameworks, no build step.
The AI chat loads the Gemini SDK directly in the browser using import maps,
REST APIs are consumed with the Fetch API, and all data lives in
`localStorage`, so the whole app runs as static files.

## 🚀 Run it

1. Clone the repo
2. Add your own API keys:
   - [Google Gemini](https://aistudio.google.com/apikey) → `assets/js/aiSuggestions.js`
   - [OpenWeatherMap](https://openweathermap.org/api) → `assets/js/clima-detalle.js`, `assets/js/viajes/nuevoViaje.js` and `assets/js/viajes/modificarViaje.js`
   - [EmailJS](https://www.emailjs.com/) → `assets/js/aboutUs.js`
     (create a free account, an email service and two templates -
     team notification and client confirmation - then copy their IDs)
3. Serve the folder with any static server (e.g. the VS Code **Live Server** extension) and open `index.html`
