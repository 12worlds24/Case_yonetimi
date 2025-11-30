// Ticket Support System - Frontend JavaScript

const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're already on admin page
    if (window.location.pathname === '/admin.html') {
        // Don't do anything, let admin.js handle it
        return;
    }
    
    if (authToken) {
        checkAuth();
    } else {
        showLogin();
    }
});

// Login form handler
document.getElementById('loginFormElement')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.access_token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            // Redirect all users to admin panel
            window.location.replace('/admin.html');
        } else {
            showError(data.detail || 'Giriş başarısız');
        }
    } catch (error) {
        showError('Bağlantı hatası: ' + error.message);
    }
});

// Check authentication
async function checkAuth() {
    try {
        // Try to get user info to verify token
        const response = await fetch(`${API_BASE}/users?limit=1`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // User is authenticated, redirect to admin panel
            window.location.replace('/admin.html');
        } else if (response.status === 401 || response.status === 403) {
            // Not authenticated
            localStorage.removeItem('authToken');
            showLogin();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

// Show login form
function showLogin() {
    const loginContainer = document.getElementById('loginContainer');
    const dashboard = document.getElementById('dashboard');
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
}

// Show dashboard
function showDashboard() {
    const loginContainer = document.getElementById('loginContainer');
    const dashboard = document.getElementById('dashboard');
    if (loginContainer) loginContainer.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    loadDashboard();
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load cases
        const casesResponse = await fetch(`${API_BASE}/cases?limit=10`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const cases = await casesResponse.json();
        
        // Update statistics
        document.getElementById('openCases').textContent = cases.filter(c => c.status === 'bekleyen').length;
        document.getElementById('assignedCases').textContent = cases.length;
        document.getElementById('highPriority').textContent = cases.filter(c => c.priority === 'high').length;
        
        // Load customers
        const customersResponse = await fetch(`${API_BASE}/customers?limit=1`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const customers = await customersResponse.json();
        document.getElementById('totalCustomers').textContent = customers.length > 0 ? '...' : '0';
        
        // Populate cases table
        const tbody = document.getElementById('casesTable');
        if (cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Henüz case bulunmuyor</td></tr>';
        } else {
            tbody.innerHTML = cases.map(caseItem => `
                <tr>
                    <td>${caseItem.id}</td>
                    <td><strong>${caseItem.title}</strong></td>
                    <td>${caseItem.customer?.name || 'N/A'}</td>
                    <td><span class="badge badge-${getPriorityColor(caseItem.priority)}">${getPriorityText(caseItem.priority)}</span></td>
                    <td><span class="badge badge-secondary">${getStatusText(caseItem.status)}</span></td>
                    <td>${new Date(caseItem.created_at).toLocaleDateString('tr-TR')}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewCase(${caseItem.id})">
                            <i class="fas fa-eye"></i> Görüntüle
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Update user info
        if (currentUser) {
            const userInfo = document.getElementById('userInfo');
            const userAvatar = document.getElementById('userAvatar');
            if (userInfo) {
                userInfo.textContent = currentUser.full_name || currentUser.email;
            }
            if (userAvatar && currentUser.full_name) {
                userAvatar.textContent = currentUser.full_name.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Get priority color
function getPriorityColor(priority) {
    const colors = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger'
    };
    return colors[priority] || 'secondary';
}

// Get priority text
function getPriorityText(priority) {
    const texts = {
        'low': 'Düşük',
        'medium': 'Orta',
        'high': 'Yüksek'
    };
    return texts[priority] || priority;
}

// Get status text
function getStatusText(status) {
    const texts = {
        'bekleyen': 'Bekleyen',
        'tamamlanan': 'Tamamlanan',
        'iptal': 'İptal',
        'transfer': 'Transfer'
    };
    return texts[status] || status;
}

// Show section
function showSection(sectionId) {
    // Implementation for section switching
    console.log('Show section:', sectionId);
}

// Create new case
function createNewCase() {
    alert('Yeni case oluşturma özelliği yakında eklenecek');
}

// View case
function viewCase(id) {
    alert('Case detayı yakında eklenecek. Case ID: ' + id);
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    window.location.replace('/');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// API helper function
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${authToken}`
    };
    
    if (body) {
        headers['Content-Type'] = 'application/json';
    }
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return response.json();
}

