// Admin Panel JavaScript

const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let departments = [];
let roles = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!authToken) {
        window.location.replace('/');
        return;
    }
    // Just load data, handle auth errors in individual functions
    document.getElementById('userInfo').textContent = 'Hoş geldiniz, Admin';
    loadAllData();
});

// Load all data
async function loadAllData() {
    await Promise.all([
        loadUsers(),
        loadCustomers(),
        loadProducts(),
        loadDepartments(),
        loadRoles(),
        loadCases()
    ]);
}

// ========== USERS ==========
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            alert('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            window.location.replace('/');
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const users = await response.json();
        
        const tbody = document.getElementById('usersTable');
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Kullanıcı bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.full_name}</td>
                <td>${user.department?.name || 'N/A'}</td>
                <td>${user.roles?.map(r => r.name).join(', ') || 'Rol yok'}</td>
                <td><span class="badge bg-${user.is_active === 1 ? 'success' : 'danger'}">${user.is_active === 1 ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Sil</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
    }
}

function showAddUserModal() {
    // Load departments and roles first
    Promise.all([
        fetch(`${API_BASE}/users/departments`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.json()),
        fetch(`${API_BASE}/users/roles`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.json())
    ]).then(([depts, rols]) => {
        departments = depts;
        roles = rols;
        
        const modal = createModal('addUserModal', 'Yeni Kullanıcı Ekle', `
            <form id="addUserForm">
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="userEmail" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Şifre</label>
                    <input type="password" class="form-control" id="userPassword" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Ad Soyad</label>
                    <input type="text" class="form-control" id="userFullName" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Departman</label>
                    <select class="form-select" id="userDepartment">
                        <option value="">Seçiniz</option>
                        ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Roller</label>
                    <div>
                        ${rols.map(r => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="${r.id}" id="role_${r.id}">
                                <label class="form-check-label" for="role_${r.id}">${r.name}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </form>
        `, async () => {
            const form = document.getElementById('addUserForm');
            const roleIds = Array.from(document.querySelectorAll('#addUserForm input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
            
            const userData = {
                email: document.getElementById('userEmail').value,
                password: document.getElementById('userPassword').value,
                full_name: document.getElementById('userFullName').value,
                department_id: document.getElementById('userDepartment').value || null,
                role_ids: roleIds
            };
            
            try {
                const response = await fetch(`${API_BASE}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    alert('Kullanıcı başarıyla eklendi!');
                    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                    loadUsers();
                } else {
                    const error = await response.json();
                    alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
                }
            } catch (error) {
                alert('Hata: ' + error.message);
            }
        });
        
        const modalElement = new bootstrap.Modal(document.getElementById('addUserModal'));
        modalElement.show();
    });
}

// ========== CUSTOMERS ==========
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE}/customers`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const customers = await response.json();
        
        const tbody = document.getElementById('customersTable');
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Müşteri bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.company_name || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editCustomer(${customer.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">Sil</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function showAddCustomerModal() {
    const modal = createModal('addCustomerModal', 'Yeni Müşteri Ekle', `
        <form id="addCustomerForm">
            <div class="mb-3">
                <label class="form-label">Ad *</label>
                <input type="text" class="form-control" id="customerName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Şirket Adı</label>
                <input type="text" class="form-control" id="customerCompany">
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="customerEmail">
            </div>
            <div class="mb-3">
                <label class="form-label">Telefon</label>
                <input type="text" class="form-control" id="customerPhone">
            </div>
            <div class="mb-3">
                <label class="form-label">Adres</label>
                <textarea class="form-control" id="customerAddress"></textarea>
            </div>
        </form>
    `, async () => {
        const customerData = {
            name: document.getElementById('customerName').value,
            company_name: document.getElementById('customerCompany').value || null,
            email: document.getElementById('customerEmail').value || null,
            phone: document.getElementById('customerPhone').value || null,
            address: document.getElementById('customerAddress').value || null
        };
        
        try {
            const response = await fetch(`${API_BASE}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(customerData)
            });
            
            if (response.ok) {
                alert('Müşteri başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
                loadCustomers();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    });
    
    const modalElement = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    modalElement.show();
}

// ========== PRODUCTS ==========
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const products = await response.json();
        
        const tbody = document.getElementById('productsTable');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Ürün bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.code || 'N/A'}</td>
                <td>${product.category || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editProduct(${product.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">Sil</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function showAddProductModal() {
    const modal = createModal('addProductModal', 'Yeni Ürün Ekle', `
        <form id="addProductForm">
            <div class="mb-3">
                <label class="form-label">Ürün Adı *</label>
                <input type="text" class="form-control" id="productName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Ürün Kodu</label>
                <input type="text" class="form-control" id="productCode">
            </div>
            <div class="mb-3">
                <label class="form-label">Kategori</label>
                <input type="text" class="form-control" id="productCategory">
            </div>
            <div class="mb-3">
                <label class="form-label">Açıklama</label>
                <textarea class="form-control" id="productDescription"></textarea>
            </div>
        </form>
    `, async () => {
        const productData = {
            name: document.getElementById('productName').value,
            code: document.getElementById('productCode').value || null,
            category: document.getElementById('productCategory').value || null,
            description: document.getElementById('productDescription').value || null
        };
        
        try {
            const response = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                alert('Ürün başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                loadProducts();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    });
    
    const modalElement = new bootstrap.Modal(document.getElementById('addProductModal'));
    modalElement.show();
}

// ========== DEPARTMENTS ==========
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE}/users/departments`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const depts = await response.json();
        departments = depts;
        
        const tbody = document.getElementById('departmentsTable');
        if (depts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Departman bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = depts.map(dept => `
            <tr>
                <td>${dept.id}</td>
                <td>${dept.name}</td>
                <td>${dept.description || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editDepartment(${dept.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Sil</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

function showAddDepartmentModal() {
    const modal = createModal('addDepartmentModal', 'Yeni Departman Ekle', `
        <form id="addDepartmentForm">
            <div class="mb-3">
                <label class="form-label">Departman Adı *</label>
                <input type="text" class="form-control" id="departmentName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Açıklama</label>
                <textarea class="form-control" id="departmentDescription"></textarea>
            </div>
        </form>
    `, async () => {
        const deptData = {
            name: document.getElementById('departmentName').value,
            description: document.getElementById('departmentDescription').value || null
        };
        
        try {
            const response = await fetch(`${API_BASE}/users/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(deptData)
            });
            
            if (response.ok) {
                alert('Departman başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addDepartmentModal')).hide();
                loadDepartments();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    });
    
    const modalElement = new bootstrap.Modal(document.getElementById('addDepartmentModal'));
    modalElement.show();
}

// ========== ROLES ==========
async function loadRoles() {
    try {
        const response = await fetch(`${API_BASE}/users/roles`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const rols = await response.json();
        roles = rols;
        
        const tbody = document.getElementById('rolesTable');
        if (rols.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Rol bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = rols.map(role => `
            <tr>
                <td>${role.id}</td>
                <td>${role.name}</td>
                <td>${role.description || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editRole(${role.id})">Düzenle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRole(${role.id})">Sil</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

function showAddRoleModal() {
    const modal = createModal('addRoleModal', 'Yeni Rol Ekle', `
        <form id="addRoleForm">
            <div class="mb-3">
                <label class="form-label">Rol Adı *</label>
                <input type="text" class="form-control" id="roleName" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Açıklama</label>
                <textarea class="form-control" id="roleDescription"></textarea>
            </div>
        </form>
    `, async () => {
        const roleData = {
            name: document.getElementById('roleName').value,
            description: document.getElementById('roleDescription').value || null
        };
        
        try {
            const response = await fetch(`${API_BASE}/users/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(roleData)
            });
            
            if (response.ok) {
                alert('Rol başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addRoleModal')).hide();
                loadRoles();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    });
    
    const modalElement = new bootstrap.Modal(document.getElementById('addRoleModal'));
    modalElement.show();
}

// ========== CASES ==========
async function loadCases() {
    try {
        const response = await fetch(`${API_BASE}/cases`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const cases = await response.json();
        
        const tbody = document.getElementById('casesTable');
        if (cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Case bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = cases.map(caseItem => `
            <tr>
                <td>${caseItem.id}</td>
                <td>${caseItem.title}</td>
                <td>${caseItem.customer?.name || 'N/A'}</td>
                <td><span class="badge bg-${getPriorityColor(caseItem.priority)}">${caseItem.priority}</span></td>
                <td><span class="badge bg-secondary">${caseItem.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewCase(${caseItem.id})">Görüntüle</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading cases:', error);
    }
}

function getPriorityColor(priority) {
    const colors = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger'
    };
    return colors[priority] || 'secondary';
}

// ========== HELPER FUNCTIONS ==========
function createModal(id, title, body, onSave) {
    const modalsContainer = document.getElementById('modalsContainer');
    
    // Remove existing modal if exists
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    
    const modalHTML = `
        <div class="modal fade" id="${id}" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary" onclick="save${id.charAt(0).toUpperCase() + id.slice(1)}()">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modalsContainer.insertAdjacentHTML('beforeend', modalHTML);
    
    // Store save function
    window[`save${id.charAt(0).toUpperCase() + id.slice(1)}`] = onSave;
    
    return document.getElementById(id);
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.replace('/');
}

// Placeholder functions for edit/delete
function editUser(id) { alert('Düzenleme özelliği yakında eklenecek'); }
async function deleteUser(id) { 
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`${API_BASE}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok || response.status === 204) {
                alert('Kullanıcı silindi!');
                loadUsers();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.detail || 'Bilinmeyen hata'));
            }
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    }
}
function editCustomer(id) { alert('Düzenleme özelliği yakında eklenecek'); }
function deleteCustomer(id) { 
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
        fetch(`${API_BASE}/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(() => loadCustomers());
    }
}
function editProduct(id) { alert('Düzenleme özelliği yakında eklenecek'); }
function deleteProduct(id) { 
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(() => loadProducts());
    }
}
function editDepartment(id) { alert('Düzenleme özelliği yakında eklenecek'); }
function deleteDepartment(id) { alert('Silme özelliği yakında eklenecek'); }
function editRole(id) { alert('Düzenleme özelliği yakında eklenecek'); }
function deleteRole(id) { alert('Silme özelliği yakında eklenecek'); }
function viewCase(id) { alert('Case detayı yakında eklenecek'); }

