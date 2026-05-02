import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/:locale(de|en|fr|it|sq)/candidates',
        destination: '/:locale/dashboard/employer/candidates',
        permanent: false,
      },
      {
        source: '/:locale(de|en|fr|it|sq)/dashboard/job-seeker/jobs',
        destination: '/:locale/jobs',
        permanent: false,
      },
    ];
  },
};
 
export default withNextIntl(nextConfig);
