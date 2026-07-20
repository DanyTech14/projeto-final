(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var DADOS = window.PG_DADOS;
        if (!DADOS) return;

        var MESES_PT = DADOS.MESES_PT;
        var ESTUDANTES = DADOS.ESTUDANTES;
        var HOJE = DADOS.HOJE;
        var ROTULOS_STATUS = DADOS.ROTULOS_STATUS;
        var obterRegistoDia = DADOS.obterRegistoDia;
        var statusAgregado = DADOS.statusAgregado;

        var tituloMes = document.querySelector(".mes-nav h3");
        var grid = document.querySelector(".grelha-calendario");
        var btnAnterior = document.querySelector('.mes-btn[aria-label="Mês anterior"]');
        var btnSeguinte = document.querySelector('.mes-btn[aria-label="Mês seguinte"]');
        var pills = Array.prototype.slice.call(document.querySelectorAll(".seletor-educandos .pill"));
        var detalheTitulo = document.querySelector(".detalhe-dia h3");
        var detalheLista = document.querySelector(".detalhe-lista");

        if (!grid || !tituloMes) return;

        var estado = {
            ano: HOJE.getFullYear(),
            mes: HOJE.getMonth(),
            estudante: "todos",
            diaSelecionado: 15
        };

        function renderizarDetalhe() {
            var dataTexto = estado.diaSelecionado + " de " + MESES_PT[estado.mes];

            if (!estado.diaSelecionado) {
                detalheTitulo.textContent = "Selecione um dia";
                detalheLista.innerHTML = '<p style="color:var(--texto-suave);font-size:13px;">Clique num dia do calendário para ver os detalhes.</p>';
                return;
            }

            var info = obterRegistoDia(estado.ano, estado.mes, estado.diaSelecionado);
            detalheTitulo.textContent = "Detalhes de " + dataTexto;

            if (info.tipo === "fds") {
                detalheLista.innerHTML = '<p style="color:var(--texto-suave);font-size:13px;">Fim de semana — sem registos letivos.</p>';
                return;
            }
            if (info.tipo === "vazio") {
                detalheLista.innerHTML = '<p style="color:var(--texto-suave);font-size:13px;">Ainda sem registos para este dia.</p>';
                return;
            }

            var registosVisiveis = info.registos.filter(function (r) {
                return estado.estudante === "todos" || r.aluno.id === estado.estudante;
            });

            detalheLista.innerHTML = "";
            registosVisiveis.forEach(function (r) {
                var item = document.createElement("div");
                item.className = "detalhe-item";
                item.innerHTML =
                    '<span class="avatar" style="background:' + r.aluno.fundo + ";color:" + r.aluno.cor + '">' + r.aluno.iniciais + "</span>" +
                    '<div class="detalhe-info"><strong>' + r.aluno.nome + "</strong><span>" +
                    (r.status === "falta" ? "Sem registo" : r.entrada + " · " + r.saida) +
                    "</span></div>" +
                    '<span class="status-' + r.status + '">' + ROTULOS_STATUS[r.status] + "</span>";
                detalheLista.appendChild(item);
            });
        }

        function renderizarGrelha() {
            tituloMes.textContent = MESES_PT[estado.mes] + " " + estado.ano;
            grid.innerHTML = "";

            var primeiroDiaSemana = new Date(estado.ano, estado.mes, 1).getDay();
            var diasNoMes = new Date(estado.ano, estado.mes + 1, 0).getDate();
            var totalCelulas = Math.ceil((primeiroDiaSemana + diasNoMes) / 7) * 7;
            var indiceAnimacao = 0;

            for (var i = 0; i < totalCelulas; i++) {
                var dia = i - primeiroDiaSemana + 1;
                var divDia = document.createElement("div");

                if (dia < 1 || dia > diasNoMes) {
                    divDia.className = "dia dia-vazia";
                    grid.appendChild(divDia);
                    continue;
                }

                var info = obterRegistoDia(estado.ano, estado.mes, dia);
                var eHoje =
                    estado.ano === HOJE.getFullYear() && estado.mes === HOJE.getMonth() && dia === HOJE.getDate();
                var eSelecionado = dia === estado.diaSelecionado;

                var classes = ["dia", "dia-entrar"];
                var pontoHtml = "";

                if (info.tipo === "fds") {
                    classes.push("dia-fds");
                } else {
                    classes.push("dia-letivo");
                    if (eHoje) classes.push("dia-hoje");
                    if (eSelecionado) classes.push("dia-selecionado");

                    var statusDia = "vazio";
                    if (info.tipo === "letivo") {
                        var registosFiltrados =
                            estado.estudante === "todos"
                                ? info.registos
                                : info.registos.filter(function (r) {
                                      return r.aluno.id === estado.estudante;
                                  });
                        statusDia = registosFiltrados.length ? statusAgregado(registosFiltrados) : "vazio";
                    }
                    pontoHtml = '<i class="ponto ponto-' + statusDia + '"></i>';
                }

                divDia.className = classes.join(" ");
                divDia.style.animationDelay = Math.min(indiceAnimacao * 10, 260) + "ms";
                indiceAnimacao++;
                divDia.innerHTML = '<span class="numero">' + dia + "</span>" + pontoHtml;

                if (info.tipo !== "fds") {
                    divDia.setAttribute("role", "button");
                    divDia.setAttribute("tabindex", "0");
                    divDia.setAttribute("aria-label", "Dia " + dia + " de " + MESES_PT[estado.mes]);
                    (function (diaClicado) {
                        divDia.addEventListener("click", function () {
                            estado.diaSelecionado = diaClicado;
                            renderizarGrelha();
                            renderizarDetalhe();
                        });
                        divDia.addEventListener("keydown", function (evento) {
                            if (evento.key === "Enter" || evento.key === " ") {
                                evento.preventDefault();
                                estado.diaSelecionado = diaClicado;
                                renderizarGrelha();
                                renderizarDetalhe();
                            }
                        });
                    })(dia);
                }

                grid.appendChild(divDia);
            }
        }

        btnAnterior.addEventListener("click", function () {
            estado.mes--;
            if (estado.mes < 0) {
                estado.mes = 11;
                estado.ano--;
            }
            renderizarGrelha();
            renderizarDetalhe();
        });

        btnSeguinte.addEventListener("click", function () {
            estado.mes++;
            if (estado.mes > 11) {
                estado.mes = 0;
                estado.ano++;
            }
            renderizarGrelha();
            renderizarDetalhe();
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

                renderizarGrelha();
                renderizarDetalhe();
            });
        });

        renderizarGrelha();
        renderizarDetalhe();
    });
})();