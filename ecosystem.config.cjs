module.exports = {
  apps: [
    {
      name: 'master-api',
      script: 'pnpm',
      args: '--filter @saas/api env:load tsx src/http/server.ts',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'master-web',
      script: 'pnpm',
      args: '--filter web start',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
}
