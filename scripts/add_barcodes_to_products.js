const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '..', 'db', 'products.json');

function addBarcodeToProducts() {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf-8');
    const products = JSON.parse(data);

    // Add barcode field if missing, initialize with empty string or generate a default barcode
    const updatedProducts = products.map(product => {
      if (!product.hasOwnProperty('barcode')) {
        // You can customize barcode generation logic here
        // For now, set barcode as empty string
        product.barcode = '';
      }
      return product;
    });

    fs.writeFileSync(productsFilePath, JSON.stringify(updatedProducts, null, 2), 'utf-8');
    console.log('Barcodes added to products successfully.');
  } catch (error) {
    console.error('Error updating products with barcode:', error);
  }
}

addBarcodeToProducts();
