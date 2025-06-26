import { execSync } from 'child_process';
import { existsSync } from 'fs';

try {
  console.log('Checking for dist directory...');
  if (existsSync('dist')) {
    console.log('Cleaning dist directory...');
    execSync('if exist dist rmdir /s /q dist');
  } else {
    console.log('dist directory does not exist, skipping cleanup');
  }

  console.log('\nBuilding project...');
  console.log('Running npm build...');
  
  // Run npm list to check installed packages
  console.log('\nChecking installed packages...');
  execSync('npm list @vitejs/plugin-react-swc vite', { stdio: 'inherit' });

  // Run npm build with detailed logging
  console.log('\nRunning npm build with detailed logging...');
  execSync('npm run build -- --debug', { stdio: 'inherit' });

  console.log('\nBuild completed successfully!');
  console.log('Checking build output...');
  if (existsSync('dist')) {
    console.log('Build output directory exists');
    console.log('Files in dist directory:');
    execSync('dir dist', { stdio: 'inherit' });
  } else {
    console.log('Warning: Build output directory not found');
  }
} catch (error) {
  console.error('\nBuild failed:', error.message);
  if (error.stderr) {
    console.error('Error details:', error.stderr.toString());
  }
  console.error('Full error stack:', error.stack);
  process.exit(1);
}
