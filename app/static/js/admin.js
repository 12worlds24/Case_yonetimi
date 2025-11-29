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
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    if (userInfo) {
        userInfo.textContent = 'Admin';
    }
    if (userAvatar) {
        userAvatar.textContent = 'A';
    }
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
            notifyError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            setTimeout(() => window.location.replace('/'), 2000);
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
                <td><strong>${user.full_name}</strong></td>
                <td>${user.department?.name || 'N/A'}</td>
                <td>${user.roles?.map(r => `<span class="badge badge-primary">${r.name}</span>`).join(' ') || '<span class="badge badge-secondary">Rol yok</span>'}</td>
                <td><span class="badge badge-${user.is_active === 1 ? 'success' : 'danger'}">${user.is_active === 1 ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
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
            <form id="addUserForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-group with-icon">
                        <label class="form-label">Ad Soyad *</label>
                        <div class="input-icon">
                            <i class="fas fa-user"></i>
                            <input type="text" class="form-control" id="userFullName" placeholder="Çalışan adı soyadı" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">E-posta *</label>
                        <div class="input-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" class="form-control" id="userEmail" placeholder="isim.soyisim@sirket.com" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Şifre *</label>
                        <div class="input-icon">
                            <i class="fas fa-key"></i>
                            <input type="password" class="form-control" id="userPassword" placeholder="En az 8 karakter" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Departman</label>
                        <div class="input-icon">
                            <i class="fas fa-sitemap"></i>
                            <select class="form-select" id="userDepartment">
                                <option value="">Lütfen bir departman seçin</option>
                                ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Pozisyon</label>
                        <div class="input-icon">
                            <i class="fas fa-briefcase"></i>
                            <input type="text" class="form-control" id="userPosition" placeholder="Pozisyon seçiniz">
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Durum</label>
                        <div class="input-icon">
                            <i class="fas fa-toggle-on"></i>
                            <select class="form-select" id="userStatus">
                                <option value="active" selected>Aktif</option>
                                <option value="passive">Pasif</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Başlangıç Tarihi</label>
                        <div class="input-icon">
                            <i class="fas fa-calendar-alt"></i>
                            <input type="date" class="form-control" id="userStartDate">
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">İşten Çıkış Tarihi</label>
                        <div class="input-icon">
                            <i class="fas fa-calendar-times"></i>
                            <input type="date" class="form-control" id="userEndDate">
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Roller *</label>
                        <div class="role-chip-list">
                            ${rols.map(r => `
                                <label class="role-chip">
                                    <input type="checkbox" value="${r.id}" id="role_${r.id}">
                                    <span><i class="fas fa-user-shield"></i> ${r.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Notlar</label>
                        <div class="input-icon">
                            <i class="fas fa-sticky-note"></i>
                            <textarea class="form-control" id="userNotes" placeholder="Çalışan hakkında notlar..." rows="3"></textarea>
                        </div>
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
                role_ids: roleIds,
                metadata: {
                    position: document.getElementById('userPosition').value || null,
                    status: document.getElementById('userStatus').value,
                    start_date: document.getElementById('userStartDate').value || null,
                    end_date: document.getElementById('userEndDate').value || null,
                    notes: document.getElementById('userNotes').value || null
                }
            };
            if (!roleIds.length) {
                notifyWarning('Lütfen en az bir rol seçin.');
                return;
            }
            
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
                    notifySuccess('Kullanıcı başarıyla eklendi!');
                    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                    loadUsers();
                } else {
                    const error = await response.json();
                    notifyError(error.detail || 'Bilinmeyen hata');
                }
            } catch (error) {
                notifyError(error.message);
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
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            notifyError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            setTimeout(() => window.location.replace('/'), 2000);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const customers = await response.json();
        
        const tbody = document.getElementById('customersTable');
        if (!customers || !Array.isArray(customers)) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Müşteri bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.id}</td>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.company_name || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading customers:', error);
        const tbody = document.getElementById('customersTable');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
    }
}

function showAddCustomerModal() {
    const modal = createModal('addCustomerModal', 'Müşteri Ekle', `
        <form id="addCustomerForm" class="modal-form">
            <div class="form-grid">
                <div class="form-group with-icon">
                    <label class="form-label">Müşteri Adı *</label>
                    <div class="input-icon">
                        <i class="fas fa-id-card"></i>
                        <input type="text" class="form-control" id="customerName" placeholder="Örn: Ahmet Yılmaz" required>
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Müşteri Türü *</label>
                    <div class="input-icon">
                        <i class="fas fa-briefcase"></i>
                        <select class="form-select" id="customerType" required>
                            <option value="Kurumsal">Kurumsal</option>
                            <option value="Bireysel">Bireysel</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Şirket Adı</label>
                    <div class="input-icon">
                        <i class="fas fa-building"></i>
                        <input type="text" class="form-control" id="customerCompany" placeholder="Firma adı (opsiyonel)">
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">E-posta</label>
                    <div class="input-icon">
                        <i class="fas fa-envelope"></i>
                        <input type="email" class="form-control" id="customerEmail" placeholder="ornek@firma.com">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Telefon</label>
                    <div class="input-row">
                        <select class="form-select" id="customerPhoneCode">
                            <option value="+90" selected>TR +90</option>
                        </select>
                        <input type="tel" class="form-control" id="customerPhone" placeholder="5 _ _ _  _ _  _ _" maxlength="10">
                    </div>
                    <small class="form-note">Başında 0 olmadan 10 haneli giriniz</small>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Şehir *</label>
                    <div class="input-icon">
                        <i class="fas fa-map-marker-alt"></i>
                        <input type="text" class="form-control" id="customerCity" placeholder="Şehir seçiniz" required>
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">İlçe *</label>
                    <div class="input-icon">
                        <i class="fas fa-map"></i>
                        <input type="text" class="form-control" id="customerDistrict" placeholder="Önce şehir seçiniz" required>
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Adres *</label>
                    <div class="input-icon">
                        <i class="fas fa-location-arrow"></i>
                        <input type="text" class="form-control" id="customerAddress" placeholder="Örn: Atatürk Cad. No:15 D:3" required>
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Vergi No</label>
                    <div class="input-icon">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <input type="text" class="form-control" id="customerTaxNumber" placeholder="Vergi numarası giriniz">
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Vergi Dairesi</label>
                    <div class="input-icon">
                        <i class="fas fa-university"></i>
                        <input type="text" class="form-control" id="customerTaxOffice" placeholder="Vergi dairesi adı">
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Kontak Kişi Adı</label>
                    <div class="input-icon">
                        <i class="fas fa-user"></i>
                        <input type="text" class="form-control" id="contactName" placeholder="Örn: Mehmet Demir">
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">İlgili Kişi E-posta</label>
                    <div class="input-icon">
                        <i class="fas fa-at"></i>
                        <input type="email" class="form-control" id="contactEmail" placeholder="ilgili@firma.com">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Kontak Kişi Telefon</label>
                    <div class="input-row">
                        <select class="form-select" id="contactPhoneCode">
                            <option value="+90" selected>TR +90</option>
                        </select>
                        <input type="tel" class="form-control" id="contactPhone" placeholder="5 _ _ _  _ _  _ _" maxlength="10">
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Faaliyet Alanı</label>
                    <div class="input-icon">
                        <i class="fas fa-layer-group"></i>
                        <select class="form-select" id="customerActivity">
                            <option value="">Seçiniz</option>
                            <option>Teknoloji</option>
                            <option>Finans</option>
                            <option>Sağlık</option>
                            <option>Üretim</option>
                            <option>Diğer</option>
                        </select>
                    </div>
                </div>
                <div class="form-group with-icon">
                    <label class="form-label">Müşteri Kaynağı</label>
                    <div class="input-icon">
                        <i class="fas fa-share-alt"></i>
                        <select class="form-select" id="customerSource">
                            <option value="">Seçiniz</option>
                            <option>Referans</option>
                            <option>Web</option>
                            <option>Etkinlik</option>
                            <option>Diğer</option>
                        </select>
                    </div>
                </div>
                <div class="form-group with-icon" style="grid-column: 1 / -1;">
                    <label class="form-label">Notlar</label>
                    <div class="input-icon">
                        <i class="fas fa-sticky-note"></i>
                        <textarea class="form-control" id="customerNotes" placeholder="Müşteri hakkında notlar..." rows="3"></textarea>
                    </div>
                </div>
            </div>
        </form>
    `, async () => {
        const customerData = {
            name: getInputValue('customerName'),
            company_name: getInputValue('customerCompany'),
            email: getInputValue('customerEmail'),
            phone: combinePhone('customerPhoneCode', 'customerPhone'),
            address: getInputValue('customerAddress'),
            contact_person: getInputValue('contactName'),
            contact_email: getInputValue('contactEmail'),
            contact_phone: combinePhone('contactPhoneCode', 'contactPhone')
        };

        const customFields = {
            customer_type: getInputValue('customerType'),
            city: getInputValue('customerCity'),
            district: getInputValue('customerDistrict'),
            tax_number: getInputValue('customerTaxNumber'),
            tax_office: getInputValue('customerTaxOffice'),
            activity_area: getInputValue('customerActivity'),
            source: getInputValue('customerSource'),
            notes: getInputValue('customerNotes')
        };
        Object.keys(customFields).forEach(key => {
            if (!customFields[key]) delete customFields[key];
        });
        customerData.custom_fields = Object.keys(customFields).length ? customFields : null;
        
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
                notifySuccess('Müşteri başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
                loadCustomers();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
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
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            notifyError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            setTimeout(() => window.location.replace('/'), 2000);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const products = await response.json();
        
        const tbody = document.getElementById('productsTable');
        if (!products || !Array.isArray(products)) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Ürün bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td><span class="badge badge-info">${product.code || 'N/A'}</span></td>
                <td>${product.category || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        const tbody = document.getElementById('productsTable');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
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
                notifySuccess('Ürün başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
                loadProducts();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
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
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            notifyError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            setTimeout(() => window.location.replace('/'), 2000);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const depts = await response.json();
        departments = depts;
        
        const tbody = document.getElementById('departmentsTable');
        if (!depts || !Array.isArray(depts)) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }
        
        if (depts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Departman bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = depts.map(dept => `
            <tr>
                <td>${dept.id}</td>
                <td><strong>${dept.name}</strong></td>
                <td>${dept.description || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editDepartment(${dept.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading departments:', error);
        const tbody = document.getElementById('departmentsTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
        }
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
                notifySuccess('Departman başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addDepartmentModal')).hide();
                loadDepartments();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
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
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            notifyError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            setTimeout(() => window.location.replace('/'), 2000);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const rols = await response.json();
        roles = rols;
        
        const tbody = document.getElementById('rolesTable');
        if (!rols || !Array.isArray(rols)) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }
        
        if (rols.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Rol bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = rols.map(role => `
            <tr>
                <td>${role.id}</td>
                <td><strong>${role.name}</strong></td>
                <td>${role.description || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editRole(${role.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRole(${role.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading roles:', error);
        const tbody = document.getElementById('rolesTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
        }
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
                notifySuccess('Rol başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addRoleModal')).hide();
                loadRoles();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
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
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            notifyError('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            setTimeout(() => window.location.replace('/'), 2000);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const cases = await response.json();
        
        const tbody = document.getElementById('casesTable');
        if (!cases || !Array.isArray(cases)) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }
        
        if (cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Case bulunamadı</td></tr>';
            return;
        }
        
        tbody.innerHTML = cases.map(caseItem => `
            <tr>
                <td>${caseItem.id}</td>
                <td><strong>${caseItem.title}</strong></td>
                <td>${caseItem.customer?.name || 'N/A'}</td>
                <td><span class="badge badge-${getPriorityColor(caseItem.priority)}">${getPriorityText(caseItem.priority)}</span></td>
                <td><span class="badge badge-secondary">${getStatusText(caseItem.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCase(${caseItem.id})">
                        <i class="fas fa-eye"></i> Görüntüle
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading cases:', error);
        const tbody = document.getElementById('casesTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
        }
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

function getPriorityText(priority) {
    const texts = {
        'low': 'Düşük',
        'medium': 'Orta',
        'high': 'Yüksek'
    };
    return texts[priority] || priority;
}

function getStatusText(status) {
    const texts = {
        'bekleyen': 'Bekleyen',
        'tamamlanan': 'Tamamlanan',
        'iptal': 'İptal',
        'transfer': 'Transfer'
    };
    return texts[status] || status;
}

// ========== HELPER FUNCTIONS ==========
function createModal(id, title, body, onSave) {
    const modalsContainer = document.getElementById('modalsContainer');
    
    // Remove existing modal if exists
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    
    const modalHTML = `
        <div class="modal fade custom-modal" id="${id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-plus-circle"></i> ${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i> İptal
                        </button>
                        <button type="button" class="btn btn-primary" onclick="save${id.charAt(0).toUpperCase() + id.slice(1)}()">
                            <i class="fas fa-save"></i> Kaydet
                        </button>
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

const toastIcons = {
    success: 'fas fa-circle-check',
    error: 'fas fa-triangle-exclamation',
    warning: 'fas fa-circle-exclamation',
    info: 'fas fa-circle-info'
};

function showToast(type = 'success', title = 'Başarılı', message = 'İşlem tamamlandı') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${toastIcons[type] || toastIcons.info}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Kapat">&times;</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => hideToast(toast));
    
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => hideToast(toast), 4000);
}

function hideToast(toast) {
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}

function notifySuccess(message, title = 'Başarılı') {
    showToast('success', title, message);
}

function notifyError(message, title = 'Hata') {
    showToast('error', title, message);
}

function notifyWarning(message, title = 'Uyarı') {
    showToast('warning', title, message);
}

function notifyInfo(message, title = 'Bilgi') {
    showToast('info', title, message);
}

function getInputValue(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const value = el.value.trim();
    return value ? value : null;
}

function combinePhone(codeId, numberId) {
    const code = document.getElementById(codeId)?.value || '';
    const number = document.getElementById(numberId)?.value.trim();
    if (!number) return null;
    return `${code} ${number}`;
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.replace('/');
}

// Placeholder functions for edit/delete
async function editUser(id) {
    try {
        // Fetch user data
        const response = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Kullanıcı verileri yüklenemedi');
        
        const users = await response.json();
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('Kullanıcı bulunamadı');
        
        // Load departments and roles
        const [deptsRes, rolesRes] = await Promise.all([
            fetch(`${API_BASE}/users/departments`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
            fetch(`${API_BASE}/users/roles`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);
        
        const depts = await deptsRes.json();
        const rols = await rolesRes.json();
        
        const modal = createModal('editUserModal', 'Kullanıcı Düzenle', `
            <form id="editUserForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-group with-icon">
                        <label class="form-label">Ad Soyad *</label>
                        <div class="input-icon">
                            <i class="fas fa-user"></i>
                            <input type="text" class="form-control" id="editUserFullName" value="${user.full_name || ''}" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">E-posta *</label>
                        <div class="input-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" class="form-control" id="editUserEmail" value="${user.email || ''}" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Şifre (Değiştirmek için doldurun)</label>
                        <div class="input-icon">
                            <i class="fas fa-key"></i>
                            <input type="password" class="form-control" id="editUserPassword" placeholder="Yeni şifre">
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Departman</label>
                        <div class="input-icon">
                            <i class="fas fa-sitemap"></i>
                            <select class="form-select" id="editUserDepartment">
                                <option value="">Lütfen bir departman seçin</option>
                                ${depts.map(d => `<option value="${d.id}" ${user.department_id === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Durum</label>
                        <div class="input-icon">
                            <i class="fas fa-toggle-on"></i>
                            <select class="form-select" id="editUserStatus">
                                <option value="1" ${user.is_active === 1 ? 'selected' : ''}>Aktif</option>
                                <option value="0" ${user.is_active === 0 ? 'selected' : ''}>Pasif</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Roller *</label>
                        <div class="role-chip-list">
                            ${rols.map(r => `
                                <label class="role-chip">
                                    <input type="checkbox" value="${r.id}" id="editRole_${r.id}" ${user.roles?.some(ur => ur.id === r.id) ? 'checked' : ''}>
                                    <span><i class="fas fa-user-shield"></i> ${r.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </form>
        `, async () => {
            const roleIds = Array.from(document.querySelectorAll('#editUserForm input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
            
            const userData = {
                email: document.getElementById('editUserEmail').value,
                full_name: document.getElementById('editUserFullName').value,
                department_id: document.getElementById('editUserDepartment').value || null,
                is_active: parseInt(document.getElementById('editUserStatus').value),
                role_ids: roleIds
            };
            
            const password = document.getElementById('editUserPassword').value;
            if (password) {
                userData.password = password;
            }
            
            if (!roleIds.length) {
                notifyWarning('Lütfen en az bir rol seçin.');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/users/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    notifySuccess('Kullanıcı başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
                    loadUsers();
                } else {
                    const error = await response.json();
                    notifyError(error.detail || 'Bilinmeyen hata');
                }
            } catch (error) {
                notifyError(error.message);
            }
        });
        
        const modalElement = new bootstrap.Modal(document.getElementById('editUserModal'));
        modalElement.show();
    } catch (error) {
        notifyError(error.message);
    }
}
async function deleteUser(id) { 
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`${API_BASE}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok || response.status === 204) {
                notifySuccess('Kullanıcı başarıyla silindi!');
                loadUsers();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
        }
    }
}
async function editCustomer(id) {
    try {
        const response = await fetch(`${API_BASE}/customers/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Müşteri verileri yüklenemedi');
        
        const customer = await response.json();
        
        const modal = createModal('editCustomerModal', 'Müşteri Düzenle', `
            <form id="editCustomerForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-group with-icon">
                        <label class="form-label">Müşteri Adı *</label>
                        <div class="input-icon">
                            <i class="fas fa-id-card"></i>
                            <input type="text" class="form-control" id="editCustomerName" value="${customer.name || ''}" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">E-posta</label>
                        <div class="input-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" class="form-control" id="editCustomerEmail" value="${customer.email || ''}">
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Telefon</label>
                        <div class="input-icon">
                            <i class="fas fa-phone"></i>
                            <input type="text" class="form-control" id="editCustomerPhone" value="${customer.phone || ''}">
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Adres</label>
                        <div class="input-icon">
                            <i class="fas fa-map-marker-alt"></i>
                            <textarea class="form-control" id="editCustomerAddress" rows="2">${customer.address || ''}</textarea>
                        </div>
                    </div>
                </div>
            </form>
        `, async () => {
            const customerData = {
                name: document.getElementById('editCustomerName').value,
                email: document.getElementById('editCustomerEmail').value || null,
                phone: document.getElementById('editCustomerPhone').value || null,
                address: document.getElementById('editCustomerAddress').value || null
            };
            
            try {
                const response = await fetch(`${API_BASE}/customers/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(customerData)
                });
                
                if (response.ok) {
                    notifySuccess('Müşteri başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editCustomerModal')).hide();
                    loadCustomers();
                } else {
                    const error = await response.json();
                    notifyError(error.detail || 'Bilinmeyen hata');
                }
            } catch (error) {
                notifyError(error.message);
            }
        });
        
        const modalElement = new bootstrap.Modal(document.getElementById('editCustomerModal'));
        modalElement.show();
    } catch (error) {
        notifyError(error.message);
    }
}
function deleteCustomer(id) { 
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
        fetch(`${API_BASE}/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(() => loadCustomers());
    }
}
async function editProduct(id) {
    try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Ürün verileri yüklenemedi');
        
        const product = await response.json();
        
        const modal = createModal('editProductModal', 'Ürün Düzenle', `
            <form id="editProductForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-group with-icon">
                        <label class="form-label">Ürün Adı *</label>
                        <div class="input-icon">
                            <i class="fas fa-box"></i>
                            <input type="text" class="form-control" id="editProductName" value="${product.name || ''}" required>
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Ürün Kodu</label>
                        <div class="input-icon">
                            <i class="fas fa-barcode"></i>
                            <input type="text" class="form-control" id="editProductCode" value="${product.code || ''}">
                        </div>
                    </div>
                    <div class="form-group with-icon">
                        <label class="form-label">Kategori</label>
                        <div class="input-icon">
                            <i class="fas fa-tags"></i>
                            <input type="text" class="form-control" id="editProductCategory" value="${product.category || ''}">
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Açıklama</label>
                        <div class="input-icon">
                            <i class="fas fa-align-left"></i>
                            <textarea class="form-control" id="editProductDescription" rows="3">${product.description || ''}</textarea>
                        </div>
                    </div>
                </div>
            </form>
        `, async () => {
            const productData = {
                name: document.getElementById('editProductName').value,
                code: document.getElementById('editProductCode').value || null,
                category: document.getElementById('editProductCategory').value || null,
                description: document.getElementById('editProductDescription').value || null
            };
            
            try {
                const response = await fetch(`${API_BASE}/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(productData)
                });
                
                if (response.ok) {
                    notifySuccess('Ürün başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                    loadProducts();
                } else {
                    const error = await response.json();
                    notifyError(error.detail || 'Bilinmeyen hata');
                }
            } catch (error) {
                notifyError(error.message);
            }
        });
        
        const modalElement = new bootstrap.Modal(document.getElementById('editProductModal'));
        modalElement.show();
    } catch (error) {
        notifyError(error.message);
    }
}
function deleteProduct(id) { 
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(() => loadProducts());
    }
}
async function editDepartment(id) {
    try {
        const response = await fetch(`${API_BASE}/users/departments`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Departman verileri yüklenemedi');
        
        const departments = await response.json();
        const dept = departments.find(d => d.id === id);
        if (!dept) throw new Error('Departman bulunamadı');
        
        const modal = createModal('editDepartmentModal', 'Departman Düzenle', `
            <form id="editDepartmentForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-group with-icon">
                        <label class="form-label">Departman Adı *</label>
                        <div class="input-icon">
                            <i class="fas fa-sitemap"></i>
                            <input type="text" class="form-control" id="editDepartmentName" value="${dept.name || ''}" required>
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Açıklama</label>
                        <div class="input-icon">
                            <i class="fas fa-align-left"></i>
                            <textarea class="form-control" id="editDepartmentDescription" rows="3">${dept.description || ''}</textarea>
                        </div>
                    </div>
                </div>
            </form>
        `, async () => {
            const deptData = {
                name: document.getElementById('editDepartmentName').value,
                description: document.getElementById('editDepartmentDescription').value || null
            };
            
            try {
                const response = await fetch(`${API_BASE}/users/departments/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(deptData)
                });
                
                if (response.ok) {
                    notifySuccess('Departman başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editDepartmentModal')).hide();
                    loadDepartments();
                } else {
                    const error = await response.json();
                    notifyError(error.detail || 'Bilinmeyen hata');
                }
            } catch (error) {
                notifyError(error.message);
            }
        });
        
        const modalElement = new bootstrap.Modal(document.getElementById('editDepartmentModal'));
        modalElement.show();
    } catch (error) {
        notifyError(error.message);
    }
}

async function deleteDepartment(id) {
    if (confirm('Bu departmanı silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`${API_BASE}/users/departments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                notifySuccess('Departman başarıyla silindi!');
                loadDepartments();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
        }
    }
}

async function editRole(id) {
    try {
        const response = await fetch(`${API_BASE}/users/roles`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Rol verileri yüklenemedi');
        
        const roles = await response.json();
        const role = roles.find(r => r.id === id);
        if (!role) throw new Error('Rol bulunamadı');
        
        const modal = createModal('editRoleModal', 'Rol Düzenle', `
            <form id="editRoleForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-group with-icon">
                        <label class="form-label">Rol Adı *</label>
                        <div class="input-icon">
                            <i class="fas fa-user-shield"></i>
                            <input type="text" class="form-control" id="editRoleName" value="${role.name || ''}" required>
                        </div>
                    </div>
                    <div class="form-group with-icon" style="grid-column: 1 / -1;">
                        <label class="form-label">Açıklama</label>
                        <div class="input-icon">
                            <i class="fas fa-align-left"></i>
                            <textarea class="form-control" id="editRoleDescription" rows="3">${role.description || ''}</textarea>
                        </div>
                    </div>
                </div>
            </form>
        `, async () => {
            const roleData = {
                name: document.getElementById('editRoleName').value,
                description: document.getElementById('editRoleDescription').value || null
            };
            
            try {
                const response = await fetch(`${API_BASE}/users/roles/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(roleData)
                });
                
                if (response.ok) {
                    notifySuccess('Rol başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editRoleModal')).hide();
                    loadRoles();
                } else {
                    const error = await response.json();
                    notifyError(error.detail || 'Bilinmeyen hata');
                }
            } catch (error) {
                notifyError(error.message);
            }
        });
        
        const modalElement = new bootstrap.Modal(document.getElementById('editRoleModal'));
        modalElement.show();
    } catch (error) {
        notifyError(error.message);
    }
}

async function deleteRole(id) {
    if (confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`${API_BASE}/users/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                notifySuccess('Rol başarıyla silindi!');
                loadRoles();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Bilinmeyen hata');
            }
        } catch (error) {
            notifyError(error.message);
        }
    }
}
function viewCase(id) { notifyInfo('Case detayı yakında eklenecek'); }

// ========== CASES ==========
let customers = [];
let products = [];
let supportStaff = [];
let allUsers = [];
let supportTypes = [];
let supportStatuses = [];
let priorityTypes = [];
let selectedStaffIds = new Set(); // For tag-based staff selection

async function loadCaseData() {
    try {
        [customers, products, supportStaff, allUsers, supportTypes, supportStatuses, priorityTypes] = await Promise.all([
            fetch(`${API_BASE}/customers`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/users/support-staff`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/support-types`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/support-statuses`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/priority-types`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : [])
        ]);
    } catch (error) {
        console.error('Error loading case data:', error);
    }
}

async function showAddCaseModal() {
    await loadCaseData();
    
    // Get current user info
    const currentUserInfo = await fetch(`${API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(r => r.ok ? r.json() : null).catch(() => null);
    
    // Set default request date (now)
    const now = new Date();
    const requestDateStr = now.toISOString().slice(0, 16);
    
    const modalHTML = `
        <div class="modal fade" id="addCaseModal" tabindex="-1">
            <div class="modal-dialog modal-fullscreen-lg-down" style="max-width: 95vw;">
                <div class="modal-content" style="max-height: 95vh;">
                    <div class="modal-header">
                        <h5 class="modal-title">Yeni Destek Talebi Ekle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto; max-height: calc(95vh - 120px);">
                        <form id="addCaseForm">
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label">Başlık <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control form-control-sm" id="caseTitle" required placeholder="Destek talebi başlığı">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Talep Tarihi <span class="text-danger">*</span></label>
                                    <input type="datetime-local" class="form-control form-control-sm" id="caseRequestDate" value="${requestDateStr}" required>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Müşteri <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="caseCustomer" required>
                                        <option value="">Müşteri Seçin</option>
                                        ${customers.filter(c => c.is_active !== 0).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Ürün</label>
                                    <select class="form-select form-select-sm" id="caseProduct">
                                        <option value="">Ürün Seçin</option>
                                        ${products.filter(p => p.is_active !== 0).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Atanan Kullanıcı</label>
                                    <select class="form-select form-select-sm" id="caseAssignedTo">
                                        <option value="">Kullanıcı Seçin</option>
                                        ${allUsers.filter(u => u.is_active === 1).map(u => `<option value="${u.id}" ${currentUserInfo && u.id === currentUserInfo.id ? 'selected' : ''} data-dept="${u.department?.name || ''}">${u.full_name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Departman</label>
                                    <input type="text" class="form-control form-control-sm" id="caseDepartment" readonly>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Ticket Türü <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="caseSupportType" required>
                                        <option value="">Ticket Türü Seçin</option>
                                        ${supportTypes.filter(st => st.is_active === 1).map(st => `<option value="${st.id}">${st.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Ticket Durumu <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="caseStatus" required>
                                        <option value="">Durum Seçin</option>
                                        ${supportStatuses.filter(ss => ss.is_active === 1).map(ss => `<option value="${ss.id}">${ss.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Öncelik <span class="text-danger">*</span></label>
                                    <select class="form-select form-select-sm" id="casePriority" required>
                                        <option value="">Öncelik Seçin</option>
                                        ${priorityTypes.filter(pt => pt.is_active === 1).map(pt => `<option value="${pt.id}">${pt.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Harcanan Zaman (dakika)</label>
                                    <input type="number" class="form-control form-control-sm" id="caseTimeSpent" readonly>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Başlangıç Tarihi</label>
                                    <input type="datetime-local" class="form-control form-control-sm" id="caseStartDate">
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Bitiş Tarihi</label>
                                    <input type="datetime-local" class="form-control form-control-sm" id="caseEndDate">
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Dosya Ekle</label>
                                    <input type="file" class="form-control form-control-sm" id="caseFiles" multiple>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <label class="form-label small">Talep <span class="text-danger">*</span></label>
                                    <textarea class="form-control form-control-sm" id="caseDescription" rows="4" required placeholder="Talep detaylarını buraya yazın. Resim yapıştırabilirsiniz (Ctrl+V)"></textarea>
                                    <small class="form-text text-muted" style="font-size: 0.75rem;">Resim yapıştırmak için Ctrl+V kullanabilirsiniz</small>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label class="form-label small">Çözüm</label>
                                    <textarea class="form-control form-control-sm" id="caseSolution" rows="4" placeholder="Çözüm detaylarını buraya yazın. Resim ve dosya ekleyebilirsiniz"></textarea>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 mb-2">
                                    <label class="form-label small">Destek Personeli Ekle</label>
                                    <div class="support-staff-tag-container" id="caseSupportStaffContainer">
                                        <div class="selected-staff-tags" id="selectedStaffTags" style="min-height: 35px; padding: 6px; border: 1px solid #dee2e6; border-radius: 0.375rem; background-color: #f8f9fa; display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
                                            <!-- Selected users will appear here as tags -->
                                        </div>
                                        <div class="staff-search-wrapper" style="position: relative;">
                                            <input type="text" class="form-control form-control-sm" id="staffSearchInput" placeholder="Kullanıcı ara ve seç..." autocomplete="off" style="width: 100%;">
                                            <div class="staff-dropdown" id="staffDropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 1000; margin-top: 2px;">
                                                <!-- Search results will appear here -->
                                            </div>
                                        </div>
                                        <input type="hidden" id="caseSupportStaff" name="caseSupportStaff">
                                    </div>
                                    <small class="form-text text-muted" style="font-size: 0.75rem;">Kullanıcı adı yazarak arayın ve seçin</small>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="saveCase()">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('addCaseModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize modal
    const modalElement = new bootstrap.Modal(document.getElementById('addCaseModal'));
    
    // Set up event listeners
    const assignedToSelect = document.getElementById('caseAssignedTo');
    if (assignedToSelect) {
        assignedToSelect.addEventListener('change', function() {
            const userId = this.value;
            const selectedOption = this.options[this.selectedIndex];
            const deptInput = document.getElementById('caseDepartment');
            
            if (userId && selectedOption) {
                // Get department from data attribute or find user in allUsers
                let deptName = selectedOption.getAttribute('data-dept');
                if (!deptName) {
                    const user = allUsers.find(u => u.id === parseInt(userId));
                    deptName = user?.department?.name || '';
                }
                if (deptInput) {
                    deptInput.value = deptName;
                }
            } else if (deptInput) {
                deptInput.value = '';
            }
        });
        
        // Trigger change if default user is selected
        if (currentUserInfo) {
            assignedToSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Calculate time spent when start/end dates change
    const startDateInput = document.getElementById('caseStartDate');
    const endDateInput = document.getElementById('caseEndDate');
    const timeSpentInput = document.getElementById('caseTimeSpent');
    
    function calculateTimeSpent() {
        if (startDateInput && endDateInput && timeSpentInput && startDateInput.value && endDateInput.value) {
            const start = new Date(startDateInput.value);
            const end = new Date(endDateInput.value);
            const diffMinutes = Math.round((end - start) / (1000 * 60));
            timeSpentInput.value = diffMinutes > 0 ? diffMinutes : 0;
        } else if (timeSpentInput) {
            timeSpentInput.value = '';
        }
    }
    
    if (startDateInput) startDateInput.addEventListener('change', calculateTimeSpent);
    if (endDateInput) endDateInput.addEventListener('change', calculateTimeSpent);
    
    // Handle image paste in textareas
    const descriptionTextarea = document.getElementById('caseDescription');
    const solutionTextarea = document.getElementById('caseSolution');
    
    [descriptionTextarea, solutionTextarea].forEach(textarea => {
        if (textarea) {
            textarea.addEventListener('paste', async function(e) {
                const items = e.clipboardData.items;
                for (let item of items) {
                    if (item.type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const blob = item.getBlob();
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            const img = document.createElement('img');
                            img.src = event.target.result;
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                            const cursorPos = textarea.selectionStart;
                            const textBefore = textarea.value.substring(0, cursorPos);
                            const textAfter = textarea.value.substring(cursorPos);
                            textarea.value = textBefore + '\n[Resim]\n' + textAfter;
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            });
        }
    });
    
    // Handle support staff tag-based selection
    selectedStaffIds.clear(); // Reset when modal opens
    const staffSearchInput = document.getElementById('staffSearchInput');
    const staffDropdown = document.getElementById('staffDropdown');
    const selectedStaffTags = document.getElementById('selectedStaffTags');
    
    function renderSelectedTags() {
        if (selectedStaffIds.size === 0) {
            selectedStaffTags.innerHTML = '<span class="text-muted" style="font-size: 0.875rem;">Henüz kullanıcı seçilmedi</span>';
            return;
        }
        
        selectedStaffTags.innerHTML = Array.from(selectedStaffIds).map(userId => {
            const user = allUsers.find(u => u.id === parseInt(userId));
            if (!user) return '';
            return `
                <span class="staff-tag">
                    <span class="tag-name">${user.full_name}</span>
                    <span class="tag-remove" onclick="removeStaffTag(${user.id})" title="Kaldır">×</span>
                </span>
            `;
        }).join('');
    }
    
    function filterStaff(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            staffDropdown.style.display = 'none';
            return;
        }
        
        const filtered = allUsers.filter(u => 
            u.is_active === 1 && 
            !selectedStaffIds.has(u.id) &&
            (u.full_name.toLowerCase().includes(term) || 
             (u.department && u.department.name.toLowerCase().includes(term)) ||
             (u.email && u.email.toLowerCase().includes(term)))
        );
        
        if (filtered.length === 0) {
            staffDropdown.innerHTML = '<div class="staff-dropdown-empty">Kullanıcı bulunamadı</div>';
        } else {
            staffDropdown.innerHTML = filtered.map(user => `
                <div class="staff-dropdown-item" onclick="selectStaff(${user.id})">
                    <div class="staff-name">${user.full_name}</div>
                    <div class="staff-info">
                        ${user.department ? user.department.name : ''}
                        ${user.roles && user.roles.length > 0 ? ` • ${user.roles.map(r => r.name).join(', ')}` : ''}
                    </div>
                </div>
            `).join('');
        }
        
        staffDropdown.style.display = 'block';
    }
    
    // Make functions available globally for onclick handlers
    window.selectStaff = function(userId) {
        selectedStaffIds.add(userId);
        renderSelectedTags();
        const input = document.getElementById('staffSearchInput');
        const dropdown = document.getElementById('staffDropdown');
        if (input) {
            input.value = '';
            if (dropdown) dropdown.style.display = 'none';
            input.focus();
        }
    };
    
    window.removeStaffTag = function(userId) {
        selectedStaffIds.delete(userId);
        renderSelectedTags();
    };
    
    if (staffSearchInput) {
        staffSearchInput.addEventListener('input', function(e) {
            filterStaff(e.target.value);
        });
        
        staffSearchInput.addEventListener('focus', function() {
            if (this.value.trim()) {
                filterStaff(this.value);
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!staffSearchInput.contains(e.target) && !staffDropdown.contains(e.target)) {
                staffDropdown.style.display = 'none';
            }
        });
    }
    
    // Initialize
    renderSelectedTags();
    
    modalElement.show();
}

async function saveCase() {
    const form = document.getElementById('addCaseForm');
    if (!form || !form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const caseData = {
            title: document.getElementById('caseTitle').value || 'Destek Talebi',
            description: document.getElementById('caseDescription').value,
            request_date: document.getElementById('caseRequestDate').value,
            customer_id: parseInt(document.getElementById('caseCustomer').value),
            product_id: document.getElementById('caseProduct').value ? parseInt(document.getElementById('caseProduct').value) : null,
            assigned_to: document.getElementById('caseAssignedTo').value ? parseInt(document.getElementById('caseAssignedTo').value) : null,
            department_id: null, // Will be set from assigned user
            priority_type_id: parseInt(document.getElementById('casePriority').value),
            support_type_id: parseInt(document.getElementById('caseSupportType').value),
            status_id: parseInt(document.getElementById('caseStatus').value),
            solution: document.getElementById('caseSolution').value || null,
            start_date: document.getElementById('caseStartDate').value || null,
            end_date: document.getElementById('caseEndDate').value || null,
            time_spent_minutes: document.getElementById('caseTimeSpent').value ? parseInt(document.getElementById('caseTimeSpent').value) : null,
            assigned_user_ids: Array.from(selectedStaffIds).map(id => parseInt(id))
        };
        
        // Get department from assigned user
        if (caseData.assigned_to) {
            const user = allUsers.find(u => u.id === caseData.assigned_to);
            if (user && user.department) {
                caseData.department_id = user.department.id;
            }
        }
        
        const response = await fetch(`${API_BASE}/cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(caseData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Upload files if any
            const filesInput = document.getElementById('caseFiles');
            if (filesInput && filesInput.files.length > 0) {
                for (let file of filesInput.files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    await fetch(`${API_BASE}/cases/${result.id}/files`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${authToken}` },
                        body: formData
                    });
                }
            }
            
            notifySuccess('Destek talebi başarıyla oluşturuldu!');
            bootstrap.Modal.getInstance(document.getElementById('addCaseModal')).hide();
            loadAllCases();
        } else {
            const error = await response.json();
            notifyError(error.detail || 'Bilinmeyen hata');
        }
    } catch (error) {
        notifyError(error.message);
    }
}

