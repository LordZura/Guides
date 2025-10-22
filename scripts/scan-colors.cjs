#!/usr/bin/env node
/**
 * Color Migration Scanner
 * 
 * Scans the codebase for hard-coded color values and reports them.
 * This helps identify components that still need migration to the theme token system.
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for
const COLOR_PATTERNS = [
  /color:\s*["'](?:gray|blue|red|green|yellow|purple|pink|orange|teal|cyan)\.\d+["']/g,
  /bg:\s*["'](?:gray|blue|red|green|yellow|purple|pink|orange|teal|cyan)\.\d+["']/g,
  /borderColor:\s*["'](?:gray|blue|red|green|yellow|purple|pink|orange|teal|cyan)\.\d+["']/g,
  /colorScheme=["']primary["']/g,
  /#[0-9a-fA-F]{3,6}/g,
];

const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', 'build'];
const INCLUDE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

function scanDirectory(dir, results = {}) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        scanDirectory(fullPath, results);
      }
    } else if (INCLUDE_EXTENSIONS.some(ext => item.endsWith(ext))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = [];
      
      for (const pattern of COLOR_PATTERNS) {
        const found = content.match(pattern);
        if (found) {
          matches.push(...found);
        }
      }
      
      if (matches.length > 0) {
        results[fullPath] = [...new Set(matches)]; // Remove duplicates
      }
    }
  }
  
  return results;
}

function main() {
  const srcDir = path.join(__dirname, '../src');
  console.log('🔍 Scanning for hard-coded colors...\n');
  
  const results = scanDirectory(srcDir);
  const fileCount = Object.keys(results).length;
  
  if (fileCount === 0) {
    console.log('✅ No hard-coded colors found!\n');
    return;
  }
  
  console.log(`📊 Found hard-coded colors in ${fileCount} files:\n`);
  
  for (const [file, colors] of Object.entries(results)) {
    const relativePath = path.relative(srcDir, file);
    console.log(`📄 ${relativePath}`);
    colors.forEach(color => console.log(`   - ${color}`));
    console.log('');
  }
  
  console.log('\n💡 Migration suggestions:');
  console.log('   - Replace "primary" colorScheme with "secondary"');
  console.log('   - Use useColorModeValue for light/dark variants');
  console.log('   - Use semantic tokens: textColor, mutedColor, borderColor');
  console.log('   - Replace gray backgrounds with "primary.600" (dark) / "white" (light)');
  console.log('');
}

main();
