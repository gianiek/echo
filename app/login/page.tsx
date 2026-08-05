import { prisma } from "@/lib/prisma";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4">
      <LoginForm initialName={settings?.trackerName ?? ""} />
    </main>
  );
}
