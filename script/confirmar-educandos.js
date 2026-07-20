(function () {
    "use strict";

    var CHAVE_ESTADO = "confirmacao-educandos"; /* { joao: "confirmado" | "reportado", ... } */

    document.addEventListener("DOMContentLoaded", function () {
        var itens = Array.prototype.slice.call(document.querySelectorAll(".confirmar-item"));
        var btnContinuar = document.getElementById("btnContinuar");
        var nota = document.getElementById("confirmarNota");

        var modal = document.getElementById("modalReportar");
        var fecharModalBtn = document.getElementById("fecharModalReportar");
        var formReportar = document.getElementById("formReportar");
        var reportarAluno = document.getElementById("reportarAluno");
        var itemEmReporte = null;

        var total = itens.length;
        var estadoGuardado = PG.obterEstado(CHAVE_ESTADO, {});

        /* Um item conta como "tratado" tanto se foi confirmado como se foi
           reportado — em ambos os casos o encarregado já tomou uma decisão
           informada sobre aqueles dados, por isso o fluxo pode continuar. */
        function contarTratados() {
            return itens.filter(function (item) {
                return item.classList.contains("confirmado") || item.classList.contains("reportado");
            }).length;
        }

        function atualizarProgresso() {
            var tratados = contarTratados();
            btnContinuar.disabled = tratados < total;
            nota.textContent = tratados < total
                ? "Confirme os dados de todos os educandos para continuar (" + tratados + " de " + total + ")."
                : "Tudo pronto! Pode continuar para o Painel.";
        }

        function marcarConfirmado(item, semAnimacao) {
            item.classList.add("confirmado");
            var botaoConfirmar = item.querySelector(".btn-confirmar");
            var botaoReportar = item.querySelector(".btn-reportar");
            botaoConfirmar.textContent = "✓ Confirmado";
            botaoConfirmar.disabled = true;
            botaoReportar.disabled = true;
            if (!semAnimacao) {
                item.classList.add("pg-pulso");
                window.setTimeout(function () {
                    item.classList.remove("pg-pulso");
                }, 400);
            }
        }

        function marcarReportado(item) {
            item.classList.remove("confirmado");
            item.classList.add("reportado");
            var botaoConfirmar = item.querySelector(".btn-confirmar");
            var botaoReportar = item.querySelector(".btn-reportar");
            botaoConfirmar.disabled = true;
            botaoReportar.textContent = "Reportado à escola";
            botaoReportar.disabled = true;
        }

        function guardarEstadoItem(id, valor) {
            estadoGuardado[id] = valor;
            PG.guardarEstado(CHAVE_ESTADO, estadoGuardado);
        }

        function abrirModalReportar(item) {
            itemEmReporte = item;
            reportarAluno.textContent = item.dataset.aluno;
            formReportar.reset();
            modal.hidden = false;
            document.getElementById("reportarDescricao").focus();
        }

        function fecharModalReportar() {
            modal.hidden = true;
            itemEmReporte = null;
        }

        itens.forEach(function (item) {
            var id = item.dataset.id;

            /* Restaura o que já foi decidido numa visita anterior, sem
               disparar toasts nem animações. */
            if (estadoGuardado[id] === "confirmado") {
                marcarConfirmado(item, true);
            } else if (estadoGuardado[id] === "reportado") {
                marcarReportado(item);
            }

            item.querySelector(".btn-confirmar").addEventListener("click", function () {
                marcarConfirmado(item);
                guardarEstadoItem(id, "confirmado");
                atualizarProgresso();
                PG.toast(item.dataset.aluno + ": dados confirmados.", "sucesso");
            });
            item.querySelector(".btn-reportar").addEventListener("click", function () {
                if (item.classList.contains("confirmado") || item.classList.contains("reportado")) return;
                abrirModalReportar(item);
            });
        });

        fecharModalBtn.addEventListener("click", fecharModalReportar);
        modal.addEventListener("click", function (evento) {
            if (evento.target === modal) fecharModalReportar();
        });
        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape" && !modal.hidden) fecharModalReportar();
        });

        formReportar.addEventListener("submit", function (evento) {
            evento.preventDefault();
            if (!itemEmReporte) return;
            var aluno = itemEmReporte.dataset.aluno;
            var id = itemEmReporte.dataset.id;
            marcarReportado(itemEmReporte);
            guardarEstadoItem(id, "reportado");
            atualizarProgresso();
            fecharModalReportar();
            PG.toast("Pedido de correção enviado sobre " + aluno + ".", "info");
        });

        btnContinuar.addEventListener("click", function () {
            if (btnContinuar.disabled) return;
            window.location.href = "index.html";
        });

        atualizarProgresso();
    });
})();