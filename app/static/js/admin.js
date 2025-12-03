// Admin Panel JavaScript

const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let departments = [];
let roles = [];

// Initialize
document.addEventListener('DOMContentLoaded', function () {
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
        loadProductCategories(),
        loadProductBrands(),
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
                <td><strong>${customer.company_name || 'N/A'}</strong></td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.tax_number || 'N/A'}</td>
                <td>${customer.tax_office || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewCustomerDetail(${customer.id})" title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i> Detaylar
                    </button>
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

async function showAddCustomerModal() {
    // Load products first
    await loadProducts();
    const productsResponse = await fetch(`${API_BASE}/products`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const allProducts = productsResponse.ok ? await productsResponse.json() : [];

    let contactCounter = 0;
    const contacts = [];

    function addContactRow() {
        const contactId = `contact_${contactCounter++}`;
        contacts.push(contactId);
        const contactHTML = `
            <div class="contact-item mb-3 p-3 border rounded" id="contactItem_${contactId}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Yetkili Kişi ${contacts.length}</h6>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeContact('${contactId}')">
                        <i class="fas fa-times"></i> Kaldır
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="form-label small">İsim Soyisim *</label>
                        <input type="text" class="form-control form-control-sm" id="contactName_${contactId}" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label small">Ünvan</label>
                        <input type="text" class="form-control form-control-sm" id="contactTitle_${contactId}">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="form-label small">Telefon</label>
                        <input type="tel" class="form-control form-control-sm" id="contactPhone_${contactId}">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label small">Email</label>
                        <input type="email" class="form-control form-control-sm" id="contactEmail_${contactId}">
                    </div>
                </div>
            </div>
        `;
        document.getElementById('contactsContainer').insertAdjacentHTML('beforeend', contactHTML);
    }

    window.removeContact = function (contactId) {
        const item = document.getElementById(`contactItem_${contactId}`);
        if (item) {
            item.remove();
            const index = contacts.indexOf(contactId);
            if (index > -1) contacts.splice(index, 1);
        }
    };

    const modalHTML = `
        <div class="modal fade" id="addCustomerModal" tabindex="-1">
            <div class="modal-dialog modal-fullscreen-lg-down" style="max-width: 95vw;">
                <div class="modal-content" style="max-height: 95vh;">
                    <div class="modal-header">
                        <h5 class="modal-title">Müşteri Ekle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto; max-height: calc(95vh - 120px);">
                        <form id="addCustomerForm">
                            <div class="row mb-3">
                                <div class="col-md-6 mb-2">
                                    <label class="form-label small">Firma İsmi <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control form-control-sm" id="customerCompanyName" required>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label class="form-label small">Email</label>
                                    <input type="email" class="form-control form-control-sm" id="customerEmail">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12 mb-2">
                                    <label class="form-label small">Adres</label>
                                    <textarea class="form-control form-control-sm" id="customerAddress" rows="2"></textarea>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6 mb-2">
                                    <label class="form-label small">Vergi Dairesi</label>
                                    <input type="text" class="form-control form-control-sm" id="customerTaxOffice">
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label class="form-label small">Vergi No</label>
                                    <input type="text" class="form-control form-control-sm" id="customerTaxNumber">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label class="form-label small mb-0">Yetkili Kişiler</label>
                                        <button type="button" class="btn btn-sm btn-primary" onclick="addContactRow()">
                                            <i class="fas fa-plus"></i> Kişi Ekle
                                        </button>
                                    </div>
                                    <div id="contactsContainer"></div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label small">Firma Ürünleri</label>
                                    <div class="product-selection-container">
                                        <div class="selected-product-tags" id="selectedProductTags"></div>
                                        <div class="product-search-wrapper">
                                            <input type="text" class="form-control form-control-sm" id="productSearchInput" placeholder="Ürün ara ve seç..." autocomplete="off">
                                            <div class="product-dropdown" id="productDropdown" style="display: none;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label small">Notlar</label>
                                    <textarea class="form-control form-control-sm" id="customerNotes" rows="3" placeholder="Firma ile ilgili bilgiler..."></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="saveCustomer()">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('addCustomerModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize modal
    const modalElement = new bootstrap.Modal(document.getElementById('addCustomerModal'));

    // Make addContactRow available globally
    window.addContactRow = addContactRow;

    // Initialize with one contact
    addContactRow();

    // Initialize product selection
    let selectedProductIds = [];
    const activeProducts = allProducts.filter(p => p.is_active !== 0);

    function renderSelectedProductTags() {
        const container = document.getElementById('selectedProductTags');
        if (!container) return;

        if (selectedProductIds.length === 0) {
            container.innerHTML = '<div class="text-muted small">Henüz ürün seçilmedi</div>';
            return;
        }

        container.innerHTML = selectedProductIds.map(productId => {
            const product = activeProducts.find(p => p.id === productId);
            if (!product) return '';
            return `
                <span class="product-tag">
                    <span class="tag-name">${product.name}</span>
                    <span class="tag-remove" onclick="removeProductTag(${productId})">×</span>
                </span>
            `;
        }).join('');
    }

    function filterProducts(searchTerm) {
        const term = searchTerm.toLowerCase();
        return activeProducts.filter(p =>
            !selectedProductIds.includes(p.id) &&
            p.name.toLowerCase().includes(term)
        );
    }

    function showProductDropdown() {
        const dropdown = document.getElementById('productDropdown');
        const input = document.getElementById('productSearchInput');
        if (!dropdown || !input) return;

        const searchTerm = input.value.trim();
        const filtered = filterProducts(searchTerm);

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-item text-muted">Ürün bulunamadı</div>';
        } else {
            dropdown.innerHTML = filtered.slice(0, 10).map(product => `
                <div class="dropdown-item product-option" onclick="selectProduct(${product.id})">
                    ${product.name}
                </div>
            `).join('');
        }

        dropdown.style.display = 'block';
    }

    function hideProductDropdown() {
        const dropdown = document.getElementById('productDropdown');
        if (dropdown) {
            setTimeout(() => dropdown.style.display = 'none', 200);
        }
    }

    window.selectProduct = function (productId) {
        if (!selectedProductIds.includes(productId)) {
            selectedProductIds.push(productId);
            renderSelectedProductTags();
            const input = document.getElementById('productSearchInput');
            if (input) input.value = '';
            hideProductDropdown();
        }
    };

    window.removeProductTag = function (productId) {
        selectedProductIds = selectedProductIds.filter(id => id !== productId);
        renderSelectedProductTags();
    };

    // Setup product search input
    setTimeout(() => {
        const productInput = document.getElementById('productSearchInput');
        const productDropdown = document.getElementById('productDropdown');

        if (productInput) {
            productInput.addEventListener('input', showProductDropdown);
            productInput.addEventListener('focus', showProductDropdown);
            productInput.addEventListener('blur', hideProductDropdown);
        }

        if (productDropdown) {
            productDropdown.addEventListener('mousedown', (e) => e.preventDefault());
        }

        renderSelectedProductTags();
    }, 100);

    // Save function
    window.saveCustomer = async function () {
        const form = document.getElementById('addCustomerForm');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            // Collect contacts
            const contactList = [];
            contacts.forEach(contactId => {
                const name = document.getElementById(`contactName_${contactId}`)?.value;
                if (name) {
                    contactList.push({
                        full_name: name,
                        phone: document.getElementById(`contactPhone_${contactId}`)?.value || null,
                        email: document.getElementById(`contactEmail_${contactId}`)?.value || null,
                        title: document.getElementById(`contactTitle_${contactId}`)?.value || null
                    });
                }
            });

            // Collect selected products from tags
            const selectedProducts = selectedProductIds.length > 0 ? selectedProductIds : null;

            const customerData = {
                company_name: document.getElementById('customerCompanyName').value,
                address: document.getElementById('customerAddress').value || null,
                email: document.getElementById('customerEmail').value || null,
                tax_office: document.getElementById('customerTaxOffice').value || null,
                tax_number: document.getElementById('customerTaxNumber').value || null,
                notes: document.getElementById('customerNotes').value || null,
                product_ids: selectedProducts.length > 0 ? selectedProducts : null,
                contacts: contactList.length > 0 ? contactList : null
            };

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
    };

    modalElement.show();
}

// ========== SERVICES ==========
async function loadServices() {
    const tbody = document.getElementById('servicesTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Hizmetler bölümü yakında eklenecek...</td></tr>';
    }
}

function showAddServiceModal() {
    notifyInfo('Hizmetler bölümü yakında eklenecek...');
}

// ========== SERVICE CATEGORIES ==========
async function loadServiceCategories() {
    const tbody = document.getElementById('serviceCategoriesTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Hizmet Kategorileri bölümü yakında eklenecek...</td></tr>';
    }
}

function showAddServiceCategoryModal() {
    notifyInfo('Hizmet Kategorileri bölümü yakında eklenecek...');
}

// ========== PRODUCT CATEGORIES ==========
async function loadProductCategories() {
    console.log('loadProductCategories called');
    try {
        console.log('Fetching product categories from:', `${API_BASE}/product-categories`);
        const response = await fetch(`${API_BASE}/product-categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('Response status:', response.status);

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

        const categories = await response.json();

        const tbody = document.getElementById('productCategoriesTable');
        if (!categories || !Array.isArray(categories)) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Kategori bulunamadı</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td><strong>${cat.name}</strong></td>
                <td>${cat.description || 'N/A'}</td>
                <td><span class="badge badge-${cat.is_active === 1 ? 'success' : 'danger'}">${cat.is_active === 1 ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProductCategory(${cat.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProductCategory(${cat.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading product categories:', error);
        const tbody = document.getElementById('productCategoriesTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
        }
    }
}

function showAddProductCategoryModal() {
    console.log('showAddProductCategoryModal called');
    const modal = createModal('addProductCategoryModal', 'Yeni Kategori Ekle', `
        <form id="addProductCategoryForm">
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-tag"></i> Kategori Adı <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control" id="productCategoryName" required placeholder="Kategori adını giriniz">
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-align-left"></i> Kategori Açıklama
                </label>
                <textarea class="form-control" id="productCategoryDescription" rows="3" placeholder="Kategori açıklamasını giriniz (opsiyonel)"></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-sort-numeric-down"></i> Sıra
                </label>
                <input type="number" class="form-control" id="productCategorySortOrder" value="0" min="0" placeholder="Sıra numarası">
            </div>
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="productCategoryIsActive" checked>
                    <label class="form-check-label" for="productCategoryIsActive">
                        Aktif
                    </label>
                </div>
            </div>
        </form>
    `, async () => {
        console.log('Category save handler called');
        const categoryData = {
            name: document.getElementById('productCategoryName').value.trim(),
            description: document.getElementById('productCategoryDescription').value.trim() || null,
            sort_order: parseInt(document.getElementById('productCategorySortOrder').value) || 0,
            is_active: document.getElementById('productCategoryIsActive').checked ? 1 : 0
        };

        if (!categoryData.name) {
            notifyError('Kategori adı zorunludur!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/product-categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(categoryData)
            });

            if (response.ok) {
                notifySuccess('Kategori başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addProductCategoryModal')).hide();
                loadProductCategories();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Kategori eklenirken hata oluştu');
            }
        } catch (error) {
            notifyError('Bağlantı hatası: ' + error.message);
        }
    });

    const modalElement = new bootstrap.Modal(document.getElementById('addProductCategoryModal'));
    modalElement.show();
}

async function editProductCategory(id) {
    try {
        const response = await fetch(`${API_BASE}/product-categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            notifyError('Kategori bilgileri yüklenemedi');
            return;
        }

        const categories = await response.json();
        const category = categories.find(c => c.id === id);

        if (!category) {
            notifyError('Kategori bulunamadı');
            return;
        }

        const modal = createModal('editProductCategoryModal', 'Kategori Düzenle', `
            <form id="editProductCategoryForm">
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-tag"></i> Kategori Adı <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control" id="editProductCategoryName" value="${category.name}" required placeholder="Kategori adını giriniz">
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-align-left"></i> Kategori Açıklama
                    </label>
                    <textarea class="form-control" id="editProductCategoryDescription" rows="3" placeholder="Kategori açıklamasını giriniz (opsiyonel)">${category.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-sort-numeric-down"></i> Sıra
                    </label>
                    <input type="number" class="form-control" id="editProductCategorySortOrder" value="${category.sort_order || 0}" min="0" placeholder="Sıra numarası">
                </div>
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="editProductCategoryIsActive" ${category.is_active === 1 ? 'checked' : ''}>
                        <label class="form-check-label" for="editProductCategoryIsActive">
                            Aktif
                        </label>
                    </div>
                </div>
            </form>
        `, async () => {
            const categoryData = {
                name: document.getElementById('editProductCategoryName').value.trim(),
                description: document.getElementById('editProductCategoryDescription').value.trim() || null,
                sort_order: parseInt(document.getElementById('editProductCategorySortOrder').value) || 0,
                is_active: document.getElementById('editProductCategoryIsActive').checked ? 1 : 0
            };

            if (!categoryData.name) {
                notifyError('Kategori adı zorunludur!');
                return;
            }

            try {
                const updateResponse = await fetch(`${API_BASE}/product-categories/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(categoryData)
                });

                if (updateResponse.ok) {
                    notifySuccess('Kategori başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editProductCategoryModal')).hide();
                    loadProductCategories();
                } else {
                    const error = await updateResponse.json();
                    notifyError(error.detail || 'Kategori güncellenirken hata oluştu');
                }
            } catch (error) {
                notifyError('Bağlantı hatası: ' + error.message);
            }
        });

        const modalElement = new bootstrap.Modal(document.getElementById('editProductCategoryModal'));
        modalElement.show();
    } catch (error) {
        notifyError('Hata: ' + error.message);
    }
}

async function deleteProductCategory(id) {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/product-categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok || response.status === 204) {
            notifySuccess('Kategori başarıyla silindi!');
            loadProductCategories();
        } else {
            const error = await response.json();
            notifyError(error.detail || 'Kategori silinirken hata oluştu');
        }
    } catch (error) {
        notifyError('Bağlantı hatası: ' + error.message);
    }
}

// ========== PRODUCT BRANDS ==========
async function loadProductBrands() {
    console.log('loadProductBrands called');
    try {
        console.log('Fetching product brands from:', `${API_BASE}/product-brands`);
        const response = await fetch(`${API_BASE}/product-brands`, {
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

        const brands = await response.json();

        const tbody = document.getElementById('productBrandsTable');
        if (!brands || !Array.isArray(brands)) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }

        if (brands.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Marka bulunamadı</td></tr>';
            return;
        }

        tbody.innerHTML = brands.map(brand => `
            <tr>
                <td>${brand.id}</td>
                <td><strong>${brand.name}</strong></td>
                <td>${brand.category ? brand.category.name : 'Kategori yok'}</td>
                <td>${brand.description || 'N/A'}</td>
                <td><span class="badge badge-${brand.is_active === 1 ? 'success' : 'danger'}">${brand.is_active === 1 ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProductBrand(${brand.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProductBrand(${brand.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading product brands:', error);
        const tbody = document.getElementById('productBrandsTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Hata: ' + (error.message || 'Bilinmeyen hata') + '</td></tr>';
        }
    }
}

async function showAddProductBrandModal() {
    console.log('showAddProductBrandModal called');
    // Load categories first
    let categories = [];
    try {
        const catResponse = await fetch(`${API_BASE}/product-categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (catResponse.ok) {
            categories = await catResponse.json();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }

    const categoryOptions = categories
        .filter(cat => cat.is_active === 1)
        .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
        .join('');

    const modal = createModal('addProductBrandModal', 'Yeni Marka Ekle', `
        <form id="addProductBrandForm">
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-tag"></i> Marka Adı <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control" id="productBrandName" required placeholder="Marka adını giriniz">
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-folder"></i> Kategori
                </label>
                <select class="form-control" id="productBrandCategory">
                    <option value="">Kategori seçiniz</option>
                    ${categoryOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-align-left"></i> Marka Açıklaması
                </label>
                <textarea class="form-control" id="productBrandDescription" rows="3" placeholder="Marka açıklamasını giriniz (opsiyonel)"></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-sort-numeric-down"></i> Sıra
                </label>
                <input type="number" class="form-control" id="productBrandSortOrder" value="0" min="0" placeholder="Sıra numarası">
            </div>
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="productBrandIsActive" checked>
                    <label class="form-check-label" for="productBrandIsActive">
                        Aktif
                    </label>
                </div>
            </div>
        </form>
    `, async () => {
        console.log('Brand save handler called');
        const categorySelect = document.getElementById('productBrandCategory');
        const brandData = {
            name: document.getElementById('productBrandName').value.trim(),
            category_id: categorySelect.value ? parseInt(categorySelect.value) : null,
            description: document.getElementById('productBrandDescription').value.trim() || null,
            sort_order: parseInt(document.getElementById('productBrandSortOrder').value) || 0,
            is_active: document.getElementById('productBrandIsActive').checked ? 1 : 0
        };

        if (!brandData.name) {
            notifyError('Marka adı zorunludur!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/product-brands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(brandData)
            });

            if (response.ok) {
                notifySuccess('Marka başarıyla eklendi!');
                bootstrap.Modal.getInstance(document.getElementById('addProductBrandModal')).hide();
                loadProductBrands();
            } else {
                const error = await response.json();
                notifyError(error.detail || 'Marka eklenirken hata oluştu');
            }
        } catch (error) {
            notifyError('Bağlantı hatası: ' + error.message);
        }
    });

    const modalElement = new bootstrap.Modal(document.getElementById('addProductBrandModal'));
    modalElement.show();
}

async function editProductBrand(id) {
    try {
        // Load brands and categories
        const [brandsResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_BASE}/product-brands`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/product-categories`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        if (!brandsResponse.ok) {
            notifyError('Marka bilgileri yüklenemedi');
            return;
        }

        const brands = await brandsResponse.json();
        const brand = brands.find(b => b.id === id);

        if (!brand) {
            notifyError('Marka bulunamadı');
            return;
        }

        // Load categories for dropdown
        let categories = [];
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }

        const categoryOptions = categories
            .filter(cat => cat.is_active === 1)
            .map(cat => `<option value="${cat.id}" ${brand.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>`)
            .join('');

        const modal = createModal('editProductBrandModal', 'Marka Düzenle', `
            <form id="editProductBrandForm">
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-tag"></i> Marka Adı <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control" id="editProductBrandName" value="${brand.name}" required placeholder="Marka adını giriniz">
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-folder"></i> Kategori
                    </label>
                    <select class="form-control" id="editProductBrandCategory">
                        <option value="">Kategori seçiniz</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-align-left"></i> Marka Açıklaması
                    </label>
                    <textarea class="form-control" id="editProductBrandDescription" rows="3" placeholder="Marka açıklamasını giriniz (opsiyonel)">${brand.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-sort-numeric-down"></i> Sıra
                    </label>
                    <input type="number" class="form-control" id="editProductBrandSortOrder" value="${brand.sort_order || 0}" min="0" placeholder="Sıra numarası">
                </div>
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="editProductBrandIsActive" ${brand.is_active === 1 ? 'checked' : ''}>
                        <label class="form-check-label" for="editProductBrandIsActive">
                            Aktif
                        </label>
                    </div>
                </div>
            </form>
        `, async () => {
            const categorySelect = document.getElementById('editProductBrandCategory');
            const brandData = {
                name: document.getElementById('editProductBrandName').value.trim(),
                category_id: categorySelect.value ? parseInt(categorySelect.value) : null,
                description: document.getElementById('editProductBrandDescription').value.trim() || null,
                sort_order: parseInt(document.getElementById('editProductBrandSortOrder').value) || 0,
                is_active: document.getElementById('editProductBrandIsActive').checked ? 1 : 0
            };

            if (!brandData.name) {
                notifyError('Marka adı zorunludur!');
                return;
            }

            try {
                const updateResponse = await fetch(`${API_BASE}/product-brands/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(brandData)
                });

                if (updateResponse.ok) {
                    notifySuccess('Marka başarıyla güncellendi!');
                    bootstrap.Modal.getInstance(document.getElementById('editProductBrandModal')).hide();
                    loadProductBrands();
                } else {
                    const error = await updateResponse.json();
                    notifyError(error.detail || 'Marka güncellenirken hata oluştu');
                }
            } catch (error) {
                notifyError('Bağlantı hatası: ' + error.message);
            }
        });

        const modalElement = new bootstrap.Modal(document.getElementById('editProductBrandModal'));
        modalElement.show();
    } catch (error) {
        notifyError('Hata: ' + error.message);
    }
}

async function deleteProductBrand(id) {
    if (!confirm('Bu markayı silmek istediğinize emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/product-brands/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok || response.status === 204) {
            notifySuccess('Marka başarıyla silindi!');
            loadProductBrands();
        } else {
            const error = await response.json();
            notifyError(error.detail || 'Marka silinirken hata oluştu');
        }
    } catch (error) {
        notifyError('Bağlantı hatası: ' + error.message);
    }
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
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Hata: Geçersiz veri formatı</td></tr>';
            return;
        }

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Ürün bulunamadı</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td><span class="badge badge-info">${product.code || 'N/A'}</span></td>
                <td>${product.category ? product.category.name : 'N/A'}</td>
                <td>${product.brand ? product.brand.name : 'N/A'}</td>
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

async function showAddProductModal() {
    // Load categories and brands first
    let categories = [];
    let brands = [];
    try {
        const [catResponse, brandResponse] = await Promise.all([
            fetch(`${API_BASE}/product-categories`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/product-brands`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        if (catResponse.ok) {
            categories = await catResponse.json();
        }
        if (brandResponse.ok) {
            brands = await brandResponse.json();
        }
    } catch (error) {
        console.error('Error loading categories/brands:', error);
    }

    const categoryOptions = categories
        .filter(cat => cat.is_active === 1)
        .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
        .join('');

    const brandOptions = brands
        .filter(brand => brand.is_active === 1)
        .map(brand => `<option value="${brand.id}">${brand.name}</option>`)
        .join('');

    const modal = createModal('addProductModal', 'Yeni Ürün Ekle', `
        <form id="addProductForm">
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-tag"></i> Ürün Adı <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control" id="productName" required placeholder="Ürün adını giriniz">
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-barcode"></i> Ürün Kodu
                </label>
                <input type="text" class="form-control" id="productCode" placeholder="Ürün kodunu giriniz (opsiyonel)">
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-folder"></i> Ürün Kategorisi <span class="text-danger">*</span>
                </label>
                <select class="form-control" id="productCategory" required>
                    <option value="">Kategori seçiniz</option>
                    ${categoryOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-star"></i> Ürün Markası <span class="text-danger">*</span>
                </label>
                <select class="form-control" id="productBrand" required>
                    <option value="">Marka seçiniz</option>
                    ${brandOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">
                    <i class="fas fa-align-left"></i> Ürün Açıklaması
                </label>
                <textarea class="form-control" id="productDescription" rows="3" placeholder="Ürün açıklamasını giriniz"></textarea>
            </div>
        </form>
    `, async () => {
        const categorySelect = document.getElementById('productCategory');
        const brandSelect = document.getElementById('productBrand');

        const productData = {
            name: document.getElementById('productName').value.trim(),
            code: document.getElementById('productCode').value.trim() || null,
            category_id: categorySelect.value ? parseInt(categorySelect.value) : null,
            brand_id: brandSelect.value ? parseInt(brandSelect.value) : null,
            description: document.getElementById('productDescription').value.trim() || null
        };

        if (!productData.name) {
            notifyError('Ürün adı zorunludur!');
            return;
        }

        if (!productData.category_id) {
            notifyError('Ürün kategorisi seçilmelidir!');
            return;
        }

        if (!productData.brand_id) {
            notifyError('Ürün markası seçilmelidir!');
            return;
        }

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
                notifyError(error.detail || 'Ürün eklenirken hata oluştu');
            }
        } catch (error) {
            notifyError('Bağlantı hatası: ' + error.message);
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
    if (!modalsContainer) {
        console.error('modalsContainer not found!');
        return null;
    }

    // Remove existing modal if exists
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    // Generate unique function name
    const saveFunctionName = `save${id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, '')}`;

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
                        <button type="button" class="btn btn-primary" id="${id}-save-btn">
                            <i class="fas fa-save"></i> Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    modalsContainer.insertAdjacentHTML('beforeend', modalHTML);

    // Wait for DOM to update, then attach event listener
    setTimeout(() => {
        const modalElement = document.getElementById(id);
        if (!modalElement) {
            console.error('Modal element not found:', id);
            return;
        }

        // Prevent form submission
        const form = modalElement.querySelector('form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }

        const saveBtn = document.getElementById(`${id}-save-btn`);
        if (saveBtn && onSave) {
            // Remove any existing listeners by cloning
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

            // Attach event listener to save button
            newSaveBtn.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save button clicked for modal:', id);
                try {
                    await onSave();
                } catch (error) {
                    console.error('Error in modal save handler:', error);
                    notifyError('Kaydetme sırasında hata oluştu: ' + error.message);
                }
                return false;
            });
        } else {
            console.error('Save button not found or onSave not provided:', id, saveBtn, onSave);
        }
    }, 50);

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

// Logout function - make sure it's globally accessible
window.logout = function () {
    try {
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        window.location.replace('/');
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if there's an error
        window.location.replace('/');
    }
};

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
        // Load products first
        await loadProducts();
        const productsResponse = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const allProducts = productsResponse.ok ? await productsResponse.json() : [];

        const response = await fetch(`${API_BASE}/customers/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Müşteri verileri yüklenemedi');

        const customer = await response.json();

        let contactCounter = 0;
        const contacts = [];

        function addContactRow(contactData = null) {
            const contactId = `contact_${contactCounter++}`;
            contacts.push(contactId);
            const contactHTML = `
                <div class="contact-item mb-3 p-3 border rounded" id="contactItem_${contactId}">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">Yetkili Kişi ${contacts.length}</h6>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeEditContact('${contactId}')">
                            <i class="fas fa-times"></i> Kaldır
                        </button>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-2">
                            <label class="form-label small">İsim Soyisim *</label>
                            <input type="text" class="form-control form-control-sm" id="editContactName_${contactId}" value="${(contactData?.full_name || '').replace(/"/g, '&quot;')}" required>
                        </div>
                        <div class="col-md-6 mb-2">
                            <label class="form-label small">Ünvan</label>
                            <input type="text" class="form-control form-control-sm" id="editContactTitle_${contactId}" value="${(contactData?.title || '').replace(/"/g, '&quot;')}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-2">
                            <label class="form-label small">Telefon</label>
                            <input type="tel" class="form-control form-control-sm" id="editContactPhone_${contactId}" value="${(contactData?.phone || '').replace(/"/g, '&quot;')}">
                        </div>
                        <div class="col-md-6 mb-2">
                            <label class="form-label small">Email</label>
                            <input type="email" class="form-control form-control-sm" id="editContactEmail_${contactId}" value="${(contactData?.email || '').replace(/"/g, '&quot;')}">
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('editContactsContainer').insertAdjacentHTML('beforeend', contactHTML);
        }

        window.removeEditContact = function (contactId) {
            const item = document.getElementById(`contactItem_${contactId}`);
            if (item) {
                item.remove();
                const index = contacts.indexOf(contactId);
                if (index > -1) contacts.splice(index, 1);
            }
        };

        const modalHTML = `
            <div class="modal fade" id="editCustomerModal" tabindex="-1">
                <div class="modal-dialog modal-fullscreen-lg-down" style="max-width: 95vw;">
                    <div class="modal-content" style="max-height: 95vh;">
                        <div class="modal-header">
                            <h5 class="modal-title">Müşteri Düzenle</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="overflow-y: auto; max-height: calc(95vh - 120px);">
                            <form id="editCustomerForm">
                                <div class="row mb-3">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small">Firma İsmi <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control form-control-sm" id="editCustomerCompanyName" value="${(customer.company_name || '').replace(/"/g, '&quot;')}" required>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small">Email</label>
                                        <input type="email" class="form-control form-control-sm" id="editCustomerEmail" value="${(customer.email || '').replace(/"/g, '&quot;')}">
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-12 mb-2">
                                        <label class="form-label small">Adres</label>
                                        <textarea class="form-control form-control-sm" id="editCustomerAddress" rows="2">${(customer.address || '').replace(/"/g, '&quot;')}</textarea>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small">Vergi Dairesi</label>
                                        <input type="text" class="form-control form-control-sm" id="editCustomerTaxOffice" value="${(customer.tax_office || '').replace(/"/g, '&quot;')}">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="form-label small">Vergi No</label>
                                        <input type="text" class="form-control form-control-sm" id="editCustomerTaxNumber" value="${(customer.tax_number || '').replace(/"/g, '&quot;')}">
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <label class="form-label small mb-0">Yetkili Kişiler</label>
                                            <button type="button" class="btn btn-sm btn-primary" onclick="addEditContactRow()">
                                                <i class="fas fa-plus"></i> Kişi Ekle
                                            </button>
                                        </div>
                                        <div id="editContactsContainer"></div>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <label class="form-label small">Firma Ürünleri</label>
                                        <div class="product-selection-container">
                                            <div class="selected-product-tags" id="editSelectedProductTags"></div>
                                            <div class="product-search-wrapper">
                                                <input type="text" class="form-control form-control-sm" id="editProductSearchInput" placeholder="Ürün ara ve seç..." autocomplete="off">
                                                <div class="product-dropdown" id="editProductDropdown" style="display: none;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <label class="form-label small">Notlar</label>
                                        <textarea class="form-control form-control-sm" id="editCustomerNotes" rows="3" placeholder="Firma ile ilgili bilgiler...">${(customer.notes || '').replace(/"/g, '&quot;')}</textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">İptal</button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="updateCustomer(${id})">Kaydet</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('editCustomerModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize modal
        const modalElement = new bootstrap.Modal(document.getElementById('editCustomerModal'));

        // Make addEditContactRow available globally
        window.addEditContactRow = function () {
            addContactRow();
        };

        // Load existing contacts
        if (customer.contacts && customer.contacts.length > 0) {
            customer.contacts.forEach(contact => {
                addContactRow(contact);
            });
        } else {
            addContactRow(); // Add one empty contact row
        }

        // Initialize product selection for edit
        let editSelectedProductIds = customer.products ? customer.products.map(p => p.id) : [];
        const editActiveProducts = allProducts.filter(p => p.is_active !== 0);

        function renderEditSelectedProductTags() {
            const container = document.getElementById('editSelectedProductTags');
            if (!container) return;

            if (editSelectedProductIds.length === 0) {
                container.innerHTML = '<div class="text-muted small">Henüz ürün seçilmedi</div>';
                return;
            }

            container.innerHTML = editSelectedProductIds.map(productId => {
                const product = editActiveProducts.find(p => p.id === productId);
                if (!product) return '';
                return `
                    <span class="product-tag">
                        <span class="tag-name">${product.name}</span>
                        <span class="tag-remove" onclick="removeEditProductTag(${productId})">×</span>
                    </span>
                `;
            }).join('');
        }

        function filterEditProducts(searchTerm) {
            const term = searchTerm.toLowerCase();
            return editActiveProducts.filter(p =>
                !editSelectedProductIds.includes(p.id) &&
                p.name.toLowerCase().includes(term)
            );
        }

        function showEditProductDropdown() {
            const dropdown = document.getElementById('editProductDropdown');
            const input = document.getElementById('editProductSearchInput');
            if (!dropdown || !input) return;

            const searchTerm = input.value.trim();
            const filtered = filterEditProducts(searchTerm);

            if (filtered.length === 0) {
                dropdown.innerHTML = '<div class="dropdown-item text-muted">Ürün bulunamadı</div>';
            } else {
                dropdown.innerHTML = filtered.slice(0, 10).map(product => `
                    <div class="dropdown-item product-option" onclick="selectEditProduct(${product.id})">
                        ${product.name}
                    </div>
                `).join('');
            }

            dropdown.style.display = 'block';
        }

        function hideEditProductDropdown() {
            const dropdown = document.getElementById('editProductDropdown');
            if (dropdown) {
                setTimeout(() => dropdown.style.display = 'none', 200);
            }
        }

        window.selectEditProduct = function (productId) {
            if (!editSelectedProductIds.includes(productId)) {
                editSelectedProductIds.push(productId);
                renderEditSelectedProductTags();
                const input = document.getElementById('editProductSearchInput');
                if (input) input.value = '';
                hideEditProductDropdown();
            }
        };

        window.removeEditProductTag = function (productId) {
            editSelectedProductIds = editSelectedProductIds.filter(id => id !== productId);
            renderEditSelectedProductTags();
        };

        // Setup edit product search input
        setTimeout(() => {
            const productInput = document.getElementById('editProductSearchInput');
            const productDropdown = document.getElementById('editProductDropdown');

            if (productInput) {
                productInput.addEventListener('input', showEditProductDropdown);
                productInput.addEventListener('focus', showEditProductDropdown);
                productInput.addEventListener('blur', hideEditProductDropdown);
            }

            if (productDropdown) {
                productDropdown.addEventListener('mousedown', (e) => e.preventDefault());
            }

            renderEditSelectedProductTags();
        }, 100);

        // Update function
        window.updateCustomer = async function (customerId) {
            const form = document.getElementById('editCustomerForm');
            if (!form || !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            try {
                // Collect contacts
                const contactList = [];
                contacts.forEach(contactId => {
                    const name = document.getElementById(`editContactName_${contactId}`)?.value;
                    if (name) {
                        contactList.push({
                            full_name: name,
                            phone: document.getElementById(`editContactPhone_${contactId}`)?.value || null,
                            email: document.getElementById(`editContactEmail_${contactId}`)?.value || null,
                            title: document.getElementById(`editContactTitle_${contactId}`)?.value || null
                        });
                    }
                });

                // Collect selected products from tags
                const selectedProducts = editSelectedProductIds.length > 0 ? editSelectedProductIds : null;

                const customerData = {
                    company_name: document.getElementById('editCustomerCompanyName').value,
                    address: document.getElementById('editCustomerAddress').value || null,
                    email: document.getElementById('editCustomerEmail').value || null,
                    tax_office: document.getElementById('editCustomerTaxOffice').value || null,
                    tax_number: document.getElementById('editCustomerTaxNumber').value || null,
                    notes: document.getElementById('editCustomerNotes').value || null,
                    product_ids: selectedProducts.length > 0 ? selectedProducts : null,
                    contacts: contactList.length > 0 ? contactList : null
                };

                const response = await fetch(`${API_BASE}/customers/${customerId}`, {
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
        };

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

// View customer detail with tabs
window.viewCustomerDetail = async function (id) {
    try {
        const response = await fetch(`${API_BASE}/customers/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            notifyError('Müşteri bilgileri yüklenemedi');
            return;
        }

        const customer = await response.json();

        // Debug: Log customer data
        console.log('Customer data from API:', customer);
        console.log('Customer products:', customer.products);

        // Load related data
        const [casesResponse, productsResponse] = await Promise.all([
            fetch(`${API_BASE}/cases?customer_id=${id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }).catch(() => ({ ok: false })),
            fetch(`${API_BASE}/products`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }).catch(() => ({ ok: false }))
        ]);

        const cases = casesResponse.ok ? await casesResponse.json() : [];
        const allProducts = productsResponse.ok ? await productsResponse.json() : [];

        const customerProducts = customer.products || [];
        console.log('customerProducts array:', customerProducts);
        console.log('customerProducts length:', customerProducts.length);

        // Map customer products with full product details
        // API already returns full product details, so we can use them directly
        const customerProductsWithDetails = customerProducts.map(cp => {
            // cp is already a product object from API with id, name, code, category, brand
            console.log('Processing product:', cp);
            return {
                id: cp.id,
                name: cp.name,
                code: cp.code || null,
                category: cp.category || null,
                brand: cp.brand || null
            };
        }).filter(p => p !== null);

        console.log('customerProductsWithDetails:', customerProductsWithDetails);
        console.log('customerProductsWithDetails length:', customerProductsWithDetails.length);

        // Products will be rendered after modal is shown

        const modalHTML = `
            <div class="modal fade" id="customerDetailModal" tabindex="-1">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-building"></i> ${customer.company_name || 'Müşteri Detayları'}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0">
                            <!-- Tabs Navigation -->
                            <ul class="nav nav-tabs border-bottom" id="customerDetailTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#customer-detail-info" type="button" role="tab">
                                        <i class="fas fa-info-circle"></i> Detaylar
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="notes-tab" data-bs-toggle="tab" data-bs-target="#customer-detail-notes" type="button" role="tab">
                                        <i class="fas fa-sticky-note"></i> Notlar
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="products-tab" data-bs-toggle="tab" data-bs-target="#customer-detail-products" type="button" role="tab">
                                        <i class="fas fa-box"></i> Ürünler
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="files-tab" data-bs-toggle="tab" data-bs-target="#customer-detail-files" type="button" role="tab">
                                        <i class="fas fa-file"></i> Dosyalar
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#customer-detail-history" type="button" role="tab">
                                        <i class="fas fa-history"></i> Geçmiş
                                    </button>
                                </li>
                            </ul>
                            
                            <!-- Tab Content -->
                            <div class="tab-content p-4" id="customerDetailTabContent">
                                <!-- Detaylar Tab -->
                                <div class="tab-pane fade show active" id="customer-detail-info" role="tabpanel">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-body">
                                                    <h6 class="card-title text-muted mb-3">Temel Bilgiler</h6>
                                                    <div class="mb-3">
                                                        <label class="text-muted small">Firma İsmi</label>
                                                        <p class="mb-0 fw-bold">${customer.company_name || 'Belirtilmemiş'}</p>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="text-muted small">E-posta</label>
                                                        <p class="mb-0">${customer.email || 'Belirtilmemiş'}</p>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="text-muted small">Adres</label>
                                                        <p class="mb-0">${customer.address || 'Belirtilmemiş'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-body">
                                                    <h6 class="card-title text-muted mb-3">Vergi Bilgileri</h6>
                                                    <div class="mb-3">
                                                        <label class="text-muted small">Vergi Dairesi</label>
                                                        <p class="mb-0">${customer.tax_office || 'Belirtilmemiş'}</p>
                                                    </div>
                                                    <div class="mb-3">
                                                        <label class="text-muted small">Vergi No</label>
                                                        <p class="mb-0">${customer.tax_number || 'Belirtilmemiş'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="card">
                                                <div class="card-body">
                                                    <h6 class="card-title text-muted mb-3">Yetkili Kişiler</h6>
                                                    ${customer.contacts && customer.contacts.length > 0 ? `
                                                        <div class="table-responsive">
                                                            <table class="table table-sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th>İsim Soyisim</th>
                                                                        <th>Ünvan</th>
                                                                        <th>Telefon</th>
                                                                        <th>E-posta</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${customer.contacts.map(contact => `
                                                                        <tr>
                                                                            <td>${contact.full_name || 'N/A'}</td>
                                                                            <td>${contact.title || 'N/A'}</td>
                                                                            <td>${contact.phone || 'N/A'}</td>
                                                                            <td>${contact.email || 'N/A'}</td>
                                                                        </tr>
                                                                    `).join('')}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ` : '<p class="text-muted mb-0">Yetkili kişi bulunmuyor</p>'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Notlar Tab -->
                                <div class="tab-pane fade" id="customer-detail-notes" role="tabpanel">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title mb-3">Müşteri Notları</h6>
                                            <div class="border rounded p-3 bg-light" style="min-height: 200px;">
                                                ${customer.notes ? `<p class="mb-0">${customer.notes.replace(/\n/g, '<br>')}</p>` : '<p class="text-muted mb-0">Henüz not eklenmemiş</p>'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Ürünler Tab -->
                                <div class="tab-pane fade" id="customer-detail-products" role="tabpanel">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <h6 class="card-title mb-0">Firma Ürünleri</h6>
                                                <button type="button" class="btn btn-sm btn-primary" onclick="window.showAddProductToCustomerModal(${id})">
                                                    <i class="fas fa-plus"></i> Yeni Ürün Ekle
                                                </button>
                                            </div>
                                            <div id="productsTabContent">
                                                <div id="productsTableContainer">
                                                    <!-- Products will be rendered here -->
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Dosyalar Tab -->
                                <div class="tab-pane fade" id="customer-detail-files" role="tabpanel">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title mb-3">Müşteri Dosyaları</h6>
                                            <p class="text-muted mb-0">Dosya yönetimi yakında eklenecek...</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Geçmiş Tab -->
                                <div class="tab-pane fade" id="customer-detail-history" role="tabpanel">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title mb-3">Destek Talepleri Geçmişi</h6>
                                            ${cases.length > 0 ? `
                                                <div class="table-responsive">
                                                    <table class="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Ticket No</th>
                                                                <th>Başlık</th>
                                                                <th>Durum</th>
                                                                <th>Öncelik</th>
                                                                <th>Tarih</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${cases.map(c => `
                                                                <tr>
                                                                    <td>${c.ticket_number || c.id}</td>
                                                                    <td>${c.title || 'N/A'}</td>
                                                                    <td><span class="badge bg-secondary">${c.status?.name || 'N/A'}</span></td>
                                                                    <td><span class="badge bg-warning">${c.priority_type?.name || 'N/A'}</span></td>
                                                                    <td>${c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : 'N/A'}</td>
                                                                </tr>
                                                            `).join('')}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ` : '<p class="text-muted mb-0">Henüz destek talebi bulunmuyor</p>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                            <button type="button" class="btn btn-primary" onclick="editCustomer(${id}); bootstrap.Modal.getInstance(document.getElementById('customerDetailModal')).hide();">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('customerDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize modal
        const modalElement = new bootstrap.Modal(document.getElementById('customerDetailModal'));
        modalElement.show();

        // Render products table immediately
        renderCustomerProductsTable(customerProductsWithDetails, id);

        // Add event listener for tab change to ensure table is rendered correctly
        const productsTab = document.getElementById('products-tab');
        if (productsTab) {
            productsTab.addEventListener('shown.bs.tab', function (e) {
                console.log('Products tab shown, re-rendering table...');
                renderCustomerProductsTable(customerProductsWithDetails, id);
            });
        }

        // Store customer and products data globally for use in modal functions
        window.currentCustomerDetail = { id, customer, allProducts, customerProducts: customerProductsWithDetails };
    } catch (error) {
        console.error('Error loading customer detail:', error);
        notifyError('Müşteri detayları yüklenirken hata oluştu: ' + error.message);
    }
}

// Render customer products table
function renderCustomerProductsTable(products, customerId) {
    console.log('renderCustomerProductsTable called with', products ? products.length : 0, 'products');

    const container = document.getElementById('productsTableContainer');
    if (!container) {
        console.error('productsTableContainer element not found in DOM');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">Henüz ürün atanmamış</p>';
        return;
    }

    // Use simple string concatenation for rows to avoid template literal issues
    let rowsHTML = '';
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const categoryName = (product.category && product.category.name) ? product.category.name : 'Kategori Yok';
        const brandName = (product.brand && product.brand.name) ? product.brand.name : 'Marka Yok';
        const productName = product.name || 'N/A';
        const productCode = product.code || '-';

        rowsHTML += '<tr id="productRow_' + product.id + '">';
        rowsHTML += '<td>' + escapeHtml(productName) + '</td>';
        rowsHTML += '<td><span class="badge bg-info">' + escapeHtml(categoryName) + '</span></td>';
        rowsHTML += '<td><span class="badge bg-secondary">' + escapeHtml(brandName) + '</span></td>';
        rowsHTML += '<td>' + escapeHtml(productCode) + '</td>';
        rowsHTML += '<td class="text-end">';
        rowsHTML += '<button type="button" class="btn btn-sm btn-danger" onclick="window.removeProductFromCustomer(' + customerId + ', ' + product.id + ')" title="Ürünü Kaldır">';
        rowsHTML += '<i class="fas fa-trash"></i>';
        rowsHTML += '</button>';
        rowsHTML += '</td>';
        rowsHTML += '</tr>';
    }

    const tableHTML = '<div class="table-responsive">' +
        '<table class="table table-sm table-hover">' +
        '<thead>' +
        '<tr>' +
        '<th>Ürün Adı</th>' +
        '<th>Kategori</th>' +
        '<th>Marka</th>' +
        '<th>Ürün Kodu</th>' +
        '<th class="text-end">İşlemler</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody id="customerProductsTableBody">' +
        rowsHTML +
        '</tbody>' +
        '</table>' +
        '</div>';

    container.innerHTML = tableHTML;
    console.log('Products table rendered successfully');
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Show modal to add product to customer
window.showAddProductToCustomerModal = async function (customerId) {
    try {
        if (!window.currentCustomerDetail || window.currentCustomerDetail.id !== customerId) {
            // Reload customer data if not available
            const response = await fetch(`${API_BASE}/customers/${customerId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) {
                notifyError('Müşteri bilgileri yüklenemedi');
                return;
            }
            const customer = await response.json();
            const productsResponse = await fetch(`${API_BASE}/products`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const allProducts = productsResponse.ok ? await productsResponse.json() : [];
            window.currentCustomerDetail = { id: customerId, customer, allProducts, customerProducts: customer.products || [] };
        }

        const { customer, allProducts } = window.currentCustomerDetail;
        const assignedProductIds = customer.products ? customer.products.map(cp => cp.id) : [];
        const availableProducts = allProducts.filter(p => p.is_active !== 0 && !assignedProductIds.includes(p.id));

        if (availableProducts.length === 0) {
            notifyWarning('Eklenebilecek ürün bulunmuyor. Tüm ürünler zaten atanmış veya aktif ürün yok.');
            return;
        }

        const modalHTML = `
            <div class="modal fade" id="addProductToCustomerModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-box"></i> Müşteriye Ürün Ekle
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addProductToCustomerForm">
                                <div class="mb-3">
                                    <label class="form-label">Ürün Seçin <span class="text-danger">*</span></label>
                                    <select class="form-select" id="productToAddSelect" required>
                                        <option value="">Ürün seçiniz...</option>
                                        ${availableProducts.map(p => `
                                            <option value="${p.id}">${p.name}${p.category ? ' - ' + p.category.name : ''}${p.brand ? ' (' + p.brand.name + ')' : ''}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                            <button type="button" class="btn btn-primary" onclick="addProductToCustomer(${customerId})">Ekle</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('addProductToCustomerModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize modal
        const modalElement = new bootstrap.Modal(document.getElementById('addProductToCustomerModal'));
        modalElement.show();
    } catch (error) {
        console.error('Error showing add product modal:', error);
        notifyError('Ürün ekleme modal\'ı açılırken hata oluştu: ' + error.message);
    }
}

// Add product to customer
window.addProductToCustomer = async function (customerId) {
    try {
        const productId = document.getElementById('productToAddSelect').value;
        if (!productId) {
            notifyWarning('Lütfen bir ürün seçin');
            return;
        }

        // Get current customer data
        const response = await fetch(`${API_BASE}/customers/${customerId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            notifyError('Müşteri bilgileri yüklenemedi');
            return;
        }
        const customer = await response.json();

        // Get current product IDs and add new one
        const currentProductIds = customer.products ? customer.products.map(p => p.id) : [];
        if (currentProductIds.includes(parseInt(productId))) {
            notifyWarning('Bu ürün zaten müşteriye atanmış');
            return;
        }

        const updatedProductIds = [...currentProductIds, parseInt(productId)];

        // Update customer with new product
        const updateResponse = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_ids: updatedProductIds
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.detail || 'Ürün eklenirken hata oluştu');
        }

        notifySuccess('Ürün başarıyla eklendi');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductToCustomerModal'));
        if (modal) modal.hide();

        // Refresh customer detail modal - reload the page data
        const detailModal = document.getElementById('customerDetailModal');
        if (detailModal) {
            const modalInstance = bootstrap.Modal.getInstance(detailModal);
            if (modalInstance) {
                modalInstance.hide();
            }
            // Reload customer detail after a short delay
            setTimeout(() => {
                window.viewCustomerDetail(customerId);
            }, 300);
        } else {
            // If modal is not open, just reload
            window.viewCustomerDetail(customerId);
        }
    } catch (error) {
        console.error('Error adding product to customer:', error);
        notifyError('Ürün eklenirken hata oluştu: ' + error.message);
    }
}

// Remove product from customer
window.removeProductFromCustomer = async function (customerId, productId) {
    try {
        if (!confirm('Bu ürünü müşteriden kaldırmak istediğinize emin misiniz?')) {
            return;
        }

        // Get current customer data
        const response = await fetch(`${API_BASE}/customers/${customerId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            notifyError('Müşteri bilgileri yüklenemedi');
            return;
        }
        const customer = await response.json();

        // Get current product IDs and remove the one
        const currentProductIds = customer.products ? customer.products.map(p => p.id) : [];
        const updatedProductIds = currentProductIds.filter(id => id !== productId);

        // Update customer without the product
        const updateResponse = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_ids: updatedProductIds
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.detail || 'Ürün kaldırılırken hata oluştu');
        }

        notifySuccess('Ürün başarıyla kaldırıldı');

        // Refresh customer detail modal - reload the page data
        const detailModal = document.getElementById('customerDetailModal');
        if (detailModal) {
            const modalInstance = bootstrap.Modal.getInstance(detailModal);
            if (modalInstance) {
                modalInstance.hide();
            }
            // Reload customer detail after a short delay
            setTimeout(() => {
                window.viewCustomerDetail(customerId);
            }, 300);
        } else {
            // If modal is not open, just reload
            window.viewCustomerDetail(customerId);
        }
    } catch (error) {
        console.error('Error removing product from customer:', error);
        notifyError('Ürün kaldırılırken hata oluştu: ' + error.message);
    }
}

async function editProduct(id) {
    try {
        // Load product, categories and brands
        const [productResponse, categoriesResponse, brandsResponse] = await Promise.all([
            fetch(`${API_BASE}/products/${id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/product-categories`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE}/product-brands`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        if (!productResponse.ok) throw new Error('Ürün verileri yüklenemedi');

        const product = await productResponse.json();
        let categories = [];
        let brands = [];

        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }
        if (brandsResponse.ok) {
            brands = await brandsResponse.json();
        }

        const categoryOptions = categories
            .filter(cat => cat.is_active === 1)
            .map(cat => `<option value="${cat.id}" ${product.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>`)
            .join('');

        const brandOptions = brands
            .filter(brand => brand.is_active === 1)
            .map(brand => `<option value="${brand.id}" ${product.brand_id === brand.id ? 'selected' : ''}>${brand.name}</option>`)
            .join('');

        const modal = createModal('editProductModal', 'Ürün Düzenle', `
            <form id="editProductForm">
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-tag"></i> Ürün Adı <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control" id="editProductName" value="${product.name || ''}" required placeholder="Ürün adını giriniz">
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-barcode"></i> Ürün Kodu
                    </label>
                    <input type="text" class="form-control" id="editProductCode" value="${product.code || ''}" placeholder="Ürün kodunu giriniz (opsiyonel)">
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-folder"></i> Ürün Kategorisi <span class="text-danger">*</span>
                    </label>
                    <select class="form-control" id="editProductCategory" required>
                        <option value="">Kategori seçiniz</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-star"></i> Ürün Markası <span class="text-danger">*</span>
                    </label>
                    <select class="form-control" id="editProductBrand" required>
                        <option value="">Marka seçiniz</option>
                        ${brandOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        <i class="fas fa-align-left"></i> Ürün Açıklaması
                    </label>
                    <textarea class="form-control" id="editProductDescription" rows="3" placeholder="Ürün açıklamasını giriniz">${product.description || ''}</textarea>
                </div>
            </form>
        `, async () => {
            const categorySelect = document.getElementById('editProductCategory');
            const brandSelect = document.getElementById('editProductBrand');

            const productData = {
                name: document.getElementById('editProductName').value.trim(),
                code: document.getElementById('editProductCode').value.trim() || null,
                category_id: categorySelect.value ? parseInt(categorySelect.value) : null,
                brand_id: brandSelect.value ? parseInt(brandSelect.value) : null,
                description: document.getElementById('editProductDescription').value.trim() || null
            };

            if (!productData.name) {
                notifyError('Ürün adı zorunludur!');
                return;
            }

            if (!productData.category_id) {
                notifyError('Ürün kategorisi seçilmelidir!');
                return;
            }

            if (!productData.brand_id) {
                notifyError('Ürün markası seçilmelidir!');
                return;
            }

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
                    notifyError(error.detail || 'Ürün güncellenirken hata oluştu');
                }
            } catch (error) {
                notifyError('Bağlantı hatası: ' + error.message);
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
let allDepartments = [];
let selectedStaffIds = new Set(); // For tag-based staff selection

async function loadCaseData() {
    try {
        [customers, products, supportStaff, allUsers, supportTypes, supportStatuses, priorityTypes, allDepartments] = await Promise.all([
            fetch(`${API_BASE}/customers`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/products`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/users/support-staff`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/support-types`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/support-statuses`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/priority-types`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/users/departments`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.ok ? r.json() : [])
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
                                        ${customers.filter(c => c.is_active !== 0).map(c => `<option value="${c.id}">${c.company_name || c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="form-label small">Ürün</label>
                                    <select class="form-select form-select-sm" id="caseProduct" disabled>
                                        <option value="">Önce Müşteri Seçin</option>
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
                                    <select class="form-select form-select-sm" id="caseDepartment">
                                        <option value="">Departman Seçin</option>
                                        ${allDepartments.filter(d => d.is_active !== 0).map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                                    </select>
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
    const customerSelect = document.getElementById('caseCustomer');
    const productSelect = document.getElementById('caseProduct');

    if (customerSelect && productSelect) {
        customerSelect.addEventListener('change', async function () {
            const customerId = this.value;

            // Reset product select
            productSelect.innerHTML = '<option value="">Ürün Seçin</option>';
            productSelect.disabled = true;

            if (!customerId) {
                productSelect.innerHTML = '<option value="">Önce Müşteri Seçin</option>';
                return;
            }

            try {
                productSelect.innerHTML = '<option value="">Yükleniyor...</option>';

                const response = await fetch(`${API_BASE}/customers/${customerId}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (response.ok) {
                    const customer = await response.json();
                    const customerProducts = customer.products || [];

                    if (customerProducts.length > 0) {
                        productSelect.innerHTML = '<option value="">Ürün Seçin</option>' +
                            customerProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
                        productSelect.disabled = false;
                    } else {
                        productSelect.innerHTML = '<option value="">Müşteriye ait ürün bulunamadı</option>';
                    }
                } else {
                    console.error('Failed to fetch customer details');
                    productSelect.innerHTML = '<option value="">Hata oluştu</option>';
                }
            } catch (error) {
                console.error('Error fetching customer products:', error);
                productSelect.innerHTML = '<option value="">Hata oluştu</option>';
            }
        });
    }

    const assignedToSelect = document.getElementById('caseAssignedTo');
    if (assignedToSelect) {
        assignedToSelect.addEventListener('change', function () {
            const userId = this.value;
            const selectedOption = this.options[this.selectedIndex];
            const deptSelect = document.getElementById('caseDepartment');

            if (userId && selectedOption && deptSelect) {
                // Get department from user and auto-select it in dropdown
                const user = allUsers.find(u => u.id === parseInt(userId));
                if (user && user.department && user.department.id) {
                    deptSelect.value = user.department.id;
                } else {
                    deptSelect.value = '';
                }
            } else if (deptSelect) {
                deptSelect.value = '';

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
            textarea.addEventListener('paste', async function (e) {
                const items = e.clipboardData.items;
                for (let item of items) {
                    if (item.type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const blob = item.getBlob();
                        const reader = new FileReader();
                        reader.onload = function (event) {
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
    window.selectStaff = function (userId) {
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

    window.removeStaffTag = function (userId) {
        selectedStaffIds.delete(userId);
        renderSelectedTags();
    };

    if (staffSearchInput) {
        staffSearchInput.addEventListener('input', function (e) {
            filterStaff(e.target.value);
        });

        staffSearchInput.addEventListener('focus', function () {
            if (this.value.trim()) {
                filterStaff(this.value);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!staffSearchInput.contains(e.target) && !staffDropdown.contains(e.target)) {
                staffDropdown.style.display = 'none';
            }
        });
    }

    // Initialize
    renderSelectedTags();

    // Set default values for status and priority
    const statusSelect = document.getElementById('caseStatus');
    const prioritySelect = document.getElementById('casePriority');

    // Find and select "Yeni" status (or first active status if "Yeni" not found)
    if (statusSelect && supportStatuses.length > 0) {
        const yeniStatus = supportStatuses.find(s => s.is_active === 1 && s.name.toLowerCase().includes('yeni'));
        if (yeniStatus) {
            statusSelect.value = yeniStatus.id;
        } else {
            // Fallback to first active status
            const firstActiveStatus = supportStatuses.find(s => s.is_active === 1);
            if (firstActiveStatus) {
                statusSelect.value = firstActiveStatus.id;
            }
        }
    }

    // Find and select "Orta" priority (or first active priority if "Orta" not found)
    if (prioritySelect && priorityTypes.length > 0) {
        const ortaPriority = priorityTypes.find(p => p.is_active === 1 && p.name.toLowerCase().includes('orta'));
        if (ortaPriority) {
            prioritySelect.value = ortaPriority.id;
        } else {
            // Fallback to first active priority
            const firstActivePriority = priorityTypes.find(p => p.is_active === 1);
            if (firstActivePriority) {
                prioritySelect.value = firstActivePriority.id;
            }
        }
    }

    modalElement.show();
}

async function saveCase() {
    const form = document.getElementById('addCaseForm');
    if (!form || !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        // Validate required fields
        const customerId = document.getElementById('caseCustomer').value;
        const priorityId = document.getElementById('casePriority').value;
        const supportTypeId = document.getElementById('caseSupportType').value;
        const statusId = document.getElementById('caseStatus').value;

        if (!customerId) {
            notifyWarning('Lütfen müşteri seçin');
            return;
        }
        if (!priorityId) {
            notifyWarning('Lütfen öncelik seçin');
            return;
        }
        if (!supportTypeId) {
            notifyWarning('Lütfen ticket türü seçin');
            return;
        }
        if (!statusId) {
            notifyWarning('Lütfen durum seçin');
            return;
        }

        const caseData = {
            title: document.getElementById('caseTitle').value || 'Destek Talebi',
            description: document.getElementById('caseDescription').value,
            request_date: document.getElementById('caseRequestDate').value,
            customer_id: parseInt(customerId),
            product_id: document.getElementById('caseProduct').value ? parseInt(document.getElementById('caseProduct').value) : null,
            assigned_to: document.getElementById('caseAssignedTo').value ? parseInt(document.getElementById('caseAssignedTo').value) : null,
            department_id: document.getElementById('caseDepartment').value ? parseInt(document.getElementById('caseDepartment').value) : null,
            priority_type_id: parseInt(priorityId),
            support_type_id: parseInt(supportTypeId),
            status_id: parseInt(statusId),
            solution: document.getElementById('caseSolution').value || null,
            start_date: document.getElementById('caseStartDate').value || null,
            end_date: document.getElementById('caseEndDate').value || null,
            time_spent_minutes: document.getElementById('caseTimeSpent').value ? parseInt(document.getElementById('caseTimeSpent').value) : null,
            assigned_user_ids: Array.from(selectedStaffIds).map(id => parseInt(id))
        };

        console.log('Sending case data:', caseData);

        const response = await fetch(`${API_BASE}/cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(caseData)
        });

        console.log('Response status:', response.status);

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
            const error = await response.json().catch(() => ({ detail: 'Sunucudan yanıt alınamadı' }));
            console.error('API Error:', error);
            notifyError(error.detail || 'Bilinmeyen hata');
        }
    } catch (error) {
        console.error('Error saving case:', error);
        notifyError('Hata: ' + error.message);
    }
}

