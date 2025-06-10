const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, 'db/products.json');
const categoriesFile = path.join(__dirname, 'db/categories.json');

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function updateProductCategories() {
    const products = readJSON(productsFile);
    const categories = readJSON(categoriesFile);

    // Map category names for quick lookup (lowercase)
    const categoryNames = categories.map(c => c.name.toLowerCase());

    // Simple heuristic to assign category based on product name containing category name
    products.forEach(product => {
        let assignedCategory = '';
        for (const catName of categoryNames) {
            if (product.name.toLowerCase().includes(catName)) {
                assignedCategory = catName;
                break;
            }
        }
        product.category = assignedCategory ? assignedCategory.charAt(0).toUpperCase() + assignedCategory.slice(1) : '';
    });

    writeJSON(productsFile, products);
    console.log('Product categories updated successfully.');
}

updateProductCategories();
