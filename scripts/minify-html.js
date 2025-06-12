#!/usr/bin/env node

/**
 * Simple Node.js script to minify an HTML file using html-minifier.
 * Usage: node scripts/minify-html.js input.html output.html
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier');

if (process.argv.length < 4) {
    console.error('Usage: node scripts/minify-html.js <input_file> <output_file>');
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!fs.existsSync(inputFile)) {
    console.error(`Input file does not exist: ${inputFile}`);
    process.exit(1);
}

const inputHtml = fs.readFileSync(inputFile, 'utf-8');

const minifiedHtml = minify(inputHtml, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    useShortDoctype: true,
    removeAttributeQuotes: true,
    removeOptionalTags: true
});

fs.writeFileSync(outputFile, minifiedHtml, 'utf-8');

console.log(`Minified HTML written to ${outputFile}`);
