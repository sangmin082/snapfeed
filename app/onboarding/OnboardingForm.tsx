"use client";

import { BabyForm } from "@/components/BabyForm";
import { createBaby } from "./actions";

export function OnboardingForm() {
  return (
    <BabyForm
      action={createBaby}
      submitLabel="시작하기"
      pendingLabel="저장 중…"
    />
  );
}
