(function () {
    "use strict";

    var ROTULOS = { presente: "Presente", atraso: "Atraso", ausente: "Ausente" };
    var CLASSES = { presente: "status-presente", atraso: "status-atraso", ausente: "status-ausente" };

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

        /* ---------- Edição inline ---------- */
        function iniciarEdicao(tr) {
            var colEntrada = tr.querySelector(".col-entrada");
            var colSaida = tr.querySelector(".col-saida");
            var colStatus = tr.querySelector(".col-status");
            var statusAtual = tr.dataset.status;

            var valorEntrada = colEntrada.textContent.trim();
            var valorSaida = colSaida.textContent.trim();

            colEntrada.innerHTML =
                '<input type="text" class="editar-input" value="' + valorEntrada + '" placeholder="--">';
            colSaida.innerHTML =
                '<input type="text" class="editar-input" value="' + valorSaida + '" placeholder="--">';
            colStatus.innerHTML =
                '<select class="editar-select">' +
                '<option value="presente"' + (statusAtual === "presente" ? " selected" : "") + ">Presente</option>" +
                '<option value="atraso"' + (statusAtual === "atraso" ? " selected" : "") + ">Atraso</option>" +
                '<option value="ausente"' + (statusAtual === "ausente" ? " selected" : "") + ">Ausente</option>" +
                "</select>";

            var botao = tr.querySelector(".btn-edt");
            botao.textContent = "Guardar";
            botao.classList.add("a-editar");
            colEntrada.querySelector("input").focus();
        }

        function guardarEdicao(tr) {
            var colEntrada = tr.querySelector(".col-entrada");
            var colSaida = tr.querySelector(".col-saida");
            var colStatus = tr.querySelector(".col-status");
            var inputEntrada = colEntrada.querySelector("input");
            var inputSaida = colSaida.querySelector("input");
            var select = colStatus.querySelector("select");
            var novoStatus = select.value;

            colEntrada.textContent = inputEntrada.value.trim() || "--";
            colSaida.textContent = inputSaida.value.trim() || "--";
            colStatus.innerHTML = '<span class="' + CLASSES[novoStatus] + '">' + ROTULOS[novoStatus] + "</span>";
            tr.dataset.status = novoStatus;

            var botao = tr.querySelector(".btn-edt");
            botao.textContent = "Editar";
            botao.classList.remove("a-editar");

            tr.classList.add("pg-pulso");
            window.setTimeout(function () {
                tr.classList.remove("pg-pulso");
            }, 400);

            atualizarTotais();
            aplicarFiltros();
            PG.toast("Registo de " + tr.dataset.aluno + " atualizado.", "sucesso");
        }

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
        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape" && !modal.hidden) fecharModal();
        });

        /* ---------- Ligações por linha ---------- */
        linhas.forEach(function (tr) {
            tr.querySelector(".btn-ver").addEventListener("click", function () {
                abrirModal(tr);
            });
            tr.querySelector(".btn-edt").addEventListener("click", function (evento) {
                if (evento.currentTarget.classList.contains("a-editar")) {
                    guardarEdicao(tr);
                } else {
                    iniciarEdicao(tr);
                }
            });
        });

        atualizarTotais();
    });
})();