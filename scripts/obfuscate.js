#!/usr/bin/env node

/**
 * Simple Node.js script to obfuscate a JavaScript file using javascript-obfuscator.
 * Usage: node scripts/obfuscate.js input.js output.js
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

if (process.argv.length < 4) {
    console.error('Usage: node scripts/obfuscate.js <input_file> <output_file>');
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!fs.existsSync(inputFile)) {
    console.error(`Input file does not exist: ${inputFile}`);
    process.exit(1);
}

const inputCode = fs.readFileSync(inputFile, 'utf-8');

const obfuscationResult = JavaScriptObfuscator.obfuscate(
    inputCode,
    {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        debugProtection: true,
        disableConsoleOutput: true,
        stringArrayEncoding: ['rc4'],
        rotateStringArray: true,
        selfDefending: true,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
    }
);

fs.writeFileSync(outputFile, obfuscationResult.getObfuscatedCode(), 'utf-8');

console.log(`Obfuscated code written to ${outputFile}`);
