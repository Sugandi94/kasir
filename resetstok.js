const fs = require('fs');
const path = './db/products.json';

// Baca data JSON dari file
let products = JSON.parse(fs.readFileSync(path, 'utf-8'));

// Ubah semua stok menjadi 0
products = products.map(product => ({
  ...product,
  stock: 0
}));

// Simpan kembali ke file
fs.writeFileSync(path, JSON.stringify(products, null, 2));

console.log('✅ Semua stok berhasil di-set ke 0!');
