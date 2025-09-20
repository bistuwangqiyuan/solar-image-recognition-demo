#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动光伏图像识别演示网站...\n');

// 检查环境变量文件
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 创建环境变量文件...');
  const envExample = fs.readFileSync(path.join(__dirname, 'env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  console.log('✅ 环境变量文件已创建，请根据需要修改 .env 文件\n');
}

// 启动开发服务器
console.log('🔧 启动开发服务器...');
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...');
  devProcess.kill('SIGTERM');
  process.exit(0);
});

// 处理错误
devProcess.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

devProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ 服务器异常退出，退出码: ${code}`);
    process.exit(code);
  }
});

