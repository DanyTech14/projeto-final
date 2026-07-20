/* ==========================================================================
   Presence Guard — Dados partilhados
   Fonte única do dataset de presenças, usada tanto pelo Painel (painel.js)
   como pelo Relatório (relatorio.js), para que os números batam sempre
   certo entre páginas. Carregar antes de painel.js / relatorio.js.
   ========================================================================== */
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
                    // >>> em vez de >> — evita minutos negativos quando h >= 2^31 (ver correção do bug "12:0-15")
                    var minSaida = 5 + ((h >>> 3) % 30);
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

    // Dataset gerado uma única vez por carregamento de página e partilhado
    // por todos os scripts que precisem dele (painel.js, relatorio.js, ...).
    window.PG_DADOS = {
        HOJE: HOJE,
        MESES_PT: MESES_PT,
        ESTUDANTES: ESTUDANTES,
        ROTULOS_STATUS: ROTULOS_STATUS,
        hash: hash,
        pad: pad,
        formatarData: formatarData,
        DATASET: gerarDataset()
    };
})();