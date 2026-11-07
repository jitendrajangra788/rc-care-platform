"use client";

import type { SessionUser } from "@/lib/types";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";

export type PatientFormValues = {
  name: string;
  phone: string;
  age: string;
  gender: "Male" | "Female" | "Other" | string;
  address: string;
  area: string;
  notes: string;
  familyUserId: string;
};

export type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>;

export const emptyPatientForm = (): PatientFormValues => ({
  name: "",
  phone: "",
  age: "",
  gender: "Male",
  address: "",
  area: "Bhilwara",
  notes: "",
  familyUserId: "",
});

export function validatePatientForm(value: PatientFormValues): PatientFormErrors {
  const errors: PatientFormErrors = {};
  if (!value.name.trim()) errors.name = "Name is required";
  const digits = value.phone.replace(/\D/g, "");
  const local =
    digits.startsWith("91") && digits.length >= 12 ? digits.slice(-10) : digits;
  if (!local) errors.phone = "Phone is required";
  else if (local.length !== 10) errors.phone = "Enter a 10-digit mobile number";
  if (value.age && (Number.isNaN(Number(value.age)) || Number(value.age) < 0 || Number(value.age) > 120)) {
    errors.age = "Enter a valid age";
  }
  if (!value.address.trim()) errors.address = "Address is required";
  return errors;
}

export function PatientFormFields({
  value,
  onChange,
  errors = {},
  familyUsers = [],
  showFamilyLink = true,
  showNotes = true,
  disabled = false,
}: {
  value: PatientFormValues;
  onChange: (next: PatientFormValues) => void;
  errors?: PatientFormErrors;
  familyUsers?: SessionUser[];
  showFamilyLink?: boolean;
  showNotes?: boolean;
  disabled?: boolean;
}) {
  function set<K extends keyof PatientFormValues>(key: K, next: PatientFormValues[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      <FormField label="Full name *" error={errors.name}>
        <Input
          required
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          autoComplete="name"
        />
      </FormField>
      <FormField label="Phone *" error={errors.phone} hint="10-digit mobile">
        <Input
          required
          disabled={disabled}
          inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
          autoComplete="tel"
        />
      </FormField>
      <FormField label="Age" error={errors.age}>
        <Input
          disabled={disabled}
          inputMode="numeric"
          aria-invalid={Boolean(errors.age)}
          value={value.age}
          onChange={(e) => set("age", e.target.value)}
        />
      </FormField>
      <FormField label="Gender">
        <Select
          disabled={disabled}
          value={value.gender}
          onChange={(e) => set("gender", e.target.value)}
          aria-label="Gender"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </Select>
      </FormField>
      <FormField label="Area">
        <Input
          disabled={disabled}
          value={value.area}
          onChange={(e) => set("area", e.target.value)}
          aria-label="Area"
        />
      </FormField>
      <FormField label="Address *" error={errors.address}>
        <Input
          required
          disabled={disabled}
          aria-invalid={Boolean(errors.address)}
          value={value.address}
          onChange={(e) => set("address", e.target.value)}
          autoComplete="street-address"
        />
      </FormField>
      {showFamilyLink ? (
        <FormField
          label="Family user"
          hint="Optional portal access link"
          className="sm:col-span-2"
        >
          <Select
            disabled={disabled}
            value={value.familyUserId}
            onChange={(e) => set("familyUserId", e.target.value)}
            aria-label="Family user"
          >
            <option value="">No family link</option>
            {familyUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.email}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
      {showNotes ? (
        <FormField label="Clinical notes" className="sm:col-span-2">
          <Textarea
            disabled={disabled}
            value={value.notes}
            onChange={(e) => set("notes", e.target.value)}
            aria-label="Clinical notes"
          />
        </FormField>
      ) : null}
    </div>
  );
}
