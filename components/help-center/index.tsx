"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Textarea from "@/components/common/textarea";
import { contactSchema, MESSAGE_MAX } from "@/components/help-center/schema";
import { validateAndSetErrors } from "@/utils/validation";

const INITIAL = { name: "", message: "" };
type Form = typeof INITIAL;

const LABEL = "text-white";

// Help Center: contact form for reaching the Dime team.
export default function HelpCenterPage() {
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const send = async () => {
    if (!(await validateAndSetErrors(contactSchema, form, setErrors))) return;
    // No support endpoint yet — wire the send call here once the backend exposes it.
    toast("Sending messages is coming soon.");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-white">
        <h2 className="text-[32px] lg:text-[40px] font-bold leading-tight">Contact Us</h2>
        <p className="text-base text-white/85">Have a question or need help? Send us a message and we&apos;ll get back to you.</p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        <Input
          label="Name"
          name="name"
          required
          value={form.name}
          onChange={set("name")}
          placeholder="John Doe"
          error={errors.name}
          labelClassName={LABEL}
          inputClassName="bg-white"
        />
        <Textarea
          label="Message"
          name="message"
          required
          value={form.message}
          onChange={set("message")}
          placeholder="Hello Dime!"
          maxLength={MESSAGE_MAX}
          rows={6}
          error={errors.message}
          labelClassName={LABEL}
        />
        <Button variant="cta" label="Send" fullWidth onClick={send} className="mt-4" />
      </div>
    </div>
  );
}
