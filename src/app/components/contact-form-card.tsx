"use client";

import { useState } from "react";
import type { ContactFormFields } from "@/lib/tools/ui-types";
import { Card, primaryButton } from "./card";
import { type ContactFormErrors, validateContactForm } from "./contact-form-schema";
import { FormField } from "./form-field";
import { Check } from "./icons";

type Props = {
  id: string;
  reason: string;
  submitted: boolean; // a later visitor message already carries these details
  prefillEmail: string | undefined; // typed by the visitor earlier; editable
  disabled: boolean;
  onSubmit: (fields: ContactFormFields) => void;
};

export function ContactFormCard({ id, reason, submitted, prefillEmail, disabled, onSubmit }: Props) {
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [sent, setSent] = useState(false);

  if (submitted || sent) {
    return (
      <Card eyebrow="Contact the team" testId="contact-form-card">
        <p className="flex items-center gap-2 text-callout font-medium text-ink">
          <Check className="size-4" />
          Details sent
        </p>
        {reason && <p className="mt-1 text-footnote text-muted">{reason}</p>}
      </Card>
    );
  }

  const fid = (name: string) => `${id}-${name}`;

  return (
    <Card eyebrow="Contact the team" testId="contact-form-card">
      {reason && <p className="text-callout text-ink-2">{reason}</p>}
      <form
        noValidate
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = Object.fromEntries(new FormData(form));
          const result = validateContactForm({ ...data, consent: data.consent === "on" });
          if (!result.ok) {
            setErrors(result.errors);
            const first = Object.keys(result.errors)[0];
            form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
            return;
          }
          setErrors({});
          setSent(true);
          onSubmit(result.fields);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={fid("name")} name="name" label="Name" autoComplete="name" maxLength={120} error={errors.name} />
          <FormField
            id={fid("email")}
            name="email"
            label="Work email"
            hint={prefillEmail && "From your message"}
            type="email"
            autoComplete="email"
            maxLength={254}
            defaultValue={prefillEmail}
            error={errors.email}
          />
        </div>
        <FormField id={fid("company")} name="company" label="Company" hint="Optional" autoComplete="organization" maxLength={160} error={errors.company} />
        <FormField id={fid("need")} name="need" label="What do you need help with?" multiline maxLength={1000} error={errors.need} />

        <div>
          {/* The whole row is the target (44px), not just the box. */}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-callout text-ink-2">
            <input
              type="checkbox"
              name="consent"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? fid("consent-error") : undefined}
              className="size-5 shrink-0 cursor-pointer accent-[var(--accent-fill)]"
            />
            I agree to be contacted by Cadre about this request
          </label>
          {errors.consent && (
            <p id={fid("consent-error")} className="pl-8 text-footnote text-accent-ink">
              {errors.consent}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={disabled} className={`w-full sm:w-auto ${primaryButton}`}>
            Send details
          </button>
        </div>
      </form>
    </Card>
  );
}
