(function () {
    "use strict";

    var CHAVE_PERFIL = "perfil";
    var CHAVE_NOTIFICACOES = "notificacoes";
    var CHAVE_PEDIDOS = "educandos-pedidos"; /* { associacoes: [...], remocoes: [...] } */

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

        /* ---------- Perfil: restaurar e guardar ---------- */
        var campoNome = document.getElementById("nome");
        var campoEmail = document.getElementById("email");
        var campoTelefone = document.getElementById("telefone");
        var campoParentesco = document.getElementById("parentesco");
        var btnGuardarPerfil = document.getElementById("btnGuardarPerfil");

        var perfilGuardado = PG.obterEstado(CHAVE_PERFIL, null);
        if (perfilGuardado) {
            if (perfilGuardado.nome) campoNome.value = perfilGuardado.nome;
            if (perfilGuardado.email) campoEmail.value = perfilGuardado.email;
            if (perfilGuardado.telefone) campoTelefone.value = perfilGuardado.telefone;
            if (perfilGuardado.parentesco) campoParentesco.value = perfilGuardado.parentesco;
        }

        if (btnGuardarPerfil) {
            btnGuardarPerfil.addEventListener("click", function () {
                var textoOriginal = btnGuardarPerfil.textContent;
                btnGuardarPerfil.classList.add("pg-a-processar");
                btnGuardarPerfil.innerHTML = '<span class="pg-spinner"></span>A guardar…';

                window.setTimeout(function () {
                    btnGuardarPerfil.classList.remove("pg-a-processar");
                    btnGuardarPerfil.textContent = textoOriginal;
                    PG.guardarEstado(CHAVE_PERFIL, {
                        nome: campoNome.value,
                        email: campoEmail.value,
                        telefone: campoTelefone.value,
                        parentesco: campoParentesco.value
                    });
                    PG.toast("Alterações guardadas com sucesso.", "sucesso");
                }, 700);
            });
        }

        /* ---------- Segurança: atualizar senha com validação ---------- */
        var btnAtualizarSenha = document.getElementById("btnAtualizarSenha");
        var senhaAtual = document.getElementById("senha-atual");
        var senhaNova = document.getElementById("senha-nova");
        var senhaConfirmar = document.getElementById("senha-confirmar");

        if (btnAtualizarSenha) {
            btnAtualizarSenha.addEventListener("click", function () {
                if (!senhaAtual.value || !senhaNova.value || !senhaConfirmar.value) {
                    PG.toast("Preencha todos os campos de senha.", "erro");
                    return;
                }
                if (senhaNova.value.length < 6) {
                    PG.toast("A nova senha deve ter pelo menos 6 caracteres.", "erro");
                    return;
                }
                if (senhaNova.value !== senhaConfirmar.value) {
                    PG.toast("A confirmação não corresponde à nova senha.", "erro");
                    senhaConfirmar.focus();
                    return;
                }

                var textoOriginal = btnAtualizarSenha.textContent;
                btnAtualizarSenha.classList.add("pg-a-processar");
                btnAtualizarSenha.innerHTML = '<span class="pg-spinner"></span>A atualizar…';

                window.setTimeout(function () {
                    btnAtualizarSenha.classList.remove("pg-a-processar");
                    btnAtualizarSenha.textContent = textoOriginal;
                    senhaAtual.value = "";
                    senhaNova.value = "";
                    senhaConfirmar.value = "";
                    PG.toast("Senha atualizada com sucesso.", "sucesso");
                }, 700);
            });
        }

        /* ---------- Notificações: restaurar e guardar cada toggle ---------- */
        var notificacoesGuardadas = PG.obterEstado(CHAVE_NOTIFICACOES, {});

        document.querySelectorAll(".toggle input[type=checkbox]").forEach(function (toggle) {
            var chave = toggle.dataset.chave;
            if (chave && notificacoesGuardadas.hasOwnProperty(chave)) {
                toggle.checked = notificacoesGuardadas[chave];
            }

            toggle.addEventListener("change", function () {
                var titulo = toggle.closest(".toggle-item").querySelector("strong").textContent;
                PG.toast(titulo + (toggle.checked ? ": ativado." : ": desativado."), "info");

                if (chave) {
                    notificacoesGuardadas[chave] = toggle.checked;
                    PG.guardarEstado(CHAVE_NOTIFICACOES, notificacoesGuardadas);
                }
            });
        });

        /* ---------- Educandos associados: pedido, não ação direta ----------
           O encarregado não pode inventar nomes/cartões nem remover um
           educando com um único clique — essas associações são geridas pela
           instituição. Aqui apenas registamos o PEDIDO, persistido em
           localStorage, e mostramos o estado "pendente" na interface. */
        var lista = document.getElementById("listaEducandos");
        var btnAdicionar = document.querySelector(".btn-adicionar");

        var modalSolicitar = document.getElementById("modalSolicitar");
        var fecharModalSolicitarBtn = document.getElementById("fecharModalSolicitar");
        var formSolicitar = document.getElementById("formSolicitar");

        var pedidos = PG.obterEstado(CHAVE_PEDIDOS, { associacoes: [], remocoes: [] });

        function criarItemPendente(cartao) {
            var item = document.createElement("div");
            item.className = "educando-item educando-pendente pg-realce";
            item.innerHTML =
                '<span class="avatar avatar-pendente">?</span>' +
                '<div class="educando-info"><strong>Cartão #' + cartao + '</strong>' +
                '<span>Pedido enviado · a aguardar confirmação da escola</span></div>';
            return item;
        }

        function marcarRemocaoPendente(item) {
            var botao = item.querySelector(".btn-remover");
            botao.disabled = true;
            botao.textContent = "Remoção solicitada";
            item.classList.add("educando-pendente");
        }

        /* Restaura pedidos de associação já enviados numa visita anterior */
        pedidos.associacoes.forEach(function (cartao) {
            lista.appendChild(criarItemPendente(cartao));
        });

        /* Restaura pedidos de remoção já enviados numa visita anterior */
        pedidos.remocoes.forEach(function (id) {
            var item = lista.querySelector('.educando-item[data-id="' + id + '"]');
            if (item) marcarRemocaoPendente(item);
        });

        function abrirModalSolicitar() {
            formSolicitar.reset();
            modalSolicitar.hidden = false;
            document.getElementById("cartaoEducando").focus();
        }

        function fecharModalSolicitar() {
            modalSolicitar.hidden = true;
        }

        if (btnAdicionar && modalSolicitar) {
            btnAdicionar.addEventListener("click", abrirModalSolicitar);
            fecharModalSolicitarBtn.addEventListener("click", fecharModalSolicitar);
            modalSolicitar.addEventListener("click", function (evento) {
                if (evento.target === modalSolicitar) fecharModalSolicitar();
            });
            document.addEventListener("keydown", function (evento) {
                if (evento.key === "Escape" && !modalSolicitar.hidden) fecharModalSolicitar();
            });

            formSolicitar.addEventListener("submit", function (evento) {
                evento.preventDefault();
                var cartao = document.getElementById("cartaoEducando").value.trim();
                if (!cartao) return;

                fecharModalSolicitar();
                lista.appendChild(criarItemPendente(cartao));

                pedidos.associacoes.push(cartao);
                PG.guardarEstado(CHAVE_PEDIDOS, pedidos);

                PG.toast("Pedido de associação enviado. Vai aparecer aqui assim que a escola confirmar.", "sucesso");
            });
        }

        if (lista) {
            lista.addEventListener("click", function (evento) {
                var botao = evento.target.closest(".btn-remover");
                if (!botao) return;

                var item = botao.closest(".educando-item");
                var nome = item.querySelector("strong").textContent;
                var id = item.dataset.id;

                var confirmado = window.confirm(
                    "Tem a certeza que quer solicitar a remoção de " + nome + "?\n" +
                    "Isto envia um pedido à escola — o educando só é removido depois de aprovado."
                );
                if (!confirmado) return;

                marcarRemocaoPendente(item);

                if (id && pedidos.remocoes.indexOf(id) === -1) {
                    pedidos.remocoes.push(id);
                    PG.guardarEstado(CHAVE_PEDIDOS, pedidos);
                }

                PG.toast("Pedido de remoção de " + nome + " enviado para análise da escola.", "info");
            });
        }
    });
})();