(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        /* Contagem animada dos números de destaque */
        document.querySelectorAll(".cards .card h2").forEach(function (el) {
            var texto = el.textContent.trim();
            var sufixo = texto.endsWith("%") ? "%" : "";
            var alvo = parseInt(texto, 10);
            if (!isNaN(alvo)) {
                el.textContent = "0" + sufixo;
                PG.contarAte(el, alvo, { sufixo: sufixo, duracao: 800 });
            }
        });

        /* Pesquisa em tempo real sobre o resumo de frequência */
        var input = document.querySelector(".cabecalho input");
        var tabela = document.querySelector(".relatorio table tbody");
        if (!input || !tabela) return;

        var linhas = Array.prototype.slice.call(tabela.querySelectorAll("tr"));
        var semResultados = document.createElement("tr");
        semResultados.hidden = true;
        semResultados.innerHTML = '<td colspan="4" style="text-align:center;color:var(--texto-suave);padding:26px 12px;">Nenhum registo encontrado.</td>';
        tabela.appendChild(semResultados);

        var aplicarFiltro = PG.debounce(function () {
            var termo = input.value.trim().toLowerCase();
            var visiveis = 0;

            linhas.forEach(function (linha) {
                var corresponde = !termo || linha.textContent.toLowerCase().indexOf(termo) !== -1;
                if (corresponde) {
                    linha.hidden = false;
                    linha.classList.remove("pg-sair");
                    linha.classList.add("pg-realce");
                    visiveis++;
                } else {
                    linha.hidden = true;
                }
            });

            semResultados.hidden = visiveis !== 0;
        }, 150);

        input.addEventListener("input", aplicarFiltro);
    });
})();