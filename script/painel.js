(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var DADOS = window.PG_DADOS;
        if (!DADOS) return;

        var mesAtual = DADOS.MESES_PT[DADOS.HOJE.getMonth()] + " " + DADOS.HOJE.getFullYear();

        function registosDoAluno(alunoId) {
            return DADOS.DATASET.filter(function (r) { return r.aluno.id === alunoId; });
        }

        function registosDoMes(registosAluno) {
            return registosAluno.filter(function (r) {
                return DADOS.MESES_PT[r.data.getMonth()] + " " + r.data.getFullYear() === mesAtual;
            });
        }

        /* ---------- Cartão de resumo — um por educando ---------- */
        var containerCards = document.getElementById("cardsAlunos");

        if (containerCards) {
            containerCards.innerHTML = "";

            DADOS.ESTUDANTES.forEach(function (aluno) {
                var registosAluno = registosDoAluno(aluno.id);
                var registosMes = registosDoMes(registosAluno);

                var totalDias = registosMes.length;
                var diasPresentes = registosMes.filter(function (r) { return r.status === "presente"; }).length;
                var diasAtraso = registosMes.filter(function (r) { return r.status === "atraso"; }).length;
                var diasFalta = registosMes.filter(function (r) { return r.status === "falta"; }).length;
                var percentagem = totalDias ? Math.round(((diasPresentes + diasAtraso) / totalDias) * 100) : 0;

                var card = document.createElement("div");
                card.className = "card-aluno";
                card.dataset.id = aluno.id;
                card.innerHTML =
                    '<div class="card-aluno-cabecalho">' +
                        '<span class="avatar" style="background:' + aluno.fundo + ";color:" + aluno.cor + '">' + aluno.iniciais + "</span>" +
                        '<div class="card-aluno-info"><strong>' + aluno.nome + "</strong><span>" + aluno.turma + "</span></div>" +
                    "</div>" +
                    '<div class="card-aluno-stats">' +
                        '<div><strong class="valor-presenca">0%</strong><span>Presença</span></div>' +
                        '<div><strong class="valor-atrasos">0</strong><span>Atrasos</span></div>' +
                        '<div><strong class="valor-faltas">0</strong><span>Faltas</span></div>' +
                    "</div>";

                containerCards.appendChild(card);

                PG.contarAte(card.querySelector(".valor-presenca"), percentagem, { sufixo: "%", duracao: 800 });
                PG.contarAte(card.querySelector(".valor-atrasos"), diasAtraso, { duracao: 800 });
                PG.contarAte(card.querySelector(".valor-faltas"), diasFalta, { duracao: 800 });
            });
        }

        /* ---------- Seletor de educando — controla Entrada/Saída + tabela ---------- */
        var pills = Array.prototype.slice.call(document.querySelectorAll(".seletor-educandos .pill"));
        var tabela = document.querySelector(".relatorio table tbody");
        var tituloResumo = document.getElementById("tituloResumoAluno");
        var cardEntrada = document.querySelector(".entrada .card2:nth-child(1)");
        var cardSaida = document.querySelector(".entrada .card2:nth-child(2)");
        var input = document.querySelector(".cabecalho input");

        var estado = { estudante: DADOS.ESTUDANTES[0].id };
        var linhas = [];
        var semResultados = null;

        function alunoAtual() {
            return DADOS.ESTUDANTES.filter(function (a) { return a.id === estado.estudante; })[0];
        }

        function renderizarEntradaSaida() {
            if (!cardEntrada || !cardSaida) return;

            var registosAluno = registosDoAluno(estado.estudante);
            var registoHoje = registosAluno.filter(function (r) {
                return DADOS.formatarData(r.data) === DADOS.formatarData(DADOS.HOJE);
            })[0];

            if (!registoHoje) return;

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

        function aplicarFiltroPesquisa() {
            if (!input) return;
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

            if (semResultados) semResultados.hidden = visiveis !== 0;
        }

        function renderizarTabela() {
            if (!tabela) return;

            var aluno = alunoAtual();
            if (tituloResumo && aluno) {
                tituloResumo.textContent = "Resumo de Frequência — " + aluno.nome.split(" ")[0];
            }

            var registosAluno = registosDoAluno(estado.estudante);

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

            semResultados = document.createElement("tr");
            semResultados.hidden = true;
            semResultados.innerHTML = '<td colspan="4" style="text-align:center;color:var(--texto-suave);padding:26px 12px;">Nenhum registo encontrado.</td>';
            tabela.appendChild(semResultados);

            linhas = Array.prototype.slice.call(tabela.querySelectorAll("tr")).filter(function (tr) {
                return tr !== semResultados;
            });

            aplicarFiltroPesquisa();
        }

        function selecionarAluno(id) {
            estado.estudante = id;
            renderizarEntradaSaida();
            renderizarTabela();
        }

        pills.forEach(function (pill, indicePill) {
            pill.addEventListener("click", function () {
                pills.forEach(function (p) {
                    p.classList.remove("pill-ativa");
                    p.setAttribute("aria-selected", "false");
                });
                pill.classList.add("pill-ativa");
                pill.setAttribute("aria-selected", "true");

                var aluno = DADOS.ESTUDANTES[indicePill];
                if (aluno) selecionarAluno(aluno.id);
            });
        });

        renderizarEntradaSaida();
        renderizarTabela();

        if (input) {
            input.addEventListener("input", PG.debounce(aplicarFiltroPesquisa, 150));
        }
    });
})();