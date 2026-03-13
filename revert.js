const { execSync } = require('child_process');
const cwd = 'f:\\nextern';

try {
  // Revert all tracked file changes
  execSync('git checkout -- .', { cwd, stdio: 'inherit' });
  console.log('Reverted tracked files.');

  // Remove untracked files created by the changes
  execSync('git clean -fd src/components/layout/', { cwd, stdio: 'inherit' });
  console.log('Cleaned untracked files.');

  // Show status
  const status = execSync('git --no-pager status', { cwd }).toString();
  console.log(status);
} catch (e) {
  console.error('Error:', e.message);
}
