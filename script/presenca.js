(function () {
    "use strict";

    var ROTULOS = { presente: "Presente", atraso: "Atraso", ausente: "Ausente" };
    var CLASSES = { presente: "status-presente", atraso: "status-atraso", ausente: "status-ausente" };

    /* Estados que podem ser justificados pelo encarregado. "Presente" nunca
       pode ser justificado — não há nada a justificar. */
    var JUSTIFICAVEIS = { atraso: true, ausente: true };

    /* Chave de persistência — guarda, por aluno, se já foi enviada uma
       justificação. Como este protótipo só tem um dia de dados, a chave é
       o próprio nome do aluno; numa versão real seria "aluno + data". */
    var CHAVE_JUSTIFICACOES = "presenca-justificacoes";

    document.addEventListener("DOMContentLoaded", function () {
        var corpoTabela = document.getElementById("corpoTabela");
        var linhas = Array.prototype.slice.call(corpoTabela.querySelectorAll("tr"));
        var semResultados = document.getElementById("semResultados");
        var pesquisaInput = document.getElementById("pesquisaAluno");
        var filtroTurma = document.getElementById("filtroTurma");
        var filtroStatus = document.getElementById("filtroStatus");
        var limparBtn = document.getElementById("limparFiltros");

        var modal = document.getElementById("modalVer");
        var fecharModalBtn = document.getElementById("fecharModal");
        var ultimoFocado = null;

        var modalJustificar = document.getElementById("modalJustificar");
        var fecharModalJustificarBtn = document.getElementById("fecharModalJustificar");
        var formJustificar = document.getElementById("formJustificar");
        var justificarAluno = document.getElementById("justificarAluno");
        var justificarEstadoAtual = document.getElementById("justificarEstadoAtual");
        var linhaEmJustificacao = null;

        var justificacoesEnviadas = PG.obterEstado(CHAVE_JUSTIFICACOES, {});

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

            semResultados.hidden = visiveis !== 0;
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

        function marcarComoPendente(tr, semToast) {
            var colStatus = tr.querySelector(".col-status");
            var estadoOriginal = tr.dataset.status;
            colStatus.innerHTML =
                '<span class="' + CLASSES[estadoOriginal] + '">' + ROTULOS[estadoOriginal] + "</span>" +
                '<span class="tag-pendente">Justificação enviada</span>';

            var botao = tr.querySelector(".btn-justificar");
            botao.textContent = "Pendente de aprovação";
            botao.disabled = true;
            botao.classList.add("ja-enviado");

            if (!semToast) {
                tr.classList.add("pg-pulso");
                window.setTimeout(function () {
                    tr.classList.remove("pg-pulso");
                }, 400);
            }
        }

        fecharModalJustificarBtn.addEventListener("click", fecharModalJustificar);
        modalJustificar.addEventListener("click", function (evento) {
            if (evento.target === modalJustificar) fecharModalJustificar();
        });

        formJustificar.addEventListener("submit", function (evento) {
            evento.preventDefault();
            if (!linhaEmJustificacao) return;

            var aluno = linhaEmJustificacao.dataset.aluno;
            marcarComoPendente(linhaEmJustificacao);
            fecharModalJustificar();

            justificacoesEnviadas[aluno] = true;
            PG.guardarEstado(CHAVE_JUSTIFICACOES, justificacoesEnviadas);

            PG.toast("Justificação de " + aluno + " enviada para análise da escola.", "sucesso");
        });

        document.addEventListener("keydown", function (evento) {
            if (evento.key !== "Escape") return;
            if (!modal.hidden) fecharModal();
            if (!modalJustificar.hidden) fecharModalJustificar();
        });

        /* ---------- Ligações por linha ---------- */
        linhas.forEach(function (tr) {
            tr.querySelector(".btn-ver").addEventListener("click", function () {
                abrirModal(tr);
            });

            var botaoJustificar = tr.querySelector(".btn-justificar");
            if (JUSTIFICAVEIS[tr.dataset.status]) {
                /* Restaura o estado "já enviado" guardado de uma visita anterior,
                   sem disparar toast nem animação de pulso. */
                if (justificacoesEnviadas[tr.dataset.aluno]) {
                    marcarComoPendente(tr, true);
                } else {
                    botaoJustificar.addEventListener("click", function () {
                        abrirModalJustificar(tr);
                    });
                }
            }
        });

        atualizarTotais();
    });
})();