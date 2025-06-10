const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.json());

// Fungsi dasar baca/tulis db
function readDB(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeDB(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// GET semua user (tidak kirim password hash)
app.get('/api/users', (req, res) => {
    const users = readDB('./db/users.json');
    res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

// TAMBAH user
app.post('/api/users', (req, res) => {
    let users = readDB('./db/users.json');
    if (users.find(u => u.username === req.body.username)) {
        return res.json({ success: false, message: 'Username sudah ada' });
    }
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const hash = bcrypt.hashSync(req.body.password, 10);
    users.push({ id, username: req.body.username, password: hash, role: req.body.role });
    writeDB('./db/users.json', users);
    res.json({ success: true });
});

// EDIT user
app.put('/api/users/:id', (req, res) => {
    let users = readDB('./db/users.json');
    let user = users.find(u => u.id == req.params.id);
    if (!user) return res.json({ success: false, message: 'User tidak ditemukan' });
    if (req.body.password) user.password = bcrypt.hashSync(req.body.password, 10);
    user.role = req.body.role;
    writeDB('./db/users.json', users);
    res.json({ success: true });
});

// HAPUS user
app.delete('/api/users/:id', (req, res) => {
    if (String(req.params.id) === '1') {
        return res.json({ success: false, message: 'User utama tidak boleh dihapus.' });
    }
    let users = readDB('./db/users.json');
    const idx = users.findIndex(u => u.id == req.params.id);
    if (idx < 0) return res.json({ success: false, message: 'User tidak ditemukan' });
    users.splice(idx, 1);
    writeDB('./db/users.json', users);
    res.json({ success: true });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readDB('./db/users.json');
    const user = users.find(u => u.username === username);
    if (user && bcrypt.compareSync(password, user.password)) {
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
        res.json({ success: false, message: 'Username/password salah' });
    }
});

// Ambil data produk
app.get('/api/products', (req, res) => {
    res.json(readDB('./db/products.json'));
});

// Tambah produk
app.post('/api/products', (req, res) => {
    let products = [];
    try {
        products = readDB('./db/products.json');
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Gagal membaca database produk.' });
    }

    const { name, buy_price, sell_price, stock, category } = req.body;
    if (typeof name !== 'string' || name.trim() === '') {
        return res.json({ success: false, message: 'Nama produk wajib diisi.' });
    }

    let newId = 1;
    if (products.length > 0) {
        newId = Math.max(...products.map(p => Number(p.id))) + 1;
    }

    const newProduct = {
        id: newId,
        name,
        buy_price: buy_price !== undefined ? parseInt(buy_price) || 0 : 0,
        sell_price: sell_price !== undefined ? parseInt(sell_price) || 0 : 0,
        stock: stock !== undefined ? parseInt(stock) || 0 : 0,
        category: typeof category === 'string' ? category.trim() : ''
    };

    products.push(newProduct);

    try {
        writeDB('./db/products.json', products);
        res.json({ success: true, product: newProduct });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan produk.' });
    }
});

// Update produk
app.put('/api/products/:id', (req, res) => {
    let products = [];
    try {
        products = readDB('./db/products.json');
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Gagal membaca database produk.' });
    }

    const idx = products.findIndex(p => String(p.id) === String(req.params.id));
    if (idx === -1) {
        return res.json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const { name, buy_price, sell_price, stock, category } = req.body;
    if (typeof name !== 'string' || name.trim() === '') {
        return res.json({ success: false, message: 'Nama produk wajib diisi.' });
    }

    products[idx].name = name;
    if (buy_price !== undefined) products[idx].buy_price = parseInt(buy_price) || 0;
    if (sell_price !== undefined) products[idx].sell_price = parseInt(sell_price) || 0;
    if (stock !== undefined) products[idx].stock = parseInt(stock) || 0;
    if (category !== undefined) products[idx].category = typeof category === 'string' ? category.trim() : '';

    try {
        writeDB('./db/products.json', products);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan produk.' });
    }
});

// Hapus produk
app.delete('/api/products/:id', (req, res) => {
    let products = readDB('./db/products.json');
    const index = products.findIndex(p => String(p.id) === String(req.params.id));
    if (index === -1) {
        return res.json({ success: false, message: 'Produk tidak ditemukan' });
    }
    products.splice(index, 1);
    writeDB('./db/products.json', products);
    res.json({ success: true });
});

// Ambil transaksi
app.get('/api/transactions', (req, res) => {
    let transactions = [];
    try {
        transactions = readDB('./db/transactions.json');
    } catch (e) {}
    res.json(transactions);
});

// Tambah transaksi (LOGIKA BARU: harga edit atau database)
app.post('/api/transactions', (req, res) => {
    let products = readDB('./db/products.json');
    let transactions = [];
    try {
        transactions = readDB('./db/transactions.json');
    } catch (e) {}

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, message: 'Item transaksi tidak boleh kosong.' });
    }

    // Validasi stok & hitung total
    let total = 0;
    let detail = [];
    for (let item of items) {
        const prod = products.find(p => String(p.id) === String(item.product_id));
        if (!prod) return res.json({ success: false, message: `Produk dengan id ${item.product_id} tidak ditemukan.` });
        // Hapus validasi stok agar transaksi tetap bisa disimpan walau stok kurang
        // if (prod.stock < item.qty) return res.json({ success: false, message: `Stok produk ${prod.name} kurang.` });

        // LOGIKA: Pakai harga keranjang jika berbeda dari database, jika tidak pakai harga database
        let finalPrice = parseInt(prod.sell_price);
        if (item.price !== undefined && parseInt(item.price) !== parseInt(prod.sell_price)) {
            finalPrice = parseInt(item.price);
        }
        const subtotal = finalPrice * item.qty;
        total += subtotal;
        detail.push({
            product_id: item.product_id,
            name: prod.name,
            qty: item.qty,
            price: finalPrice,
            subtotal
        });
    }

    // Update stok
    for (let item of items) {
        const prod = products.find(p => String(p.id) === String(item.product_id));
        prod.stock -= item.qty;
    }
    writeDB('./db/products.json', products);

    // Simpan transaksi
    const newId = transactions.length > 0 ? Math.max(...transactions.map(t=>t.id)) + 1 : 1;
    const trx = {
        id: newId,
        date: new Date().toISOString(),
        items: detail,
        total
    };
    transactions.push(trx);
    writeDB('./db/transactions.json', transactions);
    res.json({ success: true, transaction: trx });
});

// Hapus satu transaksi
app.delete('/api/transactions/:id', (req, res) => {
    let transactions = [];
    try {
        transactions = readDB('./db/transactions.json');
    } catch (e) {}
    const idx = transactions.findIndex(t => String(t.id) === String(req.params.id));
    if (idx === -1) {
        return res.json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }
    transactions.splice(idx, 1);
    writeDB('./db/transactions.json', transactions);
    res.json({ success: true });
});

// Hapus semua transaksi
app.delete('/api/transactions', (req, res) => {
    try {
        writeDB('./db/transactions.json', []);
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: 'Gagal menghapus semua transaksi.' });
    }
});

// Hapus semua produk
app.delete('/api/products', (req, res) => {
    try {
        writeDB('./db/products.json', []);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal menghapus semua produk.' });
    }
});

// Category API

// Ambil semua kategori
app.get('/api/categories', (req, res) => {
    let categories = [];
    try {
        categories = readDB('./db/categories.json');
    } catch (e) {}
    res.json(categories);
});

// Tambah kategori
app.post('/api/categories', (req, res) => {
    let categories = [];
    try {
        categories = readDB('./db/categories.json');
    } catch (e) {}

    const { name } = req.body;
    if (typeof name !== 'string' || name.trim() === '') {
        return res.json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    let newId = 1;
    if (categories.length > 0) {
        newId = Math.max(...categories.map(c => Number(c.id))) + 1;
    }

    const newCategory = {
        id: newId,
        name: name.trim()
    };

    categories.push(newCategory);

    try {
        writeDB('./db/categories.json', categories);
        res.json({ success: true, category: newCategory });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan kategori.' });
    }
});

// Update kategori
app.put('/api/categories/:id', (req, res) => {
    let categories = [];
    try {
        categories = readDB('./db/categories.json');
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Gagal membaca database kategori.' });
    }

    const idx = categories.findIndex(c => String(c.id) === String(req.params.id));
    if (idx === -1) {
        return res.json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const { name } = req.body;
    if (typeof name !== 'string' || name.trim() === '') {
        return res.json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    categories[idx].name = name.trim();

    try {
        writeDB('./db/categories.json', categories);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan kategori.' });
    }
});

// Hapus kategori
app.delete('/api/categories/:id', (req, res) => {
    let categories = [];
    try {
        categories = readDB('./db/categories.json');
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Gagal membaca database kategori.' });
    }
    const index = categories.findIndex(c => String(c.id) === String(req.params.id));
    if (index === -1) {
        return res.json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    categories.splice(index, 1);
    try {
        writeDB('./db/categories.json', categories);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Gagal menghapus kategori.' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`POS app listening at http://localhost:${PORT}`);
});