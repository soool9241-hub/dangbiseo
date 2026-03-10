import { BottomNav } from "@/components/shared/BottomNav";
import { QuickActions } from "@/components/shared/QuickActions";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { SupabaseSyncProvider } from "@/components/shared/SupabaseSyncProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseSyncProvider>
      <OfflineBanner />
      <main className="max-w-lg mx-auto px-4 pb-20 pt-safe min-h-screen">
        {children}
      </main>
      <QuickActions />
      <BottomNav />
    </SupabaseSyncProvider>
  );
}
