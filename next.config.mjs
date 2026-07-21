/** @type {import('next').NextConfig} */
const onPages = process.env.PAGES_BUILD === 'true';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // GitHub Pages serves the site under /<repo>; local dev stays at /.
  ...(onPages ? { basePath: '/macro-lab', assetPrefix: '/macro-lab/' } : {}),
};

export default nextConfig;
