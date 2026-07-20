(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var DADOS = window.PG_DADOS;
        if (!DADOS) return;

        // O Painel ainda não tem seletor de educando (ver seletor-educandos no
        // Relatório), por isso mostra por omissão o primeiro educando da lista.
        // Para agregar os 3 educandos, trocar este filtro por DADOS.DATASET todo.
        var alunoPrincipal = DADOS.ESTUDANTES[0];
        var registosAluno = DADOS.DATASET.filter(function (r) {
            return r.aluno.id === alunoPrincipal.id;
        });

        // Mesmo critério de "mês atual" usado por omissão no Relatório, para
        // que os dois ecrãs mostrem sempre o mesmo período.
        var mesAtual = DADOS.MESES_PT[DADOS.HOJE.getMonth()] + " " + DADOS.HOJE.getFullYear();
        var registosMes = registosAluno.filter(function (r) {
            return DADOS.MESES_PT[r.data.getMonth()] + " " + r.data.getFullYear() === mesAtual;
        });

        var totalDias = registosMes.length;
        var diasPresentes = registosMes.filter(function (r) { return r.status === "presente"; }).length;
        var diasAtraso = registosMes.filter(function (r) { return r.status === "atraso"; }).length;
        var diasFalta = registosMes.filter(function (r) { return r.status === "falta"; }).length;
        var percentagem = totalDias ? Math.round(((diasPresentes + diasAtraso) / totalDias) * 100) : 0;

        // ---- Cartões "Presenças / Atrasos / Faltas" ----
        var cardPresencasValor = document.querySelector(".cards .card:nth-child(1) h2");
        var cardPresencasTexto = document.querySelector(".cards .card:nth-child(1) p");
        var cardAtrasosValor = document.querySelector(".cards .card:nth-child(2) h2");
        var cardFaltasValor = document.querySelector(".cards .card:nth-child(3) h2");

        if (cardPresencasValor) cardPresencasValor.textContent = percentagem + "%";
        if (cardPresencasTexto) cardPresencasTexto.textContent = diasPresentes + " dias presentes";
        if (cardAtrasosValor) cardAtrasosValor.textContent = String(diasAtraso);
        if (cardFaltasValor) cardFaltasValor.textContent = String(diasFalta);

        // ---- Cartões "Entrada / Saída" de hoje ----
        var registoHoje = registosAluno.filter(function (r) {
            return DADOS.formatarData(r.data) === DADOS.formatarData(DADOS.HOJE);
        })[0];

        var cardEntrada = document.querySelector(".entrada .card2:nth-child(1)");
        var cardSaida = document.querySelector(".entrada .card2:nth-child(2)");

        if (registoHoje && cardEntrada && cardSaida) {
            var horaEntrada = cardEntrada.querySelector(".hora");
            var dataEntrada = cardEntrada.querySelector(".data");
            var estadoEntrada = cardEntrada.querySelector(".estado");

            var horaSaida = cardSaida.querySelector(".hora");
            var dataSaida = cardSaida.querySelector(".data");
            var estadoSaida = cardSaida.querySelector(".estado");

            if (horaEntrada) horaEntrada.textContent = registoHoje.entrada;
            if (dataEntrada) dataEntrada.innerHTML = "<strong>📅</strong> " + DADOS.formatarData(registoHoje.data);
            if (estadoEntrada) {
                if (registoHoje.status === "falta") {
                    estadoEntrada.className = "estado status-falta";
                    estadoEntrada.textContent = "✕ Falta";
                } else if (registoHoje.status === "atraso") {
                    estadoEntrada.className = "estado status-atraso";
                    estadoEntrada.textContent = "! Atraso";
                } else {
                    estadoEntrada.className = "estado estado-positivo";
                    estadoEntrada.textContent = "✓ A tempo";
                }
            }

            if (horaSaida) horaSaida.textContent = registoHoje.saida;
            if (dataSaida) dataSaida.innerHTML = "<strong>📅</strong> " + DADOS.formatarData(registoHoje.data);
            if (estadoSaida) {
                if (registoHoje.status === "falta") {
                    estadoSaida.className = "estado status-falta";
                    estadoSaida.textContent = "✕ Sem registo";
                } else {
                    estadoSaida.className = "estado estado-info";
                    estadoSaida.textContent = "✓ Registada";
                }
            }
        }

        // ---- Tabela "Resumo de Frequência" — últimos 5 registos do educando ----
        var tabela = document.querySelector(".relatorio table tbody");
        if (tabela) {
            tabela.innerHTML = "";
            registosAluno.slice(0, 5).forEach(function (r) {
                var tr = document.createElement("tr");
                tr.innerHTML =
                    "<td>" + DADOS.formatarData(r.data) + "</td>" +
                    "<td>" + r.entrada + "</td>" +
                    "<td>" + r.saida + "</td>" +
                    '<td><span class="' + r.status + '">' + DADOS.ROTULOS_STATUS[r.status] + "</span></td>";
                tabela.appendChild(tr);
            });
        }

        // ---- Animação de contagem dos cartões (mantém comportamento existente) ----
        document.querySelectorAll(".cards .card h2").forEach(function (el) {
            var texto = el.textContent.trim();
            var sufixo = texto.endsWith("%") ? "%" : "";
            var alvo = parseInt(texto, 10);
            if (!isNaN(alvo)) {
                el.textContent = "0" + sufixo;
                PG.contarAte(el, alvo, { sufixo: sufixo, duracao: 800 });
            }
        });

        // ---- Pesquisa/filtro na tabela (mantém comportamento existente) ----
        var input = document.querySelector(".cabecalho input");
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