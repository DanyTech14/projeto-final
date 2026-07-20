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
        if (toggle) {
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
        }
    });

    /* ---------- Menu de perfil (Configurações / Sair) ---------- */
    document.addEventListener("DOMContentLoaded", function () {
        var abrirBotao = document.getElementById("btnPerfilToggle");
        var dropdown = document.getElementById("perfilDropdown");
        var btnSair = document.getElementById("btnSair");

        if (abrirBotao && dropdown) {
            function fecharDropdown() {
                dropdown.hidden = true;
                abrirBotao.setAttribute("aria-expanded", "false");
            }

            abrirBotao.addEventListener("click", function (evento) {
                evento.stopPropagation();
                var estaAberto = !dropdown.hidden;
                dropdown.hidden = estaAberto;
                abrirBotao.setAttribute("aria-expanded", String(!estaAberto));
            });

            document.addEventListener("click", function (evento) {
                if (!dropdown.hidden && !dropdown.contains(evento.target) && evento.target !== abrirBotao) {
                    fecharDropdown();
                }
            });

            document.addEventListener("keydown", function (evento) {
                if (evento.key === "Escape" && !dropdown.hidden) {
                    fecharDropdown();
                    abrirBotao.focus();
                }
            });
        }

        if (btnSair) {
            btnSair.addEventListener("click", function () {
                try {
                    /* Limpa apenas preferências locais de UI, nunca dados de sessão
                       sensíveis (não existem neste protótipo, mas fica como aviso
                       para quando houver um token real de sessão). */
                    localStorage.removeItem(STORAGE_KEY);
                } catch (e) {}
                window.location.href = "login.html";
            });
        }
    });
})();