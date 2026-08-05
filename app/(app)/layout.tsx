import { prisma } from "@/lib/prisma";
import PixelWindow from "@/components/pixel/PixelWindow";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <main className="flex flex-1 items-start justify-center p-3 sm:p-6">
      <PixelWindow trackerName={settings?.trackerName ?? ""}>
        {children}
      </PixelWindow>
    </main>
  );
}
