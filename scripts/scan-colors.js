#!/usr/bin/env node

/**
 * Color Scanner - Identifies hard-coded color values in the codebase
 * 
 * This script scans TypeScript/JavaScript files for:
 * - Hex colors (#fff, #ffffff)
 * - Chakra color tokens (gray.700, blue.500, etc.)
 * - RGB/RGBA values
 * 
 * Output: List of files with hard-coded colors and suggestions for migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const excludeDirs = ['node_modules', '.git', 'dist', 'build'];
const includeExtensions = ['.tsx', '.ts', '.jsx', '.js'];

// Patterns to detect
const patterns = {
  hex: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g,
  chakraColors: /\b(gray|blue|red|green|yellow|orange|purple|pink|teal|cyan)\.\d{2,3}\b/g,
  rgb: /rgba?\([^)]+\)/g,
};

// Whitelist - acceptable color uses
const whitelist = [
  'currentColor',
  'transparent',
  'inherit',
  'primary',
  'secondary',
  'highlight',
  '--color-primary',
  '--color-secondary',
  '--color-highlight',
];

const results = {
  hex: new Map(),
  chakraColors: new Map(),
  rgb: new Map(),
};

function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath);
  return includeExtensions.includes(ext);
}

function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return excludeDirs.includes(dirName);
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(srcDir, filePath);
  
  Object.entries(patterns).forEach(([type, pattern]) => {
    const matches = content.match(pattern);
    if (matches) {
      const uniqueMatches = [...new Set(matches)];
      
      // Filter out whitelisted items
      const filteredMatches = uniqueMatches.filter(match => 
        !whitelist.some(wl => match.includes(wl))
      );
      
      if (filteredMatches.length > 0) {
        if (!results[type].has(relativePath)) {
          results[type].set(relativePath, []);
        }
        results[type].get(relativePath).push(...filteredMatches);
      }
    }
  });
}

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (!shouldExcludeDir(fullPath)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && shouldIncludeFile(fullPath)) {
      scanFile(fullPath);
    }
  });
}

function printResults() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  Dark Mode Token Migration - Color Scan Results');
  console.log('════════════════════════════════════════════════════════\n');
  
  let totalIssues = 0;
  
  Object.entries(results).forEach(([type, fileMap]) => {
    if (fileMap.size > 0) {
      console.log(`\n📍 ${type.toUpperCase()} Colors Found:\n`);
      console.log('─'.repeat(60));
      
      fileMap.forEach((colors, file) => {
        console.log(`\n  ${file}`);
        colors.forEach(color => {
          console.log(`    ➜ ${color}`);
          totalIssues++;
        });
      });
      
      console.log('\n');
    }
  });
  
  console.log('─'.repeat(60));
  console.log(`\nTotal color references found: ${totalIssues}\n`);
  
  // Migration suggestions
  console.log('🔧 MIGRATION GUIDE:\n');
  console.log('  Chakra Color Tokens → Theme Tokens:');
  console.log('    gray.700, gray.800  → bg="primary.600" or bg="surface"');
  console.log('    gray.600, gray.500  → color="textSecondary"');
  console.log('    gray.200, gray.100  → borderColor="borderColor"');
  console.log('    blue.500, blue.600  → colorScheme="secondary"');
  console.log('    white, gray.50      → color="highlight.50"');
  console.log('');
  console.log('  Hex Colors → CSS Variables:');
  console.log('    #000, #0b0b0b       → var(--color-primary)');
  console.log('    #2195eb, #1e88e5    → var(--color-secondary)');
  console.log('    #fff, #ffffff       → var(--color-highlight)');
  console.log('');
  console.log('  For non-Chakra components (charts, raw CSS):');
  console.log('    Use CSS variables directly in your styles');
  console.log('    Example: color: var(--color-highlight);');
  console.log('');
  console.log('════════════════════════════════════════════════════════\n');
}

// Run scan
console.log('Scanning source files...');
scanDirectory(srcDir);
printResults();
