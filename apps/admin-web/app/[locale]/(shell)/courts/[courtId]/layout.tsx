import { CourtDetailLayout } from "@/components/courts/detail/court-detail-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CourtDetailLayout>{children}</CourtDetailLayout>;
}
