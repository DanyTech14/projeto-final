document.addEventListener('DOMContentLoaded', () => {
    const corpoTabela = document.getElementById('corpoTabela');
    const linhas = Array.from(corpoTabela.querySelectorAll('tr'));

    const inputPesquisa = document.getElementById('pesquisaAluno');
    const filtroTurma = document.getElementById('filtroTurma');
    const filtroStatus = document.getElementById('filtroStatus');
    const btnLimpar = document.getElementById('limparFiltros');
    const semResultados = document.getElementById('semResultados');

    const totalPresentes = document.getElementById('totalPresentes');
    const totalAtrasos = document.getElementById('totalAtrasos');
    const totalAusentes = document.getElementById('totalAusentes');

    const modal = document.getElementById('modalVer');
    const fecharModal = document.getElementById('fecharModal');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalTurma = document.getElementById('modalTurma');
    const modalCartao = document.getElementById('modalCartao');
    const modalEntrada = document.getElementById('modalEntrada');
    const modalSaida = document.getElementById('modalSaida');
    const modalStatus = document.getElementById('modalStatus');

    const rotulos = {
        presente: 'Presente',
        atraso: 'Atraso',
        ausente: 'Ausente'
    };

    // Actualiza os cartões de resumo com base no estado actual (não filtrado) de cada aluno
    function atualizarResumo() {
        let presentes = 0, atrasos = 0, ausentes = 0;
        linhas.forEach(linha => {
            switch (linha.dataset.status) {
                case 'presente': presentes++; break;
                case 'atraso': atrasos++; break;
                case 'ausente': ausentes++; break;
            }
        });
        totalPresentes.textContent = presentes;
        totalAtrasos.textContent = atrasos;
        totalAusentes.textContent = ausentes;
    }

    // Aplica pesquisa por nome + filtros de turma/estado, mostrando/escondendo linhas
    function aplicarFiltros() {
        const termo = inputPesquisa.value.trim().toLowerCase();
        const turma = filtroTurma.value;
        const status = filtroStatus.value;
        let visiveis = 0;

        linhas.forEach(linha => {
            const nomeCoincide = linha.dataset.aluno.toLowerCase().includes(termo);
            const turmaCoincide = turma === 'todas' || linha.dataset.turma === turma;
            const statusCoincide = status === 'todos' || linha.dataset.status === status;
            const mostrar = nomeCoincide && turmaCoincide && statusCoincide;

            linha.hidden = !mostrar;
            if (mostrar) visiveis++;
        });

        semResultados.hidden = visiveis !== 0;
    }

    inputPesquisa.addEventListener('input', aplicarFiltros);
    filtroTurma.addEventListener('change', aplicarFiltros);
    filtroStatus.addEventListener('change', aplicarFiltros);

    btnLimpar.addEventListener('click', () => {
        inputPesquisa.value = '';
        filtroTurma.value = 'todas';
        filtroStatus.value = 'todos';
        aplicarFiltros();
    });

    // Botão "Ver": abre o modal com os detalhes da linha
    corpoTabela.addEventListener('click', (evento) => {
        const botaoVer = evento.target.closest('.btn-ver');
        if (!botaoVer) return;

        const linha = botaoVer.closest('tr');
        modalTitulo.textContent = linha.dataset.aluno;
        modalTurma.textContent = linha.dataset.turma;
        modalCartao.textContent = linha.children[2].textContent;
        modalEntrada.textContent = linha.querySelector('.col-entrada').textContent;
        modalSaida.textContent = linha.querySelector('.col-saida').textContent;
        modalStatus.textContent = rotulos[linha.dataset.status] || linha.dataset.status;

        modal.hidden = false;
    });

    function fechar() { modal.hidden = true; }
    fecharModal.addEventListener('click', fechar);
    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) fechar();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modal.hidden) fechar();
    });

    // Botão "Editar": alterna entre modo leitura e modo edição na própria linha
    corpoTabela.addEventListener('click', (evento) => {
        const botaoEditar = evento.target.closest('.btn-edt');
        if (!botaoEditar) return;

        const linha = botaoEditar.closest('tr');
        const emEdicao = botaoEditar.classList.contains('a-editar');

        if (!emEdicao) {
            entrarModoEdicao(linha, botaoEditar);
        } else {
            guardarEdicao(linha, botaoEditar);
        }
    });

    function entrarModoEdicao(linha, botao) {
        const celEntrada = linha.querySelector('.col-entrada');
        const celSaida = linha.querySelector('.col-saida');
        const celStatus = linha.querySelector('.col-status');

        const valorEntrada = celEntrada.textContent.trim();
        const valorSaida = celSaida.textContent.trim();
        const statusAtual = linha.dataset.status;

        celEntrada.innerHTML = `<input type="text" class="editar-input" value="${valorEntrada}">`;
        celSaida.innerHTML = `<input type="text" class="editar-input" value="${valorSaida}">`;
        celStatus.innerHTML = `
            <select class="editar-select">
                <option value="presente" ${statusAtual === 'presente' ? 'selected' : ''}>Presente</option>
                <option value="atraso" ${statusAtual === 'atraso' ? 'selected' : ''}>Atraso</option>
                <option value="ausente" ${statusAtual === 'ausente' ? 'selected' : ''}>Ausente</option>
            </select>`;

        botao.textContent = 'Guardar';
        botao.classList.add('a-editar');
    }

    function guardarEdicao(linha, botao) {
        const celEntrada = linha.querySelector('.col-entrada');
        const celSaida = linha.querySelector('.col-saida');
        const celStatus = linha.querySelector('.col-status');

        const novaEntrada = celEntrada.querySelector('input').value.trim() || '--';
        const novaSaida = celSaida.querySelector('input').value.trim() || '--';
        const novoStatus = celStatus.querySelector('select').value;

        celEntrada.textContent = novaEntrada;
        celSaida.textContent = novaSaida;
        celStatus.innerHTML = `<span class="status-${novoStatus}">${rotulos[novoStatus]}</span>`;

        linha.dataset.status = novoStatus;

        botao.textContent = 'Editar';
        botao.classList.remove('a-editar');

        atualizarResumo();
        aplicarFiltros();
    }

    // Estado inicial
    atualizarResumo();
    aplicarFiltros();
});