import { PricingProfileLayout } from "@/components/pricing-profiles/pricing-profile-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PricingProfileLayout>{children}</PricingProfileLayout>;
}
