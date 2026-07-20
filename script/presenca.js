(function () {
    "use strict";

    var ROTULOS = { presente: "Presente", atraso: "Atraso", ausente: "Ausente" };
    var CLASSES = { presente: "status-presente", atraso: "status-atraso", ausente: "status-ausente" };

    /* O status "falta" do dataset partilhado corresponde, nesta página, ao
       rótulo "ausente" — mesma coisa, nome mais direto para o encarregado. */
    var MAPA_STATUS = { presente: "presente", atraso: "atraso", falta: "ausente" };

    /* Estados que podem ser justificados pelo encarregado. "Presente" nunca
       pode ser justificado — não há nada a justificar. */
    var JUSTIFICAVEIS = { atraso: true, ausente: true };

    /* Chave de persistência — agora guarda, por aluno E por data, se já foi
       enviada uma justificação (formato "Nome do aluno|AAAA-MM-DD"). Isto
       permite navegar entre dias diferentes sem uma justificação de um dia
       "contaminar" o estado visual de outro dia. */
    var CHAVE_JUSTIFICACOES = "presenca-justificacoes";

    var DIAS_SEMANA_PT = [
        "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
        "Quinta-feira", "Sexta-feira", "Sábado"
    ];

    document.addEventListener("DOMContentLoaded", function () {
        var DADOS = window.PG_DADOS;
        var corpoTabela = document.getElementById("corpoTabela");
        if (!DADOS || !corpoTabela) return;

        var semResultados = document.getElementById("semResultados");
        var pesquisaInput = document.getElementById("pesquisaAluno");
        var filtroTurma = document.getElementById("filtroTurma");
        var filtroStatus = document.getElementById("filtroStatus");
        var limparBtn = document.getElementById("limparFiltros");

        var btnDiaAnterior = document.getElementById("diaAnterior");
        var btnDiaSeguinte = document.getElementById("diaSeguinte");
        var seletorData = document.getElementById("seletorData");
        var dataAtualTexto = document.getElementById("dataAtualTexto");
        var dataAtualRotulo = document.getElementById("dataAtualRotulo");

        var modal = document.getElementById("modalVer");
        var fecharModalBtn = document.getElementById("fecharModal");
        var ultimoFocado = null;

        var modalJustificar = document.getElementById("modalJustificar");
        var fecharModalJustificarBtn = document.getElementById("fecharModalJustificar");
        var formJustificar = document.getElementById("formJustificar");
        var justificarAluno = document.getElementById("justificarAluno");
        var justificarEstadoAtual = document.getElementById("justificarEstadoAtual");
        var justificarDataEl = document.getElementById("justificarData");
        var linhaEmJustificacao = null;

        var justificacoesEnviadas = PG.obterEstado(CHAVE_JUSTIFICACOES, {});

        var estado = { data: new Date(DADOS.HOJE) };
        var linhas = [];

        /* ---------- Helpers de data ---------- */
        function paraISO(data) {
            return data.getFullYear() + "-" + DADOS.pad(data.getMonth() + 1) + "-" + DADOS.pad(data.getDate());
        }

        function chaveJustificacao(nomeAluno, data) {
            return nomeAluno + "|" + paraISO(data);
        }

        function eHoje(data) {
            return DADOS.formatarData(data) === DADOS.formatarData(DADOS.HOJE);
        }

        function ehFimDeSemana(data) {
            var d = data.getDay();
            return d === 0 || d === 6;
        }

        /* Avança/recua no calendário até cair num dia útil (salta sempre
           sábados/domingos, para nunca aterrar num dia sem aulas). */
        function ajustarParaDiaUtil(data, direcao) {
            var candidato = new Date(data);
            do {
                candidato.setDate(candidato.getDate() + direcao);
            } while (ehFimDeSemana(candidato));
            return candidato;
        }

        function irParaDiaAnterior() {
            estado.data = ajustarParaDiaUtil(estado.data, -1);
            renderizar();
        }

        function irParaDiaSeguinte() {
            if (eHoje(estado.data)) return;
            var proximo = ajustarParaDiaUtil(estado.data, 1);
            if (proximo > DADOS.HOJE) proximo = new Date(DADOS.HOJE);
            estado.data = proximo;
            renderizar();
        }

        function irParaData(novaData) {
            if (isNaN(novaData.getTime())) return;
            if (novaData > DADOS.HOJE) novaData = new Date(DADOS.HOJE);
            if (ehFimDeSemana(novaData)) {
                PG.toast("Não há registos ao fim de semana — a mostrar o dia útil mais próximo.", "info");
                novaData = ajustarParaDiaUtil(novaData, novaData.getDay() === 0 ? 1 : -1);
            }
            estado.data = novaData;
            renderizar();
        }

        function atualizarCabecalhoData() {
            dataAtualTexto.textContent = DADOS.formatarData(estado.data);
            dataAtualRotulo.textContent = eHoje(estado.data) ? "Hoje" : DIAS_SEMANA_PT[estado.data.getDay()];
            seletorData.value = paraISO(estado.data);
            seletorData.max = paraISO(DADOS.HOJE);
            btnDiaSeguinte.disabled = eHoje(estado.data);
        }

        btnDiaAnterior.addEventListener("click", irParaDiaAnterior);
        btnDiaSeguinte.addEventListener("click", irParaDiaSeguinte);
        seletorData.addEventListener("change", function () {
            if (!seletorData.value) return;
            var partes = seletorData.value.split("-").map(Number);
            irParaData(new Date(partes[0], partes[1] - 1, partes[2]));
        });

        /* ---------- Construir a tabela para a data selecionada ---------- */
        function construirTabela() {
            var info = DADOS.obterRegistoDia(estado.data.getFullYear(), estado.data.getMonth(), estado.data.getDate());
            corpoTabela.innerHTML = "";

            if (info.tipo !== "letivo") {
                var mensagem = info.tipo === "fds"
                    ? "Fim de semana — sem registos letivos."
                    : "Ainda sem registos para este dia.";
                var trVazia = document.createElement("tr");
                trVazia.innerHTML = '<td colspan="7" style="text-align:center;color:var(--texto-suave);padding:30px 12px;">' + mensagem + "</td>";
                corpoTabela.appendChild(trVazia);
                linhas = [];
                return;
            }

            info.registos.forEach(function (r) {
                var status = MAPA_STATUS[r.status];
                var chave = chaveJustificacao(r.aluno.nome, estado.data);
                var jaEnviada = !!justificacoesEnviadas[chave];

                var tr = document.createElement("tr");
                tr.dataset.aluno = r.aluno.nome;
                tr.dataset.turma = r.aluno.turma;
                tr.dataset.status = status;

                var botaoJustificarHtml;
                if (!JUSTIFICAVEIS[status]) {
                    botaoJustificarHtml = '<button class="btn-justificar" disabled title="Só é possível justificar faltas ou atrasos">Justificar</button>';
                } else if (jaEnviada) {
                    botaoJustificarHtml = '<button class="btn-justificar ja-enviado" disabled>Pendente de aprovação</button>';
                } else {
                    botaoJustificarHtml = '<button class="btn-justificar">Justificar</button>';
                }

                var colStatusHtml =
                    '<span class="' + CLASSES[status] + '">' + ROTULOS[status] + "</span>" +
                    (jaEnviada ? '<span class="tag-pendente">Justificação enviada</span>' : "");

                tr.innerHTML =
                    "<td>" + r.aluno.nome + "</td>" +
                    "<td>" + r.aluno.turma + "</td>" +
                    "<td>" + r.aluno.cartao + "</td>" +
                    '<td class="col-entrada">' + r.entrada + "</td>" +
                    '<td class="col-saida">' + r.saida + "</td>" +
                    '<td class="col-status">' + colStatusHtml + "</td>" +
                    '<td class="acoes"><button class="btn-ver">Ver</button>' + botaoJustificarHtml + "</td>";

                corpoTabela.appendChild(tr);

                tr.querySelector(".btn-ver").addEventListener("click", function () {
                    abrirModal(tr);
                });

                if (JUSTIFICAVEIS[status] && !jaEnviada) {
                    tr.querySelector(".btn-justificar").addEventListener("click", function () {
                        abrirModalJustificar(tr);
                    });
                }
            });

            linhas = Array.prototype.slice.call(corpoTabela.querySelectorAll("tr"));
        }

        /* ---------- Totais animados ---------- */
        function atualizarTotais() {
            var contagem = { presente: 0, atraso: 0, ausente: 0 };
            linhas.forEach(function (tr) {
                if (contagem.hasOwnProperty(tr.dataset.status)) {
                    contagem[tr.dataset.status]++;
                }
            });
            PG.contarAte(document.getElementById("totalPresentes"), contagem.presente, { duracao: 500 });
            PG.contarAte(document.getElementById("totalAtrasos"), contagem.atraso, { duracao: 500 });
            PG.contarAte(document.getElementById("totalAusentes"), contagem.ausente, { duracao: 500 });
        }

        /* ---------- Filtros + pesquisa ---------- */
        function aplicarFiltros() {
            var termo = pesquisaInput.value.trim().toLowerCase();
            var turma = filtroTurma.value;
            var status = filtroStatus.value;
            var visiveis = 0;

            linhas.forEach(function (tr) {
                var nome = (tr.dataset.aluno || "").toLowerCase();
                var correspondeTermo = !termo || nome.indexOf(termo) !== -1;
                var correspondeTurma = turma === "todas" || tr.dataset.turma === turma;
                var correspondeStatus = status === "todos" || tr.dataset.status === status;
                var mostrar = correspondeTermo && correspondeTurma && correspondeStatus;

                if (mostrar) {
                    tr.style.display = "";
                    tr.classList.remove("pg-sair");
                    tr.classList.add("pg-realce");
                    visiveis++;
                } else {
                    tr.style.display = "none";
                }
            });

            /* Se o próprio dia não tem linhas (fim de semana/sem registo),
               não mostrar também a mensagem de "filtros sem resultado" —
               a mensagem dentro da tabela já cobre esse caso. */
            semResultados.hidden = linhas.length === 0 || visiveis !== 0;
        }

        var aplicarFiltrosComDebounce = PG.debounce(aplicarFiltros, 150);

        pesquisaInput.addEventListener("input", aplicarFiltrosComDebounce);
        filtroTurma.addEventListener("change", aplicarFiltros);
        filtroStatus.addEventListener("change", aplicarFiltros);
        limparBtn.addEventListener("click", function () {
            pesquisaInput.value = "";
            filtroTurma.value = "todas";
            filtroStatus.value = "todos";
            aplicarFiltros();
            PG.toast("Filtros limpos.", "info");
        });

        /* ---------- Modal de detalhes ---------- */
        function abrirModal(tr) {
            document.getElementById("modalTitulo").textContent = tr.dataset.aluno;
            document.getElementById("modalTurma").textContent = tr.dataset.turma;
            document.getElementById("modalCartao").textContent = tr.children[2].textContent.trim();
            document.getElementById("modalEntrada").textContent = tr.querySelector(".col-entrada").textContent.trim();
            document.getElementById("modalSaida").textContent = tr.querySelector(".col-saida").textContent.trim();
            document.getElementById("modalStatus").innerHTML = tr.querySelector(".col-status").innerHTML;

            ultimoFocado = document.activeElement;
            modal.hidden = false;
            fecharModalBtn.focus();
        }

        function fecharModal() {
            modal.hidden = true;
            if (ultimoFocado) ultimoFocado.focus();
        }

        fecharModalBtn.addEventListener("click", fecharModal);
        modal.addEventListener("click", function (evento) {
            if (evento.target === modal) fecharModal();
        });

        /* ---------- Modal de justificação ---------- */
        function abrirModalJustificar(tr) {
            linhaEmJustificacao = tr;
            justificarAluno.textContent = tr.dataset.aluno;
            justificarEstadoAtual.innerHTML = tr.querySelector(".col-status").innerHTML;
            if (justificarDataEl) justificarDataEl.textContent = DADOS.formatarData(estado.data);
            formJustificar.reset();

            ultimoFocado = document.activeElement;
            modalJustificar.hidden = false;
            document.getElementById("justificarMotivo").focus();
        }

        function fecharModalJustificar() {
            modalJustificar.hidden = true;
            linhaEmJustificacao = null;
            if (ultimoFocado) ultimoFocado.focus();
        }

        function marcarComoPendente(tr) {
            var colStatus = tr.querySelector(".col-status");
            var estadoOriginal = tr.dataset.status;
            colStatus.innerHTML =
                '<span class="' + CLASSES[estadoOriginal] + '">' + ROTULOS[estadoOriginal] + "</span>" +
                '<span class="tag-pendente">Justificação enviada</span>';

            var botao = tr.querySelector(".btn-justificar");
            botao.textContent = "Pendente de aprovação";
            botao.disabled = true;
            botao.classList.add("ja-enviado");

            tr.classList.add("pg-pulso");
            window.setTimeout(function () {
                tr.classList.remove("pg-pulso");
            }, 400);
        }

        fecharModalJustificarBtn.addEventListener("click", fecharModalJustificar);
        modalJustificar.addEventListener("click", function (evento) {
            if (evento.target === modalJustificar) fecharModalJustificar();
        });

        formJustificar.addEventListener("submit", function (evento) {
            evento.preventDefault();
            if (!linhaEmJustificacao) return;

            var aluno = linhaEmJustificacao.dataset.aluno;
            var chave = chaveJustificacao(aluno, estado.data);

            marcarComoPendente(linhaEmJustificacao);
            fecharModalJustificar();

            justificacoesEnviadas[chave] = true;
            PG.guardarEstado(CHAVE_JUSTIFICACOES, justificacoesEnviadas);

            PG.toast(
                "Justificação de " + aluno + " (" + DADOS.formatarData(estado.data) + ") enviada para análise da escola.",
                "sucesso"
            );
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key !== "Escape") return;
            if (!modal.hidden) fecharModal();
            if (!modalJustificar.hidden) fecharModalJustificar();
        });

        /* ---------- Render geral ---------- */
        function renderizar() {
            atualizarCabecalhoData();
            construirTabela();
            aplicarFiltros();
            atualizarTotais();
        }

        renderizar();
    });
})();