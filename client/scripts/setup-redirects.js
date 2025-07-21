const fs = require('fs');
const path = require('path');

// Create a custom _redirects file during build
const redirectsContent = `/api/* http://gamelist-env.eba-tku47f7i.us-east-1.elasticbeanstalk.com/api/:splat 200
/* /index.html 200`;

const buildDir = path.join(__dirname, '../build');
const redirectsPath = path.join(buildDir, '_redirects');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write the redirects file
fs.writeFileSync(redirectsPath, redirectsContent);
console.log('✅ _redirects file created successfully');
