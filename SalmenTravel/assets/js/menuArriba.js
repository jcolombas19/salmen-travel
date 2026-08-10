// Se selecciona el botón del menú hamburguesa.
const buttonHamburguer = document.querySelector("#hamburguer");
// Se selecciona el botón para cerrar el menú.
const buttonMenuClose = document.querySelector("#closeMenuButton");
// Se selecciona el contenedor del menú desplegable.
const menu = document.querySelector("#menu");

// Cuando el usuario hace click en el botón hamburguesa, se añade
// la clase "show" al menú para hacerlo visible.
buttonHamburguer.addEventListener("click", () => {
    menu.classList.add("show");
});

// Cuando el usuario hace click en el botón de cerrar, se elimina
// la clase "show" y el menú vuelve a ocultarse.
buttonMenuClose.addEventListener("click", () => {
    menu.classList.remove("show");
});