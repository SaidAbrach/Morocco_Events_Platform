/** @type {import('next').nextConfig} */
const nextConfig = {
  images:{
    domains: ['utfs.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
      }
    ]
  }
}

module.exports =  nextConfig;
