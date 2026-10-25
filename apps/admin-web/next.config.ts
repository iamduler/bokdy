import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@bokdy/ui", "@bokdy/icons", "@vietmap/vietmap-gl-js"],
};

export default withNextIntl(nextConfig);
