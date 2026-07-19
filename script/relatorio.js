(function () {
    "use strict";

    var HOJE = new Date(2026, 6, 16);
    var MESES_PT = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    var ESTUDANTES = [
        { id: "joao", nome: "João Silvestre", turma: "9ª A", iniciais: "JS", fundo: "#e4ecf1", cor: "#2d5064" },
        { id: "joana", nome: "Joana Silvestre", turma: "8ª A", iniciais: "JS", fundo: "#f2e6ef", cor: "#a15b8f" },
        { id: "rafael", nome: "Rafael Silvestre", turma: "5ª A", iniciais: "RS", fundo: "#e6efe8", cor: "#4a7c59" }
    ];

    var ROTULOS_STATUS = { presente: "Presente", atraso: "Atraso", falta: "Falta" };

    function hash(texto) {
        var h = 0;
        for (var i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
        return h;
    }

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function formatarData(data) {
        return pad(data.getDate()) + "/" + pad(data.getMonth() + 1) + "/" + data.getFullYear();
    }

    function gerarDataset() {
        var registos = [];
        var cursor = new Date(HOJE);
        var diasLetivosGerados = 0;

        while (diasLetivosGerados < 16) {
            var diaSemana = cursor.getDay();
            if (diaSemana !== 0 && diaSemana !== 6) {
                var dataStr = cursor.getFullYear() + "-" + (cursor.getMonth() + 1) + "-" + cursor.getDate();
                ESTUDANTES.forEach(function (aluno, indice) {
                    var r = hash(dataStr + "#" + aluno.id) % 100;
                    var status = r < 7 ? "falta" : r < 20 ? "atraso" : "presente";
                    var h = hash(dataStr + "-h-" + indice);
                    var minEntrada = 15 + (h % 30) + (status === "atraso" ? 20 : 0);
                    var minSaida = 5 + ((h >> 3) % 30);
                    registos.push({
                        data: new Date(cursor),
                        aluno: aluno,
                        status: status,
                        entrada: status === "falta" ? "--" : "07:" + pad(minEntrada % 60),
                        saida: status === "falta" ? "--" : "12:" + pad(minSaida)
                    });
                });
                diasLetivosGerados++;
            }
            cursor.setDate(cursor.getDate() - 1);
        }
        return registos;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var tbody = document.querySelector(".table-relatorio tbody");
        var pills = Array.prototype.slice.call(document.querySelectorAll(".seletor-educandos .pill"));
        var selectPeriodo = document.querySelector('.filtros select[aria-label="Filtrar por período"]');
        var selectTurma = document.querySelector('.filtros select[aria-label="Filtrar por turma"]');
        var selectEstado = document.querySelector('.filtros select[aria-label="Filtrar por estado"]');
        var spanPaginacao = document.querySelector(".paginacao span");
        var btnAnterior = document.querySelector(".pg-btn:first-child");
        var btnSeguinte = document.querySelector(".pg-btn:last-child");
        var btnExportar = document.querySelector(".btn-exportar");

        if (!tbody) return;

        var DATASET = gerarDataset();
        var estado = { pagina: 1, porPagina: 7, estudante: "todos" };
        var PORTPAGINA = 7;

        function registosFiltrados() {
            var periodo = selectPeriodo.value;
            var turma = selectTurma.value;
            var estadoFiltro = selectEstado.value;

            return DATASET.filter(function (r) {
                var correspondePeriodo =
                    periodo === "Ano letivo 2025/2026" ||
                    periodo === MESES_PT[r.data.getMonth()] + " " + r.data.getFullYear();
                var correspondeTurma = turma === "Todas as turmas" || r.aluno.turma === turma;
                var correspondeEstado =
                    estadoFiltro === "Todos os estados" || ROTULOS_STATUS[r.status] === estadoFiltro;
                var correspondeAluno = estado.estudante === "todos" || r.aluno.id === estado.estudante;
                return correspondePeriodo && correspondeTurma && correspondeEstado && correspondeAluno;
            });
        }

        function renderizar() {
            var filtrados = registosFiltrados();
            var totalPaginas = Math.max(Math.ceil(filtrados.length / PORTPAGINA), 1);
            estado.pagina = Math.min(estado.pagina, totalPaginas);

            var inicio = (estado.pagina - 1) * PORTPAGINA;
            var pagina = filtrados.slice(inicio, inicio + PORTPAGINA);

            tbody.innerHTML = "";

            if (!pagina.length) {
                var vazio = document.createElement("tr");
                vazio.innerHTML =
                    '<td colspan="6" style="text-align:center;color:var(--texto-suave);padding:30px 12px;">Nenhum registo encontrado com estes filtros.</td>';
                tbody.appendChild(vazio);
            }

            pagina.forEach(function (r) {
                var tr = document.createElement("tr");
                tr.className = "pg-realce";
                tr.innerHTML =
                    "<td>" + formatarData(r.data) + "</td>" +
                    '<td class="aluno-cel"><span class="avatar" style="background:' + r.aluno.fundo + ";color:" + r.aluno.cor + '">' + r.aluno.iniciais + "</span>" + r.aluno.nome + "</td>" +
                    "<td>" + r.aluno.turma + "</td>" +
                    "<td>" + r.entrada + "</td>" +
                    "<td>" + r.saida + "</td>" +
                    '<td><span class="status-' + r.status + '">' + ROTULOS_STATUS[r.status] + "</span></td>";
                tbody.appendChild(tr);
            });

            spanPaginacao.textContent = "A mostrar " + pagina.length + " de " + filtrados.length + " registos";
            btnAnterior.disabled = estado.pagina <= 1;
            btnSeguinte.disabled = estado.pagina >= totalPaginas;
        }

        [selectPeriodo, selectTurma, selectEstado].forEach(function (select) {
            select.addEventListener("change", function () {
                estado.pagina = 1;
                renderizar();
            });
        });

        pills.forEach(function (pill, indicePill) {
            pill.addEventListener("click", function () {
                pills.forEach(function (p) {
                    p.classList.remove("pill-ativa");
                    p.setAttribute("aria-selected", "false");
                });
                pill.classList.add("pill-ativa");
                pill.setAttribute("aria-selected", "true");

                estado.estudante = indicePill === 0 ? "todos" : (ESTUDANTES[indicePill - 1] || {}).id || "todos";
                estado.pagina = 1;
                renderizar();
            });
        });

        btnAnterior.addEventListener("click", function () {
            if (estado.pagina > 1) {
                estado.pagina--;
                renderizar();
            }
        });
        btnSeguinte.addEventListener("click", function () {
            estado.pagina++;
            renderizar();
        });

        if (btnExportar) {
            btnExportar.addEventListener("click", function () {
                var total = registosFiltrados().length;
                var textoOriginal = btnExportar.innerHTML;
                btnExportar.classList.add("pg-a-processar");
                btnExportar.innerHTML = '<span class="pg-spinner"></span>A gerar relatório…';

                window.setTimeout(function () {
                    btnExportar.classList.remove("pg-a-processar");
                    btnExportar.innerHTML = textoOriginal;
                    PG.toast(total + " registo(s) prontos para exportação.", "sucesso");
                }, 900);
            });
        }

        renderizar();
    });
})();