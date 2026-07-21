const fs = require('fs');
let code = fs.readFileSync('src/screens/SignUp.tsx', 'utf8');
code = code.replace(/const \[email: email\.trim\(\)\.toLowerCase\(\),\s*password, setPassword\]/g, 'const [password, setPassword]');
fs.writeFileSync('src/screens/SignUp.tsx', code);
