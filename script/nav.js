(function () {
    "use strict";

    var STORAGE_KEY = "pg-nav-collapsed";

    function setLabel(collapsed) {
        var toggle = document.getElementById("navToggle");
        if (!toggle) return;
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.setAttribute(
            "aria-label",
            collapsed ? "Expandir menu" : "Recolher menu"
        );
    }

    document.addEventListener("DOMContentLoaded", function () {
        setLabel(document.documentElement.classList.contains("nav-collapsed"));

        var toggle = document.getElementById("navToggle");
        if (!toggle) return;

        toggle.addEventListener("click", function () {
            var collapsed = !document.documentElement.classList.contains("nav-collapsed");
            document.documentElement.classList.toggle("nav-collapsed", collapsed);
            try {
                localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
            } catch (e) {
                /* localStorage indisponivel - o estado nao persiste, mas o botao continua a funcionar */
            }
            setLabel(collapsed);
        });
    });
})();