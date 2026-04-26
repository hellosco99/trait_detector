import { Stepper } from "@/components/stepper";

export default async function AuditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ run: string }>;
}) {
  const { run } = await params;
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Stepper run={run} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
