import { requireUserAndBaby } from "@/lib/auth";
import { UploadClient } from "./UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const { baby } = await requireUserAndBaby();
  return (
    <main className="mx-auto flex max-w-xl flex-col p-6 sm:p-8">
      <UploadClient babyName={baby.name} />
    </main>
  );
}
