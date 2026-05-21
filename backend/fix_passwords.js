const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
const files = walk('src/__tests__');
files.forEach(file => {
  if (!file.endsWith('.ts')) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/password:\s*['"](.*?)['"]/g, (match, p1) => {
    if (p1.length < 6) return "password: 'hashedpassword'";
    return match;
  });
  fs.writeFileSync(file, content);
});
