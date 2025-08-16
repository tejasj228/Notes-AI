#!/usr/bin/env node

/**
 * Development setup script for Notes-AI Backend
 * This script helps set up the development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Notes-AI Backend Development Environment\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created! Please update it with your configuration.');
  } else {
    console.log('❌ .env.example not found');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check Node.js version
console.log('\n🔍 Checking Node.js version...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  if (majorVersion < 18) {
    console.log('⚠️  Warning: Node.js 18+ is recommended');
  }
} catch (error) {
  console.log('❌ Node.js not found');
}

// Check MongoDB connection
console.log('\n🔍 Checking MongoDB...');
try {
  execSync('mongosh --version', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ MongoDB CLI found');
} catch (error) {
  console.log('⚠️  MongoDB CLI not found. Make sure MongoDB is installed and running.');
}

// Install dependencies if needed
console.log('\n📦 Checking dependencies...');
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update .env file with your configuration');
console.log('2. Make sure MongoDB is running');
console.log('3. Run: npm run dev');
console.log('\n🔗 Useful commands:');
console.log('- npm run dev        # Start development server');
console.log('- npm start          # Start production server');
console.log('- npm test           # Run tests');
console.log('\n📚 Documentation: See README.md for API documentation');
