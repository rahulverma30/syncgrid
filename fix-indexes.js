const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.ts'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regexes to match the exact duplicates
  content = content.replace(
    /^.*\.index\(\s*\{\s*companyId:\s*1,\s*createdAt:\s*-1\s*\}\s*\);?\s*$/gm,
    ''
  );
  content = content.replace(
    /^.*\.index\(\s*\{\s*companyId:\s*1,\s*status:\s*1\s*\}\s*\);?\s*$/gm,
    ''
  );
  content = content.replace(
    /^.*\.index\(\s*\{\s*companyId:\s*1,\s*isArchived:\s*1\s*\}\s*\);?\s*$/gm,
    ''
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`Fixed duplicates in ${file}`);
  }
}

console.log(`Total files fixed: ${totalFixed}`);
