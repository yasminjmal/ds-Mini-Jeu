document.addEventListener("DOMContentLoaded", () => {
    // Affiche le pseudo depuis le localStorage
    const pseudo = localStorage.getItem("pseudo");
    const affichePseudo = document.getElementById("affichePseudo");

    if (pseudo) {
        affichePseudo.textContent = pseudo;
    } else {
        // Si aucun pseudo, retour à la page d'accueil
        window.location.href = "../home page/home.html";
    }

    // Bouton retour
    document.getElementById("btnRetour").addEventListener("click", () => {
        window.location.href = "../home page/home.html";
    });

    // Bouton Free Mood
    document.getElementById("freeMood").addEventListener("click", () => {
        window.location.href = "../FREE/free_mood.html";
    });

    // Bouton Levels Mood
    document.getElementById("levelsMood").addEventListener("click", () => {
        window.location.href = "../Levels/levels_mood.html";
    });
});
