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
            
            // Check if user is admin, redirect to admin panel
            const isAdmin = data.user.roles && data.user.roles.some(r => r.name === 'Admin' || r.name === 'Yönetici');
            if (isAdmin) {
                // Redirect to admin panel immediately
                window.location.replace('/admin.html');
            } else {
                showDashboard();
            }
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
            // User is authenticated, show dashboard
            showDashboard();
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
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
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
        tbody.innerHTML = cases.map(caseItem => `
            <tr>
                <td>${caseItem.id}</td>
                <td>${caseItem.title}</td>
                <td>${caseItem.customer?.name || 'N/A'}</td>
                <td><span class="badge bg-${getPriorityColor(caseItem.priority)}">${caseItem.priority}</span></td>
                <td><span class="badge bg-secondary">${caseItem.status}</span></td>
                <td>${new Date(caseItem.created_at).toLocaleDateString('tr-TR')}</td>
            </tr>
        `).join('');
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

