(function () {
    "use strict";

    var CORES = [
        { fundo: "#e4ecf1", cor: "#2d5064" },
        { fundo: "#f2e6ef", cor: "#a15b8f" },
        { fundo: "#e6efe8", cor: "#4a7c59" },
        { fundo: "#fbe8dd", cor: "#b5651d" },
        { fundo: "#eae6fb", cor: "#5b4ea1" }
    ];

    function iniciais(nome) {
        var partes = nome.trim().split(/\s+/);
        var primeiro = partes[0] ? partes[0][0] : "";
        var ultimo = partes.length > 1 ? partes[partes.length - 1][0] : "";
        return (primeiro + ultimo).toUpperCase();
    }

    document.addEventListener("DOMContentLoaded", function () {
        /* ---------- Foto de perfil ---------- */
        var avatarGrande = document.querySelector(".avatar-grande");
        var btnAlterarFoto = document.querySelector(".perfil-editor-acoes .btn-secundario");

        if (avatarGrande && btnAlterarFoto) {
            var inputFoto = document.createElement("input");
            inputFoto.type = "file";
            inputFoto.accept = "image/*";
            inputFoto.style.display = "none";
            document.body.appendChild(inputFoto);

            btnAlterarFoto.addEventListener("click", function () {
                inputFoto.click();
            });

            inputFoto.addEventListener("change", function () {
                var ficheiro = inputFoto.files && inputFoto.files[0];
                if (!ficheiro) return;
                if (ficheiro.size > 2 * 1024 * 1024) {
                    PG.toast("A imagem deve ter até 2MB.", "erro");
                    return;
                }
                var leitor = new FileReader();
                leitor.onload = function (evento) {
                    avatarGrande.style.backgroundImage = "url(" + evento.target.result + ")";
                    avatarGrande.style.backgroundSize = "cover";
                    avatarGrande.style.backgroundPosition = "center";
                    avatarGrande.textContent = "";
                    avatarGrande.classList.add("pg-pulso");
                    window.setTimeout(function () {
                        avatarGrande.classList.remove("pg-pulso");
                    }, 400);
                    PG.toast("Foto de perfil atualizada.", "sucesso");
                };
                leitor.readAsDataURL(ficheiro);
            });
        }

        /* ---------- Guardar formulários ---------- */
        document.querySelectorAll(".btn-guardar").forEach(function (botao) {
            botao.addEventListener("click", function () {
                var textoOriginal = botao.textContent;
                botao.classList.add("pg-a-processar");
                botao.innerHTML = '<span class="pg-spinner"></span>A guardar…';

                window.setTimeout(function () {
                    botao.classList.remove("pg-a-processar");
                    botao.textContent = textoOriginal;
                    PG.toast("Alterações guardadas com sucesso.", "sucesso");
                }, 700);
            });
        });

        /* ---------- Notificações (toggles) ---------- */
        document.querySelectorAll(".toggle input[type=checkbox]").forEach(function (toggle) {
            toggle.addEventListener("change", function () {
                var titulo = toggle.closest(".toggle-item").querySelector("strong").textContent;
                PG.toast(titulo + (toggle.checked ? ": ativado." : ": desativado."), "info");
            });
        });

        /* ---------- Educandos associados ---------- */
        var lista = document.querySelector(".lista-educandos");
        var btnAdicionar = document.querySelector(".btn-adicionar");
        var contadorCor = document.querySelectorAll(".educando-item").length;

        if (lista) {
            lista.addEventListener("click", function (evento) {
                var botao = evento.target.closest(".btn-remover");
                if (!botao) return;
                var item = botao.closest(".educando-item");
                var nome = item.querySelector("strong").textContent;
                PG.removerComAnimacao(item, function () {
                    PG.toast(nome + " foi removido(a).", "info");
                });
            });
        }

        if (btnAdicionar) {
            btnAdicionar.addEventListener("click", function () {
                var nome = window.prompt("Nome completo do educando:");
                if (!nome || !nome.trim()) return;
                var turma = window.prompt("Turma (ex: 7ª A):", "7ª A") || "—";
                var cartao = "#" + Math.floor(1000 + Math.random() * 9000);

                var paleta = CORES[contadorCor % CORES.length];
                contadorCor++;

                var item = document.createElement("div");
                item.className = "educando-item pg-realce";
                item.innerHTML =
                    '<span class="avatar" style="background:' + paleta.fundo + ";color:" + paleta.cor + '">' + iniciais(nome) + "</span>" +
                    '<div class="educando-info"><strong>' + nome + "</strong><span>" + turma + " · Cartão " + cartao + "</span></div>" +
                    '<button class="btn-remover" aria-label="Remover ' + nome + '">Remover</button>';
                lista.appendChild(item);
                PG.toast(nome + " foi adicionado(a).", "sucesso");
            });
        }
    });
})();