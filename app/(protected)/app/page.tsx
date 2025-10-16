import { stackServerApp } from "@/stack";
import { RecoveryCompanion } from "@/components/recovery-companion";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect("/handler/sign-in");
  }

  return (
    <main className="h-screen w-full">
      <RecoveryCompanion />
    </main>
  );
}
