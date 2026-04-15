"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import type { PersonInfo, TeamRegistrationInput } from "@/types/team";

const EMPTY_PERSON: PersonInfo = {
  fullName: "",
  nic: "",
  contactNo: "",
  email: "",
};

const initialMembers = Array.from({ length: 8 }, () => ({ ...EMPTY_PERSON }));

type WizardForm = TeamRegistrationInput;

const initialState: WizardForm = {
  teamName: "",
  teamLogo: "",
  teamSlogan: "",
  leader: { ...EMPTY_PERSON },
  members: initialMembers,
};

export function RegistrationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<WizardForm>(initialState);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const totalSteps = 10;

  useEffect(() => {
    if (!cardRef.current) {
      return;
    }

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 24, rotateX: -8 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.5, ease: "power3.out" }
    );
  }, [step]);

  const title = useMemo(() => {
    if (step === 0) return "Team Details";
    if (step === 1) return "Team Leader Details";
    return `Team Member ${step - 1} Details`;
  }, [step]);

  const validateCurrentStep = () => {
    if (step === 0) {
      if (!form.teamName || !form.teamLogo || !form.teamSlogan) {
        setError("Please fill team name, logo and slogan.");
        return false;
      }
    } else if (step === 1) {
      if (Object.values(form.leader).some((value) => !value.trim())) {
        setError("Please complete all team leader fields.");
        return false;
      }
    } else {
      const member = form.members[step - 2];
      if (Object.values(member).some((value) => !value.trim())) {
        setError(`Please complete all fields for member ${step - 1}.`);
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1_500_000) {
      setError("Please upload a logo under 1.5MB.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setForm((prev) => ({ ...prev, teamLogo: dataUrl }));
    setError("");
  };

  const updatePerson = (target: "leader" | "member", key: keyof PersonInfo, value: string) => {
    if (target === "leader") {
      setForm((prev) => ({
        ...prev,
        leader: { ...prev.leader, [key]: value },
      }));
      return;
    }

    const memberIndex = step - 2;
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member, index) =>
        index === memberIndex ? { ...member, [key]: value } : member
      ),
    }));
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 0));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Failed to register team.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMember = step >= 2 ? form.members[step - 2] : null;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600">Team Registration</p>
          <h1 className="text-3xl font-bold text-slate-900">Create a New Team</h1>
        </div>
        <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700">
          Back to Leadboard
        </Link>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>
      <p className="mb-6 text-sm text-slate-600">
        Step {step + 1} / {totalSteps} - {title}
      </p>

      <form onSubmit={handleSubmit}>
        <div ref={cardRef} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          {step === 0 && (
            <>
              <label className="grid gap-1 text-sm">
                Team Name
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={form.teamName}
                  onChange={(e) => setForm((prev) => ({ ...prev, teamName: e.target.value }))}
                  placeholder="Nova Coders"
                />
              </label>

              <label className="grid gap-1 text-sm">
                Team Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="rounded-xl border border-slate-300 p-3" />
              </label>
              {form.teamLogo && (
                <Image
                  src={form.teamLogo}
                  alt="Team logo preview"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-xl object-cover"
                  unoptimized
                />
              )}

              <label className="grid gap-1 text-sm">
                Team Slogan
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={form.teamSlogan}
                  onChange={(e) => setForm((prev) => ({ ...prev, teamSlogan: e.target.value }))}
                  placeholder="Code with impact"
                />
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <label className="grid gap-1 text-sm">
                Leader Full Name
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={form.leader.fullName}
                  onChange={(e) => updatePerson("leader", "fullName", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                NIC
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={form.leader.nic}
                  onChange={(e) => updatePerson("leader", "nic", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Contact No (WhatsApp preferred)
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={form.leader.contactNo}
                  onChange={(e) => updatePerson("leader", "contactNo", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Email
                <input
                  type="email"
                  className="rounded-xl border border-slate-300 p-3"
                  value={form.leader.email}
                  onChange={(e) => updatePerson("leader", "email", e.target.value)}
                />
              </label>
            </>
          )}

          {step >= 2 && currentMember && (
            <>
              <label className="grid gap-1 text-sm">
                Member Full Name
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={currentMember.fullName}
                  onChange={(e) => updatePerson("member", "fullName", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                NIC
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={currentMember.nic}
                  onChange={(e) => updatePerson("member", "nic", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Contact No
                <input
                  className="rounded-xl border border-slate-300 p-3"
                  value={currentMember.contactNo}
                  onChange={(e) => updatePerson("member", "contactNo", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Email
                <input
                  type="email"
                  className="rounded-xl border border-slate-300 p-3"
                  value={currentMember.email}
                  onChange={(e) => updatePerson("member", "email", e.target.value)}
                />
              </label>
            </>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 0}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Finish Registration"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
