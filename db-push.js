require('dotenv').config();
const { execSync } = require('child_process');

try {
    execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
    console.log('DB Push completed');
} catch (error) {
    console.error('DB Push failed');
    process.exit(1);
}
