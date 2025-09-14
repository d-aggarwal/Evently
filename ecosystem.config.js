module.exports = {
  apps: [
    {
      name: 'evently-backend',
      script: 'src/app.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      increment_var: 'PORT',
      // Performance monitoring
      monitoring: false,
      
      // Auto restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Force different ports for each instance
      env_0: { PORT: 3000 },
      env_1: { PORT: 3001 },
      env_2: { PORT: 3002 },
      env_3: { PORT: 3003 }
    }
  ]
};
