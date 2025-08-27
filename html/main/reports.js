document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    loadUsersForFilter();

    const filtersForm = document.getElementById('report-filters-form');
    if (filtersForm) {
        filtersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadReports();
        });
    }

    const tagsContainer = document.getElementById('feedback-type-tags');
    if (tagsContainer) {
        tagsContainer.addEventListener('click', (e) => {
            const clickedTag = e.target.closest('.tag-filter');
            if (clickedTag) {
                // Remove o estado ativo do botão anterior
                const currentActive = tagsContainer.querySelector('.active-tag');
                if (currentActive) {
                    currentActive.classList.remove('active-tag', 'bg-blue-600', 'text-white');
                    // Adiciona de volta a cor original
                    const type = currentActive.dataset.type;
                    if (type === 'ELOGIO') currentActive.classList.add('bg-green-100', 'text-green-800');
                    else if (type === 'SUGESTAO') currentActive.classList.add('bg-purple-100', 'text-purple-800');
                    else if (type === 'CRITICA') currentActive.classList.add('bg-orange-100', 'text-orange-800');
                    else currentActive.classList.add('bg-gray-200', 'text-gray-800'); // Estilo para "Todos"
                }

                // Adiciona o estado ativo ao botão clicado
                clickedTag.classList.add('active-tag', 'bg-blue-600', 'text-white');
                clickedTag.classList.remove('bg-green-100', 'text-green-800', 'bg-purple-100', 'text-purple-800', 'bg-orange-100', 'text-orange-800', 'bg-gray-200', 'text-gray-800');

                loadReports(); // Recarrega os relatórios com o novo filtro
            }
        });
    }

    const exportButton = document.getElementById('export-button');
    exportButton.addEventListener('click', () => {
        exportReport();
    });
});

async function loadReports() {
    const generalContainer = document.getElementById('general-report-container');
    const engagementContainer = document.getElementById('engagement-report-container');
    
    generalContainer.innerHTML = '<p class="text-gray-500">Carregando dados do relatório...</p>';
    engagementContainer.innerHTML = '<p class="text-gray-500">Carregando dados do relatório...</p>';

    const filters = getReportFilters();

    try {
        const [generalReport, engagementReport] = await Promise.all([
            api.getGeneralReport(filters),
            api.getEngagementReport(filters)
        ]);

        renderGeneralReport(generalReport);
        renderEngagementReport(engagementReport);

    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        generalContainer.innerHTML = `<p class="text-red-500">Não foi possível carregar o relatório geral. Tente novamente.</p>`;
        engagementContainer.innerHTML = `<p class="text-red-500">Não foi possível carregar o relatório de engajamento. Tente novamente.</p>`;
    }
}

async function loadUsersForFilter() {
    const userSelect = document.getElementById('filter-user');
    try {
        const users = await api.getUsers();
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nome;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários para o filtro:', error);
    }
}

function renderGeneralReport(report) {
    const container = document.getElementById('general-report-container');
    // A API já retorna o objeto de dados diretamente. Adicionamos uma verificação de segurança.
    if (!report || typeof report.totalFeedbacks === 'undefined') {
        container.innerHTML = '<p class="text-gray-500">Não há dados para o relatório geral.</p>';
        return;
    }

    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Visão Geral dos Feedbacks</h3>
        <p><strong>Total de Feedbacks:</strong> ${report.totalFeedbacks}</p>
        <!-- Adicionar mais detalhes do relatório geral aqui -->
    `;
}

function renderEngagementReport(users) {
    const container = document.getElementById('engagement-report-container');
    // A API já retorna a lista de usuários diretamente. Adicionamos uma verificação.
    if (!users || users.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Não há dados de engajamento para exibir.</p>';
        return;
    }

    let userListHTML = users.map(user => `<li>${user.nome} (${user._count.feedbacksRecebidos || 0} feedbacks)</li>`).join('');

    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Top 10 Usuários Mais Engajados</h3>
        <ul class="list-disc pl-5">${userListHTML}</ul>
    `;
}

function getReportFilters() {
    const form = document.getElementById('report-filters-form');
    const filters = {};

    // Pega os valores dos campos de data e usuário
    const userId = form.elements['userId'].value;
    const startDate = form.elements['startDate'].value;
    const endDate = form.elements['endDate'].value;

    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    // Pega o valor do tipo de feedback da tag ativa
    const activeTag = document.querySelector('#feedback-type-tags .active-tag');
    if (activeTag && activeTag.dataset.type) {
        filters.feedbackType = activeTag.dataset.type;
    }

    return filters;
}

async function exportReport() {
    const filters = getReportFilters();
    try {
        const [generalReport, engagementReport] = await Promise.all([
            api.getGeneralReport(filters),
            api.getEngagementReport(filters)
        ]);

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // General Report CSV
        csvContent += "Relatorio Geral\r\n";
        csvContent += `Total de Feedbacks,${generalReport.totalFeedbacks}\r\n`;
        csvContent += "Status,Contagem\r\n";
        generalReport.feedbacksByStatus.forEach(item => {
            csvContent += `${item.status},${item._count.status}\r\n`;
        });
        csvContent += "\r\n";

        // Engagement Report CSV
        csvContent += "Relatorio de Engajamento\r\n";
        csvContent += "Usuario,Email,Feedbacks Recebidos\r\n";
        engagementReport.forEach(user => {
            csvContent += `${user.nome},${user.email},${user._count.feedbacksRecebidos || 0}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_feedback.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        alert('Não foi possível exportar o relatório.');
    }
}
