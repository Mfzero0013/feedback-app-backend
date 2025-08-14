// Este listener principal garante que todo o código que manipula o DOM só rode depois que a página estiver pronta.
document.addEventListener("DOMContentLoaded", () => {

    // Marca o link de navegação da página atual como ativo
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll("nav a");
    links.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("bg-indigo-900");
        }
    });

    // Lógica para o formulário de CADASTRO
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Cadastro realizado com sucesso! Você receberá um e-mail de boas-vindas. Agora você pode fazer o login.');
                    window.location.href = 'index.html';
                } else {
                    alert(`Erro no cadastro: ${result.error || 'Ocorreu um problema.'}`);
                }
            } catch (error) {
                console.error('Erro ao tentar se cadastrar:', error);
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
            }
        });
    }

    // Lógica para o formulário de LOGIN
    const loginForm = document.getElementById('login-form'); // Supondo que o form de login tenha id="login-form"
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Aqui iria a lógica de fetch para /api/auth/login
            alert("Lógica de login a ser implementada com a API.");
            // Exemplo de redirecionamento após login simulado:
            localStorage.setItem('currentUser', 'usuario@empresa.com');
            window.location.href = "dashboard.html";
        });
    }

    // Aplica permissões de visualização com base no perfil do usuário
    applyPermissions();
});

// --- Funções Auxiliares (não precisam estar no DOMContentLoaded) ---

// Sistema de Perfis e Permissões (simulado)
const userProfiles = {
    'admin@empresa.com': { role: 'Administrador', permissions: ['all'] },
    'gestor@empresa.com': { role: 'Gestor', permissions: ['team', 'reports', 'feedback'] },
    'usuario@empresa.com': { role: 'Usuário', permissions: ['feedback', 'profile'] }
};

function checkPermission(permission) {
    const currentUser = localStorage.getItem('currentUser') || 'usuario@empresa.com';
    const userProfile = userProfiles[currentUser];
    if (!userProfile) return false;
    if (userProfile.permissions.includes('all')) return true;
    return userProfile.permissions.includes(permission);
}

function applyPermissions() {
    const adminLink = document.querySelector('a[href="admin.html"]');
    if (adminLink && !checkPermission('all')) {
        adminLink.style.display = 'none';
    }
    // ... outras regras de permissão ...
}

// Navegação
function novoFeedback() {
    window.location.href = "feedback.html";
}

function verDetalhes(id) {
    window.location.href = `feedback.html?id=${id}`;
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function clearFilters() {
    document.getElementById('filterRole').value = '';
    document.getElementById('filterDepartment').value = '';
    document.getElementById('searchUser').value = '';
    // ... outras regras de limpeza de filtros ...

    // Mostrar todas as linhas
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.style.display = '';
    });
    
    updateUserCount();
}

  function updateUserCount() {
    const visibleRows = document.querySelectorAll('tbody tr:not([style*="display: none"])');
    const totalUsers = document.querySelector('.bg-blue-500 h3');
    
    if (totalUsers) {
      totalUsers.textContent = visibleRows.length;
    }
  }

  // Função para exportar dados dos usuários
  function exportUsers() {
    if (!checkPermission('all')) {
      alert('Acesso negado. Apenas administradores podem exportar dados.');
      return;
    }
    
    const visibleRows = document.querySelectorAll('tbody tr:not([style*="display: none"])');
    let csvContent = 'Nome,Email,Perfil,Departamento,Status,Último Acesso\n';
    
    visibleRows.forEach(row => {
      const name = row.querySelector('td:nth-child(1) .font-medium').textContent;
      const email = row.querySelector('td:nth-child(1) .text-gray-500').textContent;
      const role = row.querySelector('td:nth-child(2) span').textContent;
      const department = row.querySelector('td:nth-child(3)').textContent;
      const status = row.querySelector('td:nth-child(4) span').textContent;
      const lastAccess = row.querySelector('td:nth-child(5)').textContent;
      
      csvContent += `"${name}","${email}","${role}","${department}","${status}","${lastAccess}"\n`;
    });
    
    // Criar e baixar arquivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'usuarios_feedbackhub.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Exportação realizada com sucesso!', 'success');
  }

  // Sistema de notificações
  function showNotification(message, type = 'info') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    let bgColor, textColor, icon;
    
    switch(type) {
      case 'success':
        bgColor = 'bg-green-500';
        textColor = 'text-white';
        icon = '✓';
        break;
      case 'error':
        bgColor = 'bg-red-500';
        textColor = 'text-white';
        icon = '✗';
        break;
      case 'warning':
        bgColor = 'bg-yellow-500';
        textColor = 'text-white';
        icon = '⚠';
        break;
      default:
        bgColor = 'bg-blue-500';
        textColor = 'text-white';
        icon = 'ℹ';
    }
    
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-lg">${icon}</span>
        <p class="${textColor}">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    notification.classList.add(bgColor);
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  // Funções do perfil
  function editarPerfil() {
    alert('Função para editar perfil será implementada.');
  }

  function alterarSenha(event) {
    event.preventDefault();
    alert('Senha alterada com sucesso!');
  }


  