"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/toast";

const SERVICES = [
  "Nursing staff",
  "Elderly care",
  "House maid",
  "Baby care",
  "Physiotherapy",
  "Doctor visit",
  "Equipment",
  "Ambulance",
];

const SHIFTS = ["8 hours", "12 hours", "24 hours"];

export function CallbackForm({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const careType = String(fd.get("careType") || "Nursing staff");
    const shift = String(fd.get("shift") || "8 hours");
    const area = String(fd.get("area") || "").trim();

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        careType,
        message: `Callback request · ${careType} · ${shift}${area ? ` · Area: ${area}` : ""}`,
        area,
        shift,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Request failed", data.error || "Try again");
      return;
    }
    setDone(true);
    toast.success("Callback requested", "Care desk will call you shortly");
    e.currentTarget.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5"
          : "space-y-3.5 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6"
      }
    >
      <h3 className="text-lg font-semibold tracking-tight text-heading">Request a callback</h3>

      <FormField label="Patient name">
        <Input name="name" required placeholder="Full name" autoComplete="name" />
      </FormField>
      <FormField label="Your phone">
        <Input
          name="phone"
          required
          placeholder="10-digit mobile number"
          inputMode="tel"
          autoComplete="tel"
          pattern="[0-9+\s-]{10,15}"
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <FormField label="Service">
          <Select name="careType" defaultValue="Nursing staff">
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Shift">
          <Select name="shift" defaultValue="8 hours">
            {SHIFTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Area in Bhilwara">
        <Input name="area" placeholder="e.g. Subhash Nagar" autoComplete="address-level2" />
      </FormField>

      <Button
        type="submit"
        loading={saving}
        className="w-full !rounded-xl !bg-[#111827] hover:!bg-black"
      >
        {saving ? "Sending…" : "Get a callback"}
      </Button>

      {done ? (
        <Alert tone="success" title="Request received">
          We will call you back shortly.
        </Alert>
      ) : null}
    </form>
  );
}
