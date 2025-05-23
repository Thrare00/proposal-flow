const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findTypeScriptErrors() {
  const files = fs.readdirSync(srcDir);
  
  for (const file of files) {
    const fullPath = path.join(srcDir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      checkDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

function checkDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      checkDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`Checking ${file}`);
  } catch (error) {
    console.error(`Error checking ${file}: ${error.message}`);
  }
}

findTypeScriptErrors();
