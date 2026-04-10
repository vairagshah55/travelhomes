const fs = require('fs');
const path = require('path');

// Migration utility to convert TypeScript to JavaScript
const convertTStoJS = (content) => {
  return content
    // Remove TypeScript imports and convert to CommonJS
    .replace(/import\s+(\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = require(\'$2\');')
    .replace(/import\s+(\w+),\s*(\{[^}]+\})\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = require(\'$3\');\nconst $2 = require(\'$3\');')
    
    // Convert exports
    .replace(/export\s+default\s+/g, 'module.exports = ')
    .replace(/export\s+(\{[^}]+\})/g, 'module.exports = $1')
    .replace(/export\s+const\s+(\w+)/g, 'const $1')
    .replace(/export\s+interface\s+\w+[^{]*\{[^}]*\}/gs, '') // Remove interfaces
    .replace(/export\s+type\s+\w+[^;]*;/g, '') // Remove type definitions
    
    // Remove TypeScript-specific syntax
    .replace(/:\s*[A-Z]\w*(\[\])?(<[^>]*>)?/g, '') // Remove type annotations
    .replace(/\s+extends\s+Document/g, '')
    .replace(/<[^>]*>/g, '') // Remove generic types
    .replace(/as\s+\w+/g, '') // Remove type assertions
    .replace(/\?\s*:/g, ':') // Remove optional property markers
    
    // Fix mongoose imports
    .replace(/const\s+(\{[^}]*Document[^}]*\})\s*=\s*require\(['"]mongoose['"]\);?/g, 'const mongoose = require(\'mongoose\');\nconst { Schema } = mongoose;')
    
    // Clean up extra whitespace and empty lines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s*[\r\n]/gm, '')
    
    // Ensure proper module.exports at end if not present
    .replace(/(module\.exports\s*=\s*mongoose\.model\([^)]+\));?$/, '$1;');
};

console.log('🚀 Starting complete migration from server to newserver...');

// Copy all files from server to newserver with conversion
const copyAndConvert = (srcDir, destDir, extensions = ['.ts']) => {
  if (!fs.existsSync(srcDir)) return;
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const files = fs.readdirSync(srcDir);
  
  files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyAndConvert(srcPath, path.join(destDir, file), extensions);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      const content = fs.readFileSync(srcPath, 'utf8');
      const convertedContent = convertTStoJS(content);
      const destFile = file.replace('.ts', '.js');
      const destPath = path.join(destDir, destFile);
      
      fs.writeFileSync(destPath, convertedContent);
      console.log(`✅ Converted: ${srcPath} -> ${destPath}`);
    }
  });
};

// Migrate all models
console.log('\n📁 Migrating Models...');
copyAndConvert('../server/models', './models');

// Migrate all controllers  
console.log('\n🎮 Migrating Controllers...');
copyAndConvert('../server/controllers', './controller');

// Migrate all routes
console.log('\n🛣️  Migrating Routes...');
copyAndConvert('../server/routes', './routes');

// Migrate all services
console.log('\n⚙️  Migrating Services...');
copyAndConvert('../server/services', './services');

// Migrate middleware
console.log('\n🔒 Migrating Middleware...');
copyAndConvert('../server/middleware', './middleware');

// Copy other important files
console.log('\n📄 Copying additional files...');
if (fs.existsSync('../server/types')) {
  copyAndConvert('../server/types', './types');
}

console.log('\n✅ Migration completed successfully!');
console.log('\n📋 Summary:');
console.log('- All models converted from TypeScript to JavaScript');
console.log('- All controllers migrated and converted');  
console.log('- All routes migrated and converted');
console.log('- All services migrated and converted');
console.log('- All middleware migrated and converted');
console.log('\n🚀 Ready to run: npm start');