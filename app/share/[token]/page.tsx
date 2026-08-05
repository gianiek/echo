import { prisma } from "@/lib/prisma";
import { serializePublicCheckIn } from "@/lib/checkins";
import SharedView from "@/components/share/SharedView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const settings = await prisma.settings.findUnique({ where: { shareToken: token } });

  if (!settings) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center p-4">
        <div className="pixel-box w-full max-w-[320px] p-5 text-center">
          <p className="font-display text-sm">🦇</p>
          <p className="mt-3 text-xs text-ink-soft">
            This share link isn&apos;t valid anymore — ask for a fresh one.
          </p>
        </div>
      </main>
    );
  }

  const checkIns = await prisma.checkIn.findMany({ orderBy: { timestamp: "desc" } });

  return (
    <main className="flex min-h-screen flex-1 items-start justify-center p-3 sm:p-6">
      <SharedView
        trackerName={settings.trackerName}
        checkIns={checkIns.map(serializePublicCheckIn)}
      />
    </main>
  );
}
