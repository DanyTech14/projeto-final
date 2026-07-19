/* ==========================================================================
   Presence Guard — Utilitários partilhados
   Toasts, contagem animada de números e pequenos helpers de DOM.
   Carregar depois de nav.js e antes do script específico da página.
   ========================================================================== */

var PG = (function () {
    "use strict";

    function garantirRegiaoToast() {
        var regiao = document.getElementById("toast-region");
        if (!regiao) {
            regiao = document.createElement("div");
            regiao.id = "toast-region";
            regiao.className = "toast-region";
            regiao.setAttribute("aria-live", "polite");
            document.body.appendChild(regiao);
        }
        return regiao;
    }

    var ICONES = {
        sucesso: "✓",
        erro: "⚠",
        info: "ℹ"
    };

    function toast(mensagem, tipo) {
        tipo = tipo || "info";
        var regiao = garantirRegiaoToast();
        var el = document.createElement("div");
        el.className = "toast toast-" + tipo;
        el.setAttribute("role", "status");
        el.innerHTML =
            '<span class="toast-icone">' + (ICONES[tipo] || ICONES.info) + "</span><span>" + mensagem + "</span>";
        regiao.appendChild(el);

        window.setTimeout(function () {
            el.classList.add("pg-sair");
            window.setTimeout(function () {
                el.remove();
            }, 220);
        }, 2600);
    }

    /* Anima um número inteiro (opcionalmente com sufixo, ex: "%") dentro do
       texto de um elemento, do valor atual até "alvo". */
    function contarAte(el, alvo, opcoes) {
        opcoes = opcoes || {};
        var sufixo = opcoes.sufixo || "";
        var duracao = opcoes.duracao || 700;
        var atual = parseInt(el.textContent, 10);
        if (isNaN(atual)) atual = 0;

        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            el.textContent = alvo + sufixo;
            return;
        }

        el.classList.add("pg-contagem");
        var inicio = null;
        function passo(timestamp) {
            if (inicio === null) inicio = timestamp;
            var progresso = Math.min((timestamp - inicio) / duracao, 1);
            var valor = Math.round(atual + (alvo - atual) * (1 - Math.pow(1 - progresso, 3)));
            el.textContent = valor + sufixo;
            if (progresso < 1) {
                window.requestAnimationFrame(passo);
            } else {
                el.textContent = alvo + sufixo;
            }
        }
        window.requestAnimationFrame(passo);
    }

    /* Remove um elemento da DOM depois de tocar a animação de saída
       (classe .pg-sair definida em animations.css). */
    function removerComAnimacao(el, callback) {
        el.classList.add("pg-sair");
        el.addEventListener(
            "animationend",
            function () {
                el.remove();
                if (typeof callback === "function") callback();
            },
            { once: true }
        );
        // segurança: garante remoção mesmo que o evento não dispare
        window.setTimeout(function () {
            if (el.parentNode) el.remove();
        }, 500);
    }

    function debounce(fn, espera) {
        var temporizador;
        return function () {
            var contexto = this,
                args = arguments;
            window.clearTimeout(temporizador);
            temporizador = window.setTimeout(function () {
                fn.apply(contexto, args);
            }, espera);
        };
    }

    return {
        toast: toast,
        contarAte: contarAte,
        removerComAnimacao: removerComAnimacao,
        debounce: debounce
    };
})();