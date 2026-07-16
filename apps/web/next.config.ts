import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '192.168.100.18',
    '192.168.2.30',
    '192.168.2.206',
    '192.168.2.216',
  ],
}

export default nextConfig
