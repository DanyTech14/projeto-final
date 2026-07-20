/* ==========================================================================
   Presence Guard — Dados partilhados
   Fonte única do dataset de presenças, usada pelo Painel (painel.js),
   Presença (presenca.js), Calendário (calendario.js) e Relatório
   (relatorio.js), para que os números batam sempre certo entre páginas.
   Carregar antes de painel.js / presenca.js / calendario.js / relatorio.js.
   ========================================================================== */
(function () {
    "use strict";

    var HOJE = new Date(2026, 6, 16);
    var MESES_PT = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    var ESTUDANTES = [
        { id: "joao", nome: "João Silvestre", turma: "9ª A", cartao: "#1245", iniciais: "JS", fundo: "#e4ecf1", cor: "#2d5064" },
        { id: "joana", nome: "Joana Silvestre", turma: "8ª A", cartao: "#1355", iniciais: "JS", fundo: "#f2e6ef", cor: "#a15b8f" },
        { id: "rafael", nome: "Rafael Silvestre", turma: "5ª A", cartao: "#1322", iniciais: "RS", fundo: "#e6efe8", cor: "#4a7c59" }
    ];

    var ROTULOS_STATUS = { presente: "Presente", atraso: "Atraso", falta: "Falta" };

    /* Dias de julho/2026 com um resultado "narrativo" fixo, para a demo
       contar sempre a mesma história (ex.: dia 15 com atraso do João) em vez
       de depender só do hash. Usado por TODAS as páginas — Painel, Presença,
       Calendário e Relatório — através de obterRegistoDia(), para nunca
       haver divergência entre elas sobre o estado de um dia. */
    var AGREGADO_JULHO_2026 = {
        1: "presente", 2: "presente", 3: "atraso",
        6: "presente", 7: "presente", 8: "presente", 9: "falta", 10: "presente",
        13: "falta", 14: "presente", 15: "atraso", 16: "presente"
    };

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

    function chaveDia(ano, mesIndice0, dia) {
        return ano + "-" + (mesIndice0 + 1) + "-" + dia;
    }

    function statusPseudoAleatorio(dataStr, aluno) {
        var r = hash(dataStr + "#" + aluno.id) % 100;
        if (r < 7) return "falta";
        if (r < 20) return "atraso";
        return "presente";
    }

    function obterStatusDia(ano, mesIndice0, dia, aluno, indiceAluno, dataStr) {
        if (ano === 2026 && mesIndice0 === 6 && AGREGADO_JULHO_2026.hasOwnProperty(dia)) {
            var agregado = AGREGADO_JULHO_2026[dia];
            if (agregado === "presente") return "presente";
            var especial = dia % ESTUDANTES.length;
            return indiceAluno === especial ? agregado : "presente";
        }
        return statusPseudoAleatorio(dataStr, aluno);
    }

    function gerarHorarios(status, dataStr, indiceAluno) {
        if (status === "falta") return { entrada: "--", saida: "--" };
        var h = hash(dataStr + "-h-" + indiceAluno);
        var minEntrada = 15 + (h % 30) + (status === "atraso" ? 20 : 0);
        // >>> em vez de >> — evita minutos negativos quando h >= 2^31
        var minSaida = 5 + ((h >>> 3) % 30);
        return {
            entrada: "07:" + pad(minEntrada % 60),
            saida: "12:" + pad(minSaida)
        };
    }

    /* Fonte única: dado um ano/mês/dia, devolve o registo de todos os
       educandos nesse dia. Usada diretamente pelo Calendário (que precisa
       de navegar mês a mês) e, em baixo, para construir a lista plana usada
       pelo Painel, Relatório e Presença — garantindo que o mesmo dia nunca
       mostra estados diferentes consoante a página. */
    function obterRegistoDia(ano, mesIndice0, dia) {
        var data = new Date(ano, mesIndice0, dia);
        var diaSemana = data.getDay();

        if (diaSemana === 0 || diaSemana === 6) {
            return { tipo: "fds", registos: [] };
        }
        if (data > HOJE) {
            return { tipo: "vazio", registos: [] };
        }

        var dataStr = chaveDia(ano, mesIndice0, dia);
        var registos = ESTUDANTES.map(function (aluno, indice) {
            var status = obterStatusDia(ano, mesIndice0, dia, aluno, indice, dataStr);
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

    function gerarDataset() {
        var registos = [];
        var cursor = new Date(HOJE);
        var diasLetivosGerados = 0;

        while (diasLetivosGerados < 16) {
            var info = obterRegistoDia(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
            if (info.tipo === "letivo") {
                info.registos.forEach(function (r) {
                    registos.push({
                        data: new Date(cursor),
                        aluno: r.aluno,
                        status: r.status,
                        entrada: r.entrada,
                        saida: r.saida
                    });
                });
                diasLetivosGerados++;
            }
            cursor.setDate(cursor.getDate() - 1);
        }
        return registos;
    }

    // Dataset e função de consulta por dia, gerados/expostos uma única vez
    // por carregamento de página e partilhados por todos os scripts.
    window.PG_DADOS = {
        HOJE: HOJE,
        MESES_PT: MESES_PT,
        ESTUDANTES: ESTUDANTES,
        ROTULOS_STATUS: ROTULOS_STATUS,
        hash: hash,
        pad: pad,
        formatarData: formatarData,
        obterRegistoDia: obterRegistoDia,
        statusAgregado: statusAgregado,
        DATASET: gerarDataset()
    };
})();