(function () {
    "use strict";

    var MESES_PT = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    var DIAS_PT = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

    var ESTUDANTES = [
        { id: "joao", nome: "João Silvestre", iniciais: "JS", cor: "#2d5064", fundo: "#e4ecf1" },
        { id: "joana", nome: "Joana Silvestre", iniciais: "JS", cor: "#a15b8f", fundo: "#f2e6ef" },
        { id: "rafael", nome: "Rafael Silvestre", iniciais: "RS", cor: "#4a7c59", fundo: "#e6efe8" }
    ];

    var HOJE = new Date(2026, 6, 16);

    var AGREGADO_JULHO_2026 = {
        1: "presente", 2: "presente", 3: "atraso",
        6: "presente", 7: "presente", 8: "presente", 9: "falta", 10: "presente",
        13: "falta", 14: "presente", 15: "atraso", 16: "presente"
    };

    var ROTULOS_STATUS = { presente: "Presente", atraso: "Atraso", falta: "Falta" };

    function hash(texto) {
        var h = 0;
        for (var i = 0; i < texto.length; i++) {
            h = (h * 31 + texto.charCodeAt(i)) >>> 0;
        }
        return h;
    }

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function statusPseudoAleatorio(dataStr, indice) {
        var r = hash(dataStr + "#" + indice) % 100;
        if (r < 6) return "falta";
        if (r < 18) return "atraso";
        return "presente";
    }

    function obterStatusDia(ano, mesIndice0, dia, indiceAluno, dataStr) {
        if (ano === 2026 && mesIndice0 === 6 && AGREGADO_JULHO_2026.hasOwnProperty(dia)) {
            var agregado = AGREGADO_JULHO_2026[dia];
            if (agregado === "presente") return "presente";
            var especial = dia % ESTUDANTES.length;
            return indiceAluno === especial ? agregado : "presente";
        }
        return statusPseudoAleatorio(dataStr, indiceAluno);
    }

    function gerarHorarios(status, dataStr, indice) {
        if (status === "falta") return { entrada: "--", saida: "--" };
        var h = hash(dataStr + "-h-" + indice);
        var minEntrada = 15 + (h % 30);
        if (status === "atraso") minEntrada += 20;
        var minSaida = 5 + ((h >> 3) % 30);
        return {
            entrada: "07:" + pad(minEntrada % 60),
            saida: "12:" + pad(minSaida)
        };
    }

    function gerarRegistosDia(ano, mesIndice0, dia) {
        var data = new Date(ano, mesIndice0, dia);
        var diaSemana = data.getDay();

        if (diaSemana === 0 || diaSemana === 6) {
            return { tipo: "fds", registos: [] };
        }
        if (data > HOJE) {
            return { tipo: "vazio", registos: [] };
        }

        var dataStr = ano + "-" + (mesIndice0 + 1) + "-" + dia;
        var registos = ESTUDANTES.map(function (aluno, indice) {
            var status = obterStatusDia(ano, mesIndice0, dia, indice, dataStr);
            var horarios = gerarHorarios(status, dataStr, indice);
            return { aluno: aluno, status: status, entrada: horarios.entrada, saida: horarios.saida };
        });
        return { tipo: "letivo", registos: registos };
    }

    function statusAgregado(registos) {
        if (registos.some(function (r) { return r.status === "falta"; })) return "falta";
        if (registos.some(function (r) { return r.status === "atraso"; })) return "atraso";
        return "presente";
    }

    document.addEventListener("DOMContentLoaded", function () {
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
            var info = gerarRegistosDia(estado.ano, estado.mes, estado.diaSelecionado);
            var dataTexto = estado.diaSelecionado + " de " + MESES_PT[estado.mes];

            if (!estado.diaSelecionado) {
                detalheTitulo.textContent = "Selecione um dia";
                detalheLista.innerHTML = '<p style="color:var(--texto-suave);font-size:13px;">Clique num dia do calendário para ver os detalhes.</p>';
                return;
            }

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

                var info = gerarRegistosDia(estado.ano, estado.mes, dia);
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