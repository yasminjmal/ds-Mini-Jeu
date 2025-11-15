document.addEventListener("DOMContentLoaded", () => {
    const bouton = document.getElementById("btnConfirmer");

    bouton.addEventListener("click", () => {
        const pseudo = document.getElementById("pseudo").value.trim();

        if (pseudo === "") {
            alert("Veuillez entrer un pseudo !");
            return;
        }

        // Stocke le pseudo localement
        localStorage.setItem("pseudo", pseudo);

        // Redirige vers la page du mode de jeu
        window.location.href = "../mode de jeu/mode_jeu.html";
    });
});
