import { BranchDetailLayout } from "@/components/branches/detail/branch-detail-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BranchDetailLayout>{children}</BranchDetailLayout>;
}
