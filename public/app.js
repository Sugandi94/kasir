let currentUser = null;
let editingProductId = null;
let editingUserId = null;
// Track the transaction being edited
let editingTransactionId = null;

let trxItems = [];

// Helper functions to save/load cart data to/from localStorage
function saveCartToStorage() {
    localStorage.setItem('kasirku_cart', JSON.stringify(trxItems));
}

function loadCartFromStorage() {
    const raw = localStorage.getItem('kasirku_cart');
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

// Login function
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) {
        document.getElementById('login-msg').innerText = 'Username dan password harus diisi!';
        return;
    }
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            currentUser = res.user;
            saveSession(currentUser);
            showDashboard();
            document.getElementById('login-msg').innerText = '';
        } else {
            document.getElementById('login-msg').innerText = res.message || 'Login gagal';
        }
    })
    .catch(() => {
        document.getElementById('login-msg').innerText = 'Gagal menghubungi server.';
    });
}

// Pagination state for transaksi
let trxCurrentPage = 1;
let trxPageSize = 10;
let trxAllData = [];

// Session Management
function saveSession(user) {
    localStorage.setItem('kasirku_user', JSON.stringify(user));
}
function loadSession() {
    const raw = localStorage.getItem('kasirku_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
function clearSession() {
    localStorage.removeItem('kasirku_user');
}

function toggleUserForm() {
    const formContainer = document.getElementById('user-form-container');
    const toggleBtn = document.getElementById('toggle-user-form-btn');
    if (formContainer.style.display === 'none' || formContainer.style.display === '') {
        formContainer.style.display = 'block';
        toggleBtn.innerText = 'Sembunyikan Form';
    } else {
        formContainer.style.display = 'none';
        toggleBtn.innerText = 'Tambah User Baru';
    }
}

function toggleProductForm() {
    const formContainer = document.getElementById('product-form-container');
    const toggleBtn = document.getElementById('toggle-product-form-btn');
    if (formContainer.style.display === 'none' || formContainer.style.display === '') {
        formContainer.style.display = 'block';
        toggleBtn.innerText = 'Sembunyikan Form';
    } else {
        formContainer.style.display = 'none';
        toggleBtn.innerText = 'Tambah Produk';
    }
}

function showDashboard() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('dashboard').style.display = '';
    document.getElementById('role').innerText = 'Dashboard ' + currentUser.role;
    showMenuByRole();
    showPage('transaksi');
}

// Category Management
let editingCategoryId = null;

function toggleCategoryForm() {
    const formContainer = document.getElementById('category-form-container');
    const toggleBtn = document.getElementById('toggle-category-form-btn');
    if (formContainer.style.display === 'none' || formContainer.style.display === '') {
        formContainer.style.display = 'block';
        toggleBtn.innerText = 'Sembunyikan Form';
    } else {
        formContainer.style.display = 'none';
        toggleBtn.innerText = 'Tambah Kategori Baru';
    }
}

function loadCategories() {
    fetch('/api/categories').then(r => r.json()).then(categories => {
        let html = `
        <div class="table-responsive">
        <table class="common-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Kategori</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
        `;
        categories.forEach((cat, i) => {
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${cat.name}</td>
                    <td style="text-align:center;">
                        <button class="btn-small edit" title="Edit" onclick="editCategory('${cat.id}', '${cat.name}')">&#9998;</button>
                        <button class="btn-small del" title="Hapus" onclick="deleteCategory('${cat.id}')">&#128465;</button>
                    </td>
                </tr>
            `;
        });
        html += `
            </tbody>
        </table>
        </div>
        `;
        document.getElementById('category-list').innerHTML = html;
    });
}

function saveCategory() {
    console.log('saveCategory called');
    const name = document.getElementById('newcategory').value.trim();
    if (!name) {
        document.getElementById('addcategory-msg').innerText = 'Nama kategori wajib diisi!';
        return;
    }
    if (editingCategoryId) {
        fetch(`/api/categories/${editingCategoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(r => r.json())
        .then(res => {
            document.getElementById('addcategory-msg').innerText = res.success ? 'Kategori berhasil diupdate' : (res.message || 'Gagal update');
            if (res.success) {
                resetCategoryForm();
                loadCategories();
            }
        }).catch(() => {
            document.getElementById('addcategory-msg').innerText = 'Error update data.';
        });
    } else {
        fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(r => r.json())
        .then(res => {
            document.getElementById('addcategory-msg').innerText = res.success ? 'Kategori berhasil ditambah' : (res.message || 'Gagal tambah');
            if (res.success) {
                resetCategoryForm();
                loadCategories();
            }
        });
    }
}

function editCategory(id, name) {
    editingCategoryId = id;
    document.getElementById('newcategory').value = name;
    document.getElementById('category-form-title').innerText = 'Edit Kategori';
    document.getElementById('category-save-btn').innerText = 'Update';
    document.getElementById('category-cancel-btn').style.display = '';
}

function cancelEditCategory() {
    resetCategoryForm();
}

function resetCategoryForm() {
    editingCategoryId = null;
    document.getElementById('newcategory').value = '';
    document.getElementById('category-form-title').innerText = 'Tambah Kategori Baru';
    document.getElementById('category-save-btn').innerText = 'Tambah';
    document.getElementById('category-cancel-btn').style.display = 'none';
    document.getElementById('addcategory-msg').innerText = '';
}

// Extend showPage to load categories when page-kategori is shown
function showPage(page) {
    document.querySelectorAll('.page').forEach(section => section.style.display = 'none');
    document.getElementById('page-' + page).style.display = '';
    if(page === 'user') loadUsers();
    if(page === 'produk') loadProducts();
    if(page === 'kategori') loadCategories();
    if(page === 'daftar') loadTrxList(1);
    if(page === 'transaksi') {
        loadTrxProducts();
        renderTrxItems(); // Untuk tabel keranjang transaksi
        loadLastTrxList(); // --- Tampilkan 5 transaksi terakhir di bawah form transaksi
    }
}

function logout() {
    currentUser = null;
    clearSession();
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login').style.display = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Navigation & Page Control
function showMenuByRole() {
    document.getElementById('nav-user').style.display = currentUser.role === 'admin' ? '' : 'none';
    document.getElementById('nav-produk').style.display = currentUser.role === 'admin' ? '' : 'none';
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(section => section.style.display = 'none');
    document.getElementById('page-' + page).style.display = '';
    if(page === 'user') loadUsers();
    if(page === 'produk') loadProducts();
    if(page === 'kategori') loadCategories();
    if(page === 'daftar') loadTrxList(1);
    if(page === 'transaksi') {
        loadTrxProducts();
        renderTrxItems(); // Untuk tabel keranjang transaksi
        loadLastTrxList(); // --- Tampilkan 5 transaksi terakhir di bawah form transaksi
    }
}

// TABEL TRANSAKSI TERAKHIR (hanya 5 terakhir, tanpa aksi print/pagination)
function loadLastTrxList() {
    fetch('/api/transactions')
    .then(r => r.json())
    .then(trx => {
        trx = trx.slice(-5).reverse(); // 5 terakhir
        let html = `
        <h4 style="margin-top:32px;margin-bottom:8px;">5 Transaksi Terakhir</h4>
        <div class="table-responsive">
        <table class="common-table" style="font-size:14px;">
            <thead>
                <tr>
                    <th style="width:32px;">No</th>
                    <th style="width:140px;">Tanggal</th>
                    <th>Produk</th>
                    <th style="width:100px;">Total</th>
                </tr>
            </thead>
            <tbody>
        `;
        if(trx.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center;color:#888;">Belum ada transaksi</td></tr>`;
        } else {
            trx.forEach((t, i) => {
                let items = t.items.map(it =>
                    `<table style="width:100%; border-collapse: collapse; font-size: 13px; margin-bottom: 4px;">
                        <tr>
                            <td style="font-weight:bold; padding: 2px 4px;">${it.name}</td>
                            <td style="padding: 2px 4px; text-align: center;">x${it.qty}</td>
                            <td style="padding: 2px 4px; color:#888; text-align: right;">@Rp${it.price.toLocaleString('id-ID')}</td>
                            <td style="font-weight:bold; padding: 2px 4px; text-align: right;">Rp${(it.subtotal || it.qty * it.price).toLocaleString('id-ID')}</td>
                        </tr>
                    </table>`
                ).join('');
                html += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${(new Date(t.date)).toLocaleString('id-ID')}</td>
                        <td>${items}</td>
                        <td style="font-weight:bold;color:#38761d;">Rp${t.total.toLocaleString('id-ID')}</td>
                    </tr>
                `;
            });
        }
        html += `</tbody></table></div>`;
        document.getElementById('last-trx-list').innerHTML = html;
    })
    .catch(err => {
        document.getElementById('last-trx-list').innerHTML = "<div style='color:red;'>Gagal memuat transaksi terakhir.</div>";
    });
}

// User Management
function loadUsers() {
    fetch('/api/users').then(r => r.json()).then(users => {
        let html = `
        <div class="table-responsive">
        <table class="user-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
        `;
        users.forEach((u, i) => {
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>
                        <button class="btn-small edit" title="Edit" onclick="editUser('${u.id}', '${u.username}', '${u.role}')">&#9998;</button>
                        ${
                            u.id == 1
                            ? `<button class="btn-small del" title="Tidak bisa dihapus" style="opacity:0.5;cursor:not-allowed;" disabled>&#128465;</button>`
                            : `<button class="btn-small del" title="Hapus" onclick="deleteUser('${u.id}')">&#128465;</button>`
                        }
                    </td>
                </tr>
            `;
        });
        html += `
            </tbody>
        </table>
        </div>
        `;
        document.getElementById('user-list').innerHTML = html;
    });
}


// Save user (add or update)
function saveUser() {
    const username = document.getElementById('newuser').value.trim();
    const password = document.getElementById('newpass').value;
    const role = document.getElementById('newrole').value;

    if (!username) {
        document.getElementById('adduser-msg').innerText = 'Username harus diisi!';
        return;
    }
    // Password is required only when adding new user or changing password
    if (!editingUserId && !password) {
        document.getElementById('adduser-msg').innerText = 'Password harus diisi!';
        return;
    }

    if (editingUserId) {
        // Update existing user
        updateUser(editingUserId, username, password, role);
    } else {
        // Add new user
        fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        })
        .then(r => r.json())
        .then(res => {
            document.getElementById('adduser-msg').innerText = res.success ? 'User berhasil ditambah' : res.message;
            if (res.success) {
                resetUserForm();
                loadUsers();
            }
        });
    }
}

// Update user function
function updateUser(id, username, password, role) {
    const bodyData = { username, role };
    if (password) {
        bodyData.password = password;
    }
    fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    })
    .then(r => r.json())
    .then(res => {
        document.getElementById('adduser-msg').innerText = res.success ? 'User berhasil diupdate' : res.message;
        if (res.success) {
            resetUserForm();
            loadUsers();
        }
    });
}

// Edit user function
function editUser(id, username, role) {
    editingUserId = id;
    document.getElementById('newuser').value = username;
    document.getElementById('newuser').disabled = false; // Enable username input for editing
    document.getElementById('newpass').value = '';
    document.getElementById('newrole').value = role;
    document.getElementById('user-form-title').innerText = 'Edit User';
    document.getElementById('user-save-btn').innerText = 'Update';
    document.getElementById('user-cancel-btn').style.display = '';
}

function editUser(id, username, role) {
    editingUserId = id;
    document.getElementById('newuser').value = username;
    document.getElementById('newuser').disabled = false; // Enable username input for editing
    document.getElementById('newpass').value = '';
    document.getElementById('newrole').value = role;
    document.getElementById('user-form-title').innerText = 'Edit User';
    document.getElementById('user-save-btn').innerText = 'Update';
    document.getElementById('user-cancel-btn').style.display = '';
}

function deleteUser(id) {
    if (confirm('Hapus user ini?')) {
        fetch(`/api/users/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(res => {
            document.getElementById('adduser-msg').innerText = res.success ? 'User berhasil dihapus' : res.message;
            loadUsers();
        });
    }
}

function cancelEditUser() {
    resetUserForm();
}

function resetUserForm() {
    editingUserId = null;
    document.getElementById('newuser').value = '';
    document.getElementById('newuser').disabled = false;
    document.getElementById('newpass').value = '';
    document.getElementById('newrole').value = 'kasir';
    document.getElementById('user-form-title').innerText = 'Tambah User Baru';
    document.getElementById('user-save-btn').innerText = 'Tambah';
    document.getElementById('user-cancel-btn').style.display = 'none';
    document.getElementById('adduser-msg').innerText = '';
}


let productPaginationEnabled = true;
let productCurrentPage = 1;
let productPageSize = 10;
let productAllData = [];

function toProperCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function renderProductPagination() {
    let total = productAllData.length;
    let pageCount = Math.ceil(total / productPageSize);

    // Remove old pagination if exists
    document.getElementById('product-pagination')?.remove();

    if (pageCount <= 1) return;

    let html = `<div id="product-pagination" class="product-pagination" style="margin-top:10px; text-align:center;">`;
    html += `<button onclick="loadProductsPage(1)" ${productCurrentPage === 1 ? "disabled" : ""}>&laquo;</button>`;
    html += `<button onclick="loadProductsPage(${productCurrentPage-1})" ${productCurrentPage === 1 ? "disabled" : ""}><</button>`;

    // Show max 5 page buttons
    let start = Math.max(1, productCurrentPage - 2);
    let end = Math.min(pageCount, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        html += `<button onclick="loadProductsPage(${i})" ${productCurrentPage === i ? "class='active'" : ""}>${i}</button>`;
    }

    html += `<button onclick="loadProductsPage(${productCurrentPage+1})" ${productCurrentPage === pageCount ? "disabled" : ""}>></button>`;
    html += `<button onclick="loadProductsPage(${pageCount})" ${productCurrentPage === pageCount ? "disabled" : ""}>&raquo;</button>`;
    html += `</div>`;

    document.getElementById('product-list').insertAdjacentHTML('afterend', html);
}

function loadProductsPage(page) {
    productCurrentPage = page;
    renderProductTable();
    renderProductPagination();
}



let productSearchKeyword = '';
let productSearchTimeout = null;
let productSortColumn = 'name'; // default sort column
let productSortOrder = 'asc'; // 'asc' or 'desc'

function renderTable(containerId, columns, data, options = {}) {
    const {
        sortable = false,
        sortColumn = null,
        sortOrder = 'asc',
        onSortChange = null,
        pagination = false,
        currentPage = 1,
        pageSize = 10,
        onPageChange = null,
        actions = null,
        tableClass = 'product-table',
        search = null,
        onSearchChange = null,
        searchValue = '',
        title = ''
    } = options;

    // Sorting
    let sortedData = [...data];
    if (sortable && sortColumn) {
        sortedData.sort((a, b) => {
            let valA = a[sortColumn];
            let valB = b[sortColumn];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    let pagedData = sortedData;
    if (pagination) {
        const startIdx = (currentPage - 1) * pageSize;
        pagedData = sortedData.slice(startIdx, startIdx + pageSize);
    }

    // Search input
    let searchHtml = '';
    if (search !== null) {
        searchHtml = `
        <div style="display:flex; align-items:center; gap:8px; flex-grow:1; min-width: 180px;">
            <input type="text" placeholder="Search..." value="${searchValue}" 
                oninput="(${onSearchChange})(this.value)" 
                style="padding:6px 10px; font-size: 14px; border: 1px solid #168bff; border-radius: 4px; flex-grow:1;">
            <button type="button" onclick="(function(){
                const input = document.querySelector('#${containerId} input[type=text]');
                if(input){
                    input.value = '';
                    (${onSearchChange})('');
                }
            })()" style="padding:6px 10px; font-size: 14px; border: 1px solid #168baa; border-radius: 4px; background:#168bff; cursor:pointer;">Reset</button>
        </div>
        `;
    }

    // Table header with sorting indicators
    function getSortIndicator(column) {
        if (!sortable) return '';
        if (sortColumn === column) {
            return sortOrder === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    }

    let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;flex-wrap:wrap;">
        <span style="font-weight:bold;">${title}</span>
        ${searchHtml}
    </div>
    <div class="table-responsive">
    <table id="product-table" class="${tableClass}">
        <thead>
            <tr>
    `;

    columns.forEach(col => {
        if (col.sortable) {
            html += `<th style="cursor:pointer;" onclick="(${onSortChange})('${col.key}')">${col.label}${getSortIndicator(col.key)}</th>`;
        } else {
            html += `<th${col.style ? ` style="${col.style}"` : ''}>${col.label}</th>`;
        }
    });

    html += `
            </tr>
        </thead>
        <tbody>
    `;

    pagedData.forEach((row, i) => {
        html += '<tr>';
        columns.forEach(col => {
            if (col.key === 'no') {
                html += `<td>${pagination ? ((currentPage - 1) * pageSize + i + 1) : (i + 1)}</td>`;
            } else if (col.key === 'actions' && actions) {
                html += `<td style="text-align:center;">${actions(row)}</td>`;
            } else {
                let cell = row[col.key];
                if (col.format) {
                    cell = col.format(cell, row);
                }
                html += `<td>${cell}</td>`;
            }
        });
        html += '</tr>';
    });

    html += `
        </tbody>
    </table>
    </div>
    `;

    // Pagination controls
    if (pagination) {
        const totalPages = Math.ceil(sortedData.length / pageSize);
        if (totalPages > 1) {
            html += `<div class="product-pagination" style="margin-top:10px; text-align:center;">`;
            html += `<button onclick="(${onPageChange})(1)" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
            html += `<button onclick="(${onPageChange})(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><</button>`;

            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + 4);
            if (end - start < 4) start = Math.max(1, end - 4);

            for (let i = start; i <= end; i++) {
                html += `<button onclick="(${onPageChange})(${i})" ${currentPage === i ? 'class="active"' : ''}>${i}</button>`;
            }

            html += `<button onclick="(${onPageChange})(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>></button>`;
            html += `<button onclick="(${onPageChange})(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
            html += `</div>`;
        }
    }

    document.getElementById(containerId).innerHTML = html;
}

// Refactor renderProductTable to use renderTable
function renderProductTable() {
    const columns = [
        { key: 'no', label: 'No' },
        { key: 'name', label: 'Nama Produk', sortable: true },
        { key: 'category', label: 'Kategori', sortable: true },
        { key: 'buy_price', label: 'Harga Beli', sortable: true, format: (val) => `Rp${Number(val).toLocaleString('id-ID')}` },
        { key: 'sell_price', label: 'Harga Jual', sortable: true, format: (val) => `Rp${Number(val).toLocaleString('id-ID')}` },
        { key: 'stock', label: 'Stok', sortable: true },
        { key: 'actions', label: 'Aksi', style: 'text-align:center;' }
    ];

    const filteredData = productAllData.filter(p =>
        p.name.toLowerCase().includes(productSearchKeyword.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(productSearchKeyword.toLowerCase()))
    );

        renderTable('product-list', columns, filteredData, {
            sortable: true,
            sortColumn: productSortColumn,
            sortOrder: productSortOrder,
            onSortChange: (col) => {
                if (productSortColumn === col) {
                    productSortOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    productSortColumn = col;
                    productSortOrder = 'asc';
                }
                productCurrentPage = 1;
                renderProductTable();
            },
            pagination: productPaginationEnabled,
            currentPage: productCurrentPage,
            pageSize: productPageSize,
            onPageChange: (page) => {
                productCurrentPage = page;
                renderProductTable();
            },
            actions: (row) => `
                <div class="product-row-actions">
                    <button class="btn-small edit" title="Edit" onclick="editProduct('${row.id}', \`${row.name.replace(/`/g, '\\`')}\`, '${row.buy_price}', '${row.sell_price}', '${row.stock}')">&#9998;</button>
                    <button class="btn-small del" title="Hapus" onclick="deleteProduct('${row.id}')">&#128465;</button>
                </div>
            `,
            tableClass: 'common-table',
            search: true,
            searchValue: productSearchKeyword,
            onSearchChange: debouncedHandleProductSearch,
            title: 'Daftar Produk'
        });
}

// Refactor loadUsers to use renderTable
function loadUsers() {
    fetch('/api/users').then(r => r.json()).then(users => {
        const columns = [
            { key: 'no', label: 'No' },
            { key: 'username', label: 'Username' },
            { key: 'role', label: 'Role' },
            { key: 'actions', label: 'Aksi', style: 'text-align:center;' }
        ];

        renderTable('user-list', columns, users, {
            actions: (row) => `
                <button class="btn-small edit" title="Edit" onclick="editUser('${row.id}', '${row.username}', '${row.role}')">&#9998;</button>
                ${row.id == 1
                    ? `<button class="btn-small del" title="Tidak bisa dihapus" style="opacity:0.5;cursor:not-allowed;" disabled>&#128465;</button>`
                    : `<button class="btn-small del" title="Hapus" onclick="deleteUser('${row.id}')">&#128465;</button>`
                }
            `,
            tableClass: 'common-table'
        });
    });
}

// Refactor renderTrxTable to use renderTable
function renderTrxTable() {
    let startIdx = (trxCurrentPage - 1) * trxPageSize;
    let pageData = trxAllData.slice(startIdx, startIdx + trxPageSize);

    const columns = [
        { key: 'no', label: 'No' },
        { key: 'date', label: 'Tanggal', format: (val) => (new Date(val)).toLocaleString('id-ID') },
        { key: 'items', label: 'Produk', format: (val) => {
            return val.map(it => `
                <table style="width:100%; border-collapse: collapse; font-size: 13px; margin-bottom: 4px;">
                    <tr>
                        <td style="font-weight:bold; padding: 2px 4px;">${toProperCase(it.name)}</td>
                        <td style="padding: 2px 4px; text-align: center;">x${it.qty}</td>
                        <td style="padding: 2px 4px; color:#888; text-align: right;">@Rp${it.price.toLocaleString('id-ID')}</td>
                        <td style="font-weight:bold; padding: 2px 4px; text-align: right;">Rp${(it.subtotal || it.qty * it.price).toLocaleString('id-ID')}</td>
                    </tr>
                </table>
            `).join('');
        }},
        { key: 'total', label: 'Total', format: (val) => `Rp${val.toLocaleString('id-ID')}` },
        { key: 'actions', label: 'Aksi', style: 'text-align:center;' }
    ];

    renderTable('trx-list', columns, pageData, {
        actions: (row) => `
            <button class="btn-small print" onclick="printTransaction('${row.id}')">🖨️ Print</button>
            <button class="btn-small del" onclick="deleteTransaction('${row.id}')">&#128465; Hapus</button>
        `,
        tableClass: 'user-table',
        pagination: true,
        currentPage: trxCurrentPage,
        pageSize: trxPageSize,
        onPageChange: (page) => {
            trxCurrentPage = page;
            loadTrxList(page);
        }
    });
}

function changeProductSort(column) {
    if (productSortColumn === column) {
        productSortOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        productSortColumn = column;
        productSortOrder = 'asc';
    }
    productCurrentPage = 1;
    renderProductTable();
}

function handleProductSearch(value) {
    productSearchKeyword = value;
    productCurrentPage = 1;
    renderProductTable();
}

function debouncedHandleProductSearch(value) {
    clearTimeout(productSearchTimeout);
    productSearchTimeout = setTimeout(() => {
        handleProductSearch(value);
    }, 300);
}

function toggleProductPagination(enabled) {
    productPaginationEnabled = enabled;
    productCurrentPage = 1;
    loadProducts();
}

function loadProducts() {
    fetch('/api/products').then(r => r.json()).then(products => {
        productAllData = products;
        renderProductTable();
    });
}

function loadCategoryOptions() {
    fetch('/api/categories').then(r => r.json()).then(categories => {
        const select = document.getElementById('prodcategory');
        if (!select) return;
        select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    });
}

// Update showPage to load categories options when showing product page
const originalShowPage = showPage;
showPage = function(page) {
    originalShowPage(page);
    if (page === 'produk') {
        loadCategoryOptions();
    }
};

// Fungsi deleteAllProducts tetap seperti jawaban sebelumnya
function deleteAllProducts() {
    if (!confirm("Hapus semua produk? Tindakan ini tidak dapat dibatalkan!")) return;
    fetch('/api/products', { method: 'DELETE' })
        .then(r => r.json())
        .then(res => {
            document.getElementById('addprod-msg').innerText = res.success ? 'Semua produk berhasil dihapus.' : (res.message || 'Gagal menghapus semua produk.');
            if (res.success) {
                resetProductForm();
                loadProducts();
            }
        });
}

async function saveProduct() {
    const name = document.getElementById('prodname').value.trim();
    const buy_price_raw = document.getElementById('prodbuy').value.trim();
    const sell_price_raw = document.getElementById('prodsell').value.trim();
    const stock_raw = document.getElementById('prodstock').value.trim();
    const category = document.getElementById('prodcategory').value.trim();

    console.log('Saving product with category:', category);

    if (!name) {
        document.getElementById('addprod-msg').innerText = 'Nama produk wajib diisi!';
        return;
    }

    // Validasi nama produk sudah ada
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        const nameExists = products.some(p => p.name.toLowerCase() === name.toLowerCase() && String(p.id) !== String(editingProductId));
        if (nameExists) {
            document.getElementById('addprod-msg').innerText = 'Nama produk sudah ada!';
            return;
        }
    } catch (e) {
        document.getElementById('addprod-msg').innerText = 'Gagal memeriksa nama produk.';
        return;
    }

    const buy_price = buy_price_raw === '' ? 0 : parseInt(buy_price_raw);
    const sell_price = sell_price_raw === '' ? 0 : parseInt(sell_price_raw);
    const stock = stock_raw === '' ? 0 : parseInt(stock_raw);

    if ((buy_price_raw !== '' && isNaN(buy_price)) ||
        (sell_price_raw !== '' && isNaN(sell_price)) ||
        (stock_raw !== '' && isNaN(stock))) {
        document.getElementById('addprod-msg').innerText = 'Harga beli, harga jual, dan stok harus berupa angka jika diisi!';
        return;
    }

    if (editingProductId) {
        fetch(`/api/products/${editingProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, buy_price, sell_price, stock, category })
        })
        .then(r => r.json())
        .then(res => {
            document.getElementById('addprod-msg').innerText = res.success ? 'Produk berhasil diupdate' : (res.message || 'Gagal update');
            if (res.success) {
                resetProductForm();
                loadProducts();
            }
        }).catch(() => {
            document.getElementById('addprod-msg').innerText = 'Error update data.';
        });
    } else {
        fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, buy_price, sell_price, stock, category })
        })
        .then(r => r.json())
        .then(res => {
            document.getElementById('addprod-msg').innerText = res.success ? 'Produk berhasil ditambah' : (res.message || 'Gagal tambah');
            if (res.success) {
                resetProductForm();
                loadProducts();
            }
        });
    }
}

async function importProductsFromExcel() {
    const fileInput = document.getElementById('import-excel-file');
    const loadingIndicator = document.getElementById('import-loading');
    const progressBar = document.getElementById('import-progress');
    const progressText = document.getElementById('import-progress-text');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Pilih file Excel terlebih dahulu.');
        return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();

    loadingIndicator.style.display = 'block'; // Show loading indicator
    progressBar.value = 0;
    progressText.textContent = '0%';

    let productsToImport = [];

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            // Validate and map data to product format
            productsToImport = jsonData.map(row => ({
                name: String(row['Nama Produk'] || row['name'] || '').trim(),
                buy_price: parseInt(row['Harga Beli'] || row['buy_price'] || 0),
                sell_price: parseInt(row['Harga Jual'] || row['sell_price'] || 0),
                stock: parseInt(row['Stok'] || row['stock'] || 0),
                category: row['Kategori'] || row['category'] || ''
            })).filter(p => p.name !== '');

            if (productsToImport.length === 0) {
                alert('File Excel tidak berisi data produk yang valid.');
                loadingIndicator.style.display = 'none'; // Hide loading indicator
                return;
            }
        } catch (err) {
            console.error('Error parsing Excel file:', err);
            alert('Gagal memproses file Excel. Pastikan file valid dan format benar.\nError detail: ' + err.message);
            loadingIndicator.style.display = 'none'; // Hide loading indicator
            return;
        }

        // Send products to backend API to add/update
        try {
            for (let i = 0; i < productsToImport.length; i++) {
                const product = productsToImport[i];
                await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
                // Update progress bar and text
                const percent = Math.round(((i + 1) / productsToImport.length) * 100);
                progressBar.value = percent;
                progressText.textContent = percent + '%';
            }
            alert('Import produk berhasil.');
            fileInput.value = '';
            loadProducts();
        } catch (error) {
            alert('Gagal mengimpor produk: ' + error.message);
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
        }
    };

    reader.onerror = function() {
        alert('Gagal membaca file.');
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    };

    reader.readAsArrayBuffer(file);
}

function editProduct(id, name, buy_price, sell_price, stock, category = '') {
    editingProductId = id;
    document.getElementById('prodname').value = name;
    document.getElementById('prodbuy').value = buy_price;
    document.getElementById('prodsell').value = sell_price;
    document.getElementById('prodstock').value = stock;
    const prodCategorySelect = document.getElementById('prodcategory');
    if (prodCategorySelect) {
        prodCategorySelect.value = category;
    }
    document.getElementById('prodname').focus();
    document.getElementById('product-form-title').innerText = 'Edit Produk';
    document.getElementById('product-save-btn').innerText = 'Update';
    document.getElementById('product-cancel-btn').style.display = '';
}

function resetProductForm() {
    editingProductId = null;
    document.getElementById('prodname').value = '';
    document.getElementById('prodbuy').value = '';
    document.getElementById('prodsell').value = '';
    document.getElementById('prodstock').value = '';
    document.getElementById('prodcategory').value = '';
    document.getElementById('product-form-title').innerText = 'Tambah Produk';
    document.getElementById('product-save-btn').innerText = 'Tambah';
    document.getElementById('product-cancel-btn').style.display = 'none';
    document.getElementById('addprod-msg').innerText = '';
}

function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        fetch(`/api/products/${id}`, {
            method: 'DELETE'
        })
        .then(r => r.json())
        .then(res => {
            document.getElementById('addprod-msg').innerText = res.success ? 'Produk berhasil dihapus' : (res.message || 'Gagal hapus produk');
            if (res.success) {
                resetProductForm();
                loadProducts();
            }
        })
        .catch(() => {
            document.getElementById('addprod-msg').innerText = 'Terjadi kesalahan saat menghapus produk.';
        });
    }
}

function cancelEditProduct() {
    resetProductForm();
}

function exportProductsExcel() {
    const productListDiv = document.getElementById('product-list');
    if (!productListDiv) {
        alert('Tabel produk tidak ditemukan.');
        return;
    }
    // Cari tabel produk di dalam div product-list
    const table = productListDiv.querySelector('table');
    if (!table) {
        alert('Tabel produk tidak ditemukan.');
        return;
    }
    let csv = [];
    const rows = table.querySelectorAll('tr');
    for (let row of rows) {
        let cols = row.querySelectorAll('th,td');
        let rowData = [];
        for (let i = 0; i < cols.length; i++) {
            // Exclude the "Aksi" column by checking header text or last column
            if (cols[i].innerText.trim().toLowerCase() === 'aksi' || i === cols.length - 1) continue;
            let data = cols[i].innerText.replace(/,/g, '');
            // Remove "Rp" and "." from price columns (3rd and 4th columns, index 2 and 3)
            if (i === 3 || i === 4) {
                data = data.replace(/Rp/g, '').replace(/\./g, '').trim();
            }
            rowData.push('"' + data + '"');
        }
        csv.push(rowData.join(','));
    }
    let csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    let link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'daftar_produk.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ====== AUTOCOMPLETE PRODUK ====== //
function createProductAutocomplete() {
    const select = document.getElementById('trx-product');
    if (!select) return;

    // Hilangkan jika sudah ada
    if (document.getElementById('trx-product-search')) {
        document.getElementById('trx-product-search').remove();
    }
    if (document.getElementById('trx-product-category')) {
        document.getElementById('trx-product-category').remove();
    }

    // Buat container div untuk search input dan category select
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.marginBottom = '7px';
    container.style.width = '100%';
    select.parentNode.insertBefore(container, select);

    // Buat input search
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Cari Produk...';
    input.id = 'trx-product-search';
    input.style.flexGrow = '1';
    input.style.boxSizing = 'border-box';
    input.autocomplete = 'off';
    container.appendChild(input);

    // Buat select kategori
    const categorySelect = document.createElement('select');
    categorySelect.id = 'trx-product-category';
    categorySelect.style.width = '180px';
    categorySelect.style.boxSizing = 'border-box';
    container.appendChild(categorySelect);

    // Ambil semua produk (option) awal
    let allOptions = [];
    for (let i = 0; i < select.options.length; i++) {
        allOptions.push({
            value: select.options[i].value,
            text: select.options[i].text,
            price: select.options[i].getAttribute('data-price'),
            category: select.options[i].getAttribute('data-category') || ''
        });
    }

    // Fungsi untuk render opsi select berdasarkan filter
    function renderOptions() {
        const keyword = input.value.toLowerCase();
        const selectedCategory = categorySelect.value;
        select.innerHTML = '';
        allOptions.forEach(opt => {
            const matchesKeyword = opt.text.toLowerCase().indexOf(keyword) !== -1;
            const matchesCategory = selectedCategory === '' || opt.category === selectedCategory;
            if (matchesKeyword && matchesCategory) {
                const option = document.createElement('option');
                option.value = opt.value;
                option.text = opt.text;
                option.setAttribute('data-price', opt.price);
                option.setAttribute('data-category', opt.category);
                select.appendChild(option);
            }
        });
        if (select.options.length > 0) {
            select.selectedIndex = 0;
            updateTrxPrice();
        } else {
            document.getElementById('trx-price').value = '';
        }
    }

    // Event listener untuk input search
    input.addEventListener('input', renderOptions);

    // Event listener untuk category select
    categorySelect.addEventListener('change', renderOptions);

    // Reset select jika input dikosongkan dan category dipilih kosong
    input.addEventListener('blur', function() {
        if (this.value.trim() === '' && categorySelect.value === '') {
            select.innerHTML = '';
            allOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.text = opt.text;
                option.setAttribute('data-price', opt.price);
                option.setAttribute('data-category', opt.category);
                select.appendChild(option);
            });
            select.selectedIndex = 0;
            updateTrxPrice();
        }
    });

    // Reset select jika category dipilih kosong dan input kosong
    categorySelect.addEventListener('blur', function() {
        if (this.value === '' && input.value.trim() === '') {
            select.innerHTML = '';
            allOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.text = opt.text;
                option.setAttribute('data-price', opt.price);
                option.setAttribute('data-category', opt.category);
                select.appendChild(option);
            });
            select.selectedIndex = 0;
            updateTrxPrice();
        }
    });

    // Saat select berubah, update harga
    select.onchange = updateTrxPrice;

    // Load categories for categorySelect
    fetch('/api/categories').then(r => r.json()).then(categories => {
        categorySelect.innerHTML = '<option value="">-- Semua Kategori --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    });
}

// Transaksi
function loadTrxProducts() {
    fetch('/api/products').then(r => r.json()).then(products => {
        // Tampilkan semua produk tanpa filter stok
        let opt = products
            .map(p => `<option value="${p.id}" data-price="${p.sell_price}">${p.name}</option>`)
            .join('');
        document.getElementById('trx-product').innerHTML = opt;
        updateTrxPrice();
        createProductAutocomplete(); // Tambahkan fitur autocomplete
    });
}
function updateTrxPrice() {
    let select = document.getElementById('trx-product');
    let price = select.options[select.selectedIndex]?.getAttribute('data-price') || 0;
    document.getElementById('trx-price').value = price ? 'Rp' + Number(price).toLocaleString('id-ID') : '';
}
document.addEventListener('DOMContentLoaded', function() {
    let trxProduct = document.getElementById('trx-product');
    if (trxProduct) {
        trxProduct.onchange = updateTrxPrice;
    }
});

function addTrxItem() {
    let select = document.getElementById('trx-product');
    let prodId = select.value;
    let prodName = select.options[select.selectedIndex]?.text;
    let price = parseInt(select.options[select.selectedIndex]?.getAttribute('data-price'));
    let qty = parseInt(document.getElementById('trx-qty').value);
    if (!prodId || isNaN(qty) || qty < 1) return;
    let exist = trxItems.find(i => i.product_id === prodId);
    if (exist) {
        exist.qty += qty;
    } else {
        trxItems.push({ product_id: prodId, name: prodName, qty, price });
    }
    saveCartToStorage();
    renderTrxItems();
    document.getElementById('trx-msg').innerText = '';
}

// ... kode di atas tetap ...

// ============================
//         TRANSAKSI
// ============================

function renderTrxItems() {
  let tbody = document.querySelector('#trx-items-table tbody');
  tbody.innerHTML = '';
  let total = 0;
  trxItems.forEach((item, i) => {
    let sub = item.qty * item.price;
    total += sub;
    tbody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>
          <input type="number" min="1" value="${item.price}" style="width:100px;text-align:right;"
            onchange="trxEditPrice(${i}, this.value)">
        </td>
        <td>
          <input type="number" min="1" value="${item.qty}" style="width:60px;text-align:center;"
            onchange="trxEditQty(${i}, this.value)">
        </td>
        <td style="text-align:right;">
          Rp${sub.toLocaleString('id-ID')}
        </td>
        <td>
          <button class="btn-small del" onclick="removeTrxItem(${i})">&#128465;</button>
        </td>
      </tr>
    `;
  });
  document.getElementById('trx-total').innerText = 'Rp' + total.toLocaleString('id-ID');
}

// Handler untuk update harga per item di transaksi (nama unik: trxEditPrice)
function trxEditPrice(index, value) {
  let price = parseInt(value);
  if (isNaN(price) || price < 1) price = 1;
  trxItems[index].price = price;
  saveCartToStorage();
  renderTrxItems();
}

// Handler untuk update qty per item di transaksi (nama unik: trxEditQty)
function trxEditQty(index, value) {
  let qty = parseInt(value);
  if (isNaN(qty) || qty < 1) qty = 1;
  trxItems[index].qty = qty;
  saveCartToStorage();
  renderTrxItems();
}

// ... kode lain tetap sama ...
function removeTrxItem(idx) {
    trxItems.splice(idx, 1);
    saveCartToStorage();
    renderTrxItems();
}
// ... kode sebelum submitTrx tetap ...

function submitTrx() {
    if (trxItems.length === 0) {
        document.getElementById('trx-msg').innerText = 'Tidak ada item transaksi!';
        return;
    }
    fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items: trxItems.map(i => ({
                product_id: i.product_id,
                qty: i.qty,
                price: i.price, // harga yang sudah diedit user
                subtotal: i.price * i.qty // subtotal per item
            }))
        })
    })
    .then(r => r.json()).then(res => {
        document.getElementById('trx-msg').innerText = res.success ? 'Transaksi sukses!' : (res.message || 'Gagal transaksi');
        if (res.success) {
            if (editingTransactionId) {
                // Delete old transaction after successful save
                fetch(`/api/transactions/${editingTransactionId}`, { method: 'DELETE' })
                .then(r => r.json())
                .then(delRes => {
                    if (!delRes.success) {
                        alert('Gagal menghapus transaksi lama.');
                    }
                });
                editingTransactionId = null;
            }
            trxItems = [];
            saveCartToStorage();
            renderTrxItems();
            loadTrxList(1); // reload daftar transaksi ke halaman pertama
            loadProducts();
            loadTrxProducts();
            loadLastTrxList(); // refresh 5 transaksi terakhir
        }
    });
}





// ... kode setelah submitTrx tetap ...

// DAFTAR TRANSAKSI: PAGINATION
function loadTrxList(page = 1) {
  trxCurrentPage = page;
  let filterDate = document.getElementById('filter-date')?.value;
  fetch('/api/transactions').then(r => r.json()).then(trx => {
    if (filterDate) {
      trx = trx.filter(t => t.date && t.date.substr(0, 10) === filterDate);
    }
    trx = trx.slice().reverse(); // terbaru di atas
    trxAllData = trx;
    renderTrxTable();
    renderTrxPagination();
  });
}

// ... (kode lain tetap sama di atas)

function toProperCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function renderTrxTable() {
    const columns = [
        { key: 'no', label: 'No' },
        { key: 'date', label: 'Tanggal', format: (val) => (new Date(val)).toLocaleString('id-ID') },
        { key: 'items', label: 'Produk', format: (val) => {
            return val.map(it => `
                <table style="width:100%; border-collapse: collapse; font-size: 13px; margin-bottom: 4px;">
                    <tr>
                        <td style="font-weight:bold; padding: 2px 4px;">${toProperCase(it.name)}</td>
                        <td style="padding: 2px 4px; text-align: center;">x${it.qty}</td>
                        <td style="padding: 2px 4px; color:#888; text-align: right;">@Rp${it.price.toLocaleString('id-ID')}</td>
                        <td style="font-weight:bold; padding: 2px 4px; text-align: right;">Rp${(it.subtotal || it.qty * it.price).toLocaleString('id-ID')}</td>
                    </tr>
                </table>
            `).join('');
        }},
        { key: 'total', label: 'Total', format: (val) => `Rp${val.toLocaleString('id-ID')}` },
        { key: 'actions', label: 'Aksi', style: 'text-align:center;' }
    ];

    let startIdx = (trxCurrentPage - 1) * trxPageSize;
    let pageData = trxAllData.slice(startIdx, startIdx + trxPageSize);

    renderTable('trx-list', columns, pageData, {
        actions: (row) => `
           <div class="aksi-group">
            <button class="btn-small edit" onclick="printTransaction('${row.id}')">🖨️</button>
            <button class="btn-small edit" onclick="loadTransactionToCart('${row.id}')" title="Edit ke Keranjang">&#9998;</button>
            <button class="btn-small edit" onclick="deleteTransaction('${row.id}')">&#128465;</button>
            </div>
        `,
        tableClass: 'user-table',
        pagination: true,
        currentPage: trxCurrentPage,
        pageSize: trxPageSize,
        onPageChange: (page) => {
            trxCurrentPage = page;
            loadTrxList(page);
        }
    });
}

// Tambahkan tombol "Hapus Semua Transaksi" di atas daftar
function renderTrxToolbar() {
  let toolbar = document.getElementById('trx-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'trx-toolbar';
    toolbar.style.marginBottom = '12px';
    document.getElementById('page-daftar').insertBefore(toolbar, document.getElementById('trx-list'));
  }
  toolbar.innerHTML = `
    <button class="del" onclick="deleteAllTransactions()" style="background:#c0392b;">&#128465; Hapus Semua Transaksi</button>
  `;
}

function deleteTransaction(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    .then(r => r.json()).then(res => {
      if (res.success) {
        alert('Transaksi berhasil dihapus.');
        loadTrxList(trxCurrentPage);
        loadLastTrxList();
      } else {
        alert(res.message || 'Gagal menghapus transaksi.');
      }
    });
}

function deleteAllTransactions() {
  if (!confirm('Hapus semua transaksi?')) return;
  fetch('/api/transactions', { method: 'DELETE' })
    .then(r => r.json()).then(res => {
      if (res.success) {
        alert('Semua transaksi berhasil dihapus.');
        loadTrxList(1);
        loadLastTrxList();
      } else {
        alert(res.message || 'Gagal menghapus semua transaksi.');
      }
    });
}

// Modifikasi loadTrxList agar toolbar tampil
function loadTrxList(page = 1) {
  trxCurrentPage = page;
  let filterDate = document.getElementById('filter-date')?.value;
  fetch('/api/transactions').then(r => r.json()).then(trx => {
    if (filterDate) {
      trx = trx.filter(t => t.date && t.date.substr(0, 10) === filterDate);
    }
    trx = trx.slice().reverse(); // terbaru di atas
    trxAllData = trx;
    renderTrxToolbar(); // <-- tambahkan ini
    renderTrxTable();
    renderTrxPagination();
  });
}

// ... (kode lain tetap sama)

function printTransaction(trxId) {
  // Cari transaksi berdasarkan id dari semua data transaksi yang sudah di-load
  const trx = trxAllData.find(t => String(t.id) === String(trxId));
  if (!trx) return alert('Transaksi tidak ditemukan!');
  // ... existing printTransaction code ...
}

// New function to load transaction items back to cart for editing
function loadTransactionToCart(trxId) {
    const trx = trxAllData.find(t => String(t.id) === String(trxId));
    if (!trx) {
        alert('Transaksi tidak ditemukan!');
        return;
    }
    editingTransactionId = trxId; // Set editing transaction id
    trxItems = trx.items.map(item => {
        let price = item.price;
        if (!price || price === 0) {
            // fallback to product sell_price if price missing or zero
            const prod = productAllData.find(p => String(p.id) === String(item.product_id));
            price = prod ? prod.sell_price : 0;
        }
        return {
            product_id: item.product_id || item.id || '', // fallback if product_id missing
            name: item.name,
            qty: item.qty,
            price: price
        };
    });
    saveCartToStorage();
    renderTrxItems();
    showPage('transaksi');
}

// Recreate printTransaction function to restore print button functionality
function printTransaction(trxId) {
    const trx = trxAllData.find(t => String(t.id) === String(trxId));
    if (!trx) return alert('Transaksi tidak ditemukan!');

    function toProperCase(str) {
        return str.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    let html = `
    <html>
    <head>
      <title>Print Transaksi #${trx.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin:24px; color:#222; }
        .struk-container { max-width: 380px; margin: 0 auto; }
        h2 { text-align: center; margin-bottom: 16px; }
        .info { margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { padding: 5px 8px; border: 1px solid #ccc; font-size: 14px; }
        th { background: #f4f4f4; }
        .right { text-align: right; }
        tfoot th { background: #fff; font-size: 16px; }
        .footer { text-align: center; font-size: 13px; margin-top: 20px; color: #555; }
        @media print {
          button { display: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
    <div class="struk-container">
      <h2>Struk Transaksi</h2>
      <div class="info">
        <b>ID:</b> ${trx.id}<br>
        <b>Tanggal:</b> ${(new Date(trx.date)).toLocaleString('id-ID')}
      </div>
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
  `;
    trx.items.forEach(it => {
        html += `<tr>
      <td>${toProperCase(it.name)}</td>
      <td class="right">${it.qty}</td>
      <td class="right">Rp${it.price.toLocaleString('id-ID')}</td>
      <td class="right">Rp${(it.subtotal || it.qty * it.price).toLocaleString('id-ID')}</td>
    </tr>`;
    });
    html += `
        </tbody>
        <tfoot>
          <tr>
            <th colspan="3" class="right">Total</th>
            <th class="right">Rp${trx.total.toLocaleString('id-ID')}</th>
          </tr>
        </tfoot>
      </table>
      <button onclick="window.print()">Print</button>
      <div class="footer">
        Terima kasih telah berbelanja!<br>
        <span style="font-size:12px;">POS Kasirku &copy; 2025</span>
      </div>
    </div>
    </body>
    </html>
  `;
    let win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(html);
    win.document.close();
}

function renderTrxPagination() {
  let total = trxAllData.length;
  let pageCount = Math.ceil(total / trxPageSize);

  // Hapus pagination lama jika ada
  document.getElementById('trx-pagination')?.remove();

  if (pageCount <= 1) return;

  let html = `<div id="trx-pagination" class="trx-pagination">`;
  html += `<button onclick="loadTrxList(1)" ${trxCurrentPage === 1 ? "disabled" : ""}>&laquo;</button>`;
  html += `<button onclick="loadTrxList(${trxCurrentPage-1})" ${trxCurrentPage === 1 ? "disabled" : ""}>&lt;</button>`;

  // Tampilkan max 5 tombol halaman
  let start = Math.max(1, trxCurrentPage - 2);
  let end = Math.min(pageCount, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) {
    html += `<button onclick="loadTrxList(${i})" ${trxCurrentPage === i ? "class='active'" : ""}>${i}</button>`;
  }

  html += `<button onclick="loadTrxList(${trxCurrentPage+1})" ${trxCurrentPage === pageCount ? "disabled" : ""}>&gt;</button>`;
  html += `<button onclick="loadTrxList(${pageCount})" ${trxCurrentPage === pageCount ? "disabled" : ""}>&raquo;</button>`;
  html += `</div>`;

  document.getElementById('trx-list').insertAdjacentHTML('afterend', html);
}

// Reset filter tanggal dan reload ke halaman 1
function resetFilterTrx() {
  document.getElementById('filter-date').value = '';
  loadTrxList(1);
}

// Onload
window.onload = function() {
    const session = loadSession();
    if (session && session.username && session.role) {
        currentUser = session;
        showDashboard();
        // Load cart from localStorage and render
        trxItems = loadCartFromStorage();
        renderTrxItems();
    } else {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login').style.display = '';
    }
};
