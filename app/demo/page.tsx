import type { Metadata } from "next";
import DemoView from "./DemoView";

export const metadata: Metadata = {
  title: "Echo — Demo",
  description: "A walkthrough of Echo's pixel UI with sample data — no login required.",
};

export default function DemoPage() {
  return (
    <main className="flex min-h-screen flex-1 items-start justify-center p-3 sm:p-6">
      <DemoView />
    </main>
  );
}
