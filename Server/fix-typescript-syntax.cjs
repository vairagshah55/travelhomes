const fs = require('fs');
const path = require('path');

// Function to recursively find all .js files
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') && !file.includes('node_modules')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to clean TypeScript syntax from content
function cleanTypeScriptSyntax(content) {
  // Remove type annotations in function parameters like (val: any)
  content = content.replace(/\(([^)]*?):\s*[^)]+\)/g, '($1)');
  
  // Remove type annotations in variable declarations like const x: type =
  content = content.replace(/:\s*[A-Za-z][A-Za-z0-9<>[\]|&\s]*(?=\s*[=;,)])/g, '');
  
  // Remove function return type annotations like ): type {
  content = content.replace(/\):\s*[A-Za-z][A-Za-z0-9<>[\]|&\s]*(?=\s*[{])/g, ')');
  
  // Remove as type assertions
  content = content.replace(/\s+as\s+[A-Za-z][A-Za-z0-9<>[\]|&\s]*/g, '');
  
  // Remove interface imports
  content = content.replace(/import\s+type\s+[^;]+;/g, '');
  content = content.replace(/,\s*type\s+[^}]+/g, '');
  
  // Remove generic type parameters in function calls
  content = content.replace(/\.<[^>]+>/g, '');
  
  // Remove type annotations after destructuring
  content = content.replace(/}\s*:\s*[^=;]+/g, '}');
  
  // Clean up any remaining : any patterns
  content = content.replace(/:\s*any\b/g, '');
  
  // Clean up type imports from require statements
  content = content.replace(/const\s*{\s*[^}]*:\s*[^}]*}\s*=/g, (match) => {
    return match.replace(/:\s*[^,}]+/g, '');
  });
  
  // Remove type annotations in arrow functions
  content = content.replace(/\(\s*([^)]+):\s*[^)]+\s*\)/g, '($1)');
  
  // Fix malformed lines (everything on one line)
  if (content.includes(';const ') || content.includes(';function ')) {
    content = content.replace(/;(?=const |function |let |var |class )/g, ';\n');
  }
  
  return content;
}

// Main execution
const jsFiles = findJSFiles('.');
let fixedCount = 0;

console.log(`Found ${jsFiles.length} JavaScript files to check...`);

jsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = cleanTypeScriptSyntax(content);
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✓ Fixed TypeScript syntax in: ${filePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Fixed TypeScript syntax in ${fixedCount} files!`);