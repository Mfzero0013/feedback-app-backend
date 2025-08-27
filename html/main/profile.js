document.addEventListener('DOMContentLoaded', () => {
    const viewMode = document.getElementById('profile-view');
    const editMode = document.getElementById('profile-edit');
    const editButton = document.getElementById('edit-profile-button');
    const saveButton = document.getElementById('save-profile-button');
    const cancelButton = document.getElementById('cancel-edit-button');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileJobTitle = document.getElementById('profile-job-title');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');
    const profileTeam = document.getElementById('profile-team');
    const editAvatar = document.getElementById('edit-profile-avatar');
    const editName = document.getElementById('edit-profile-name');
    const editJobTitle = document.getElementById('edit-profile-job-title');

    let originalUserData = {};
    let viewedUserId = null;

    const loadProfileData = async () => {
        const params = new URLSearchParams(window.location.search);
        viewedUserId = params.get('userId');
        const loggedInUser = JSON.parse(localStorage.getItem('userData'));

        // Se não houver userId na URL, ou se for o perfil do próprio usuário
        if (!viewedUserId || viewedUserId === loggedInUser.id) {
            viewedUserId = loggedInUser.id;
            document.getElementById('edit-profile-button').style.display = 'inline-block';
        } else {
            document.getElementById('edit-profile-button').style.display = 'none';
        }

        try {
            // Usamos um endpoint genérico que busca o usuário pelo ID
            const response = await api.get(`/users/${viewedUserId}`); 
            originalUserData = response.data;
            populateProfileData(originalUserData);
            loadFeedbacks(viewedUserId);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            alert('Não foi possível carregar os dados do perfil.');
            if (error.response && error.response.status === 401) {
                window.location.href = 'index.html';
            }
        }
    };

    const loadFeedbacks = async (userId) => {
        const container = document.getElementById('feedback-history-container');
        if (!container) return;
        container.innerHTML = '<p>Carregando feedbacks...</p>';

        try {
            const response = await api.get(`/feedback?type=received&userId=${userId}`);
            const feedbacks = response.data;

            if (feedbacks.length === 0) {
                container.innerHTML = '<p>Nenhum feedback recebido encontrado para este usuário.</p>';
                return;
            }

            const feedbackList = feedbacks.map(fb => `
                <div class="border-b p-4">
                    <p class="font-bold">${fb.titulo}</p>
                    <p class="text-sm text-gray-600">${fb.descricao}</p>
                    <div class="text-xs text-gray-500 mt-2">
                        <span>Tipo: ${fb.tipo}</span> | 
                        <span>Em: ${new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
            container.innerHTML = feedbackList;

        } catch (error) {
            console.error('Erro ao buscar feedbacks:', error);
            container.innerHTML = '<p class="text-red-500">Erro ao carregar os feedbacks.</p>';
        }
    };

    const populateProfileData = (user) => {
        const avatarUrl = `https://i.pravatar.cc/150?u=${user.email}`;
        profileAvatar.src = avatarUrl;
        profileName.textContent = user.nome;
        profileJobTitle.textContent = user.jobTitle || 'Cargo não definido';
        profileEmail.textContent = user.email;
        profileRole.textContent = user.cargo;
        profileTeam.textContent = user.equipe ? user.equipe.nome : 'Sem equipe';

        editAvatar.src = avatarUrl;
        editName.value = user.nome;
        editJobTitle.value = user.jobTitle || '';
    };

    const toggleEditMode = (isEditing) => {
        viewMode.classList.toggle('hidden', isEditing);
        editMode.classList.toggle('hidden', !isEditing);
        editButton.classList.toggle('hidden', isEditing);
        saveButton.classList.toggle('hidden', !isEditing);
        cancelButton.classList.toggle('hidden', !isEditing);
    };

    const saveProfileChanges = async () => {
        const updatedData = {
            nome: editName.value.trim(),
            jobTitle: editJobTitle.value.trim(),
        };

        if (!updatedData.nome) {
            alert('O nome não pode ficar em branco.');
            return;
        }

        try {
            const response = await api.patch(`/users/${viewedUserId}`, updatedData);
            originalUserData = response.data.user;
            localStorage.setItem('userData', JSON.stringify(originalUserData));
            populateProfileData(originalUserData);
            toggleEditMode(false);
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar o perfil:', error);
            alert('Falha ao salvar as alterações. Tente novamente.');
        }
    };

    editButton.addEventListener('click', () => toggleEditMode(true));
    cancelButton.addEventListener('click', () => toggleEditMode(false));
    saveButton.addEventListener('click', saveProfileChanges);

    loadProfileData();
});
