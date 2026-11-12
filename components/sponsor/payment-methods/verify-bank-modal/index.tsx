"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import { verifyAmountsSchema, verifyCodeSchema } from "@/components/sponsor/payment-methods/schema";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { validateAndSetErrors } from "@/utils/validation";
import { routes } from "@/utils/routes";
import type { SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

interface VerifyBankModalProps {
  // The bank account waiting for verification; null = closed.
  method: SponsorPaymentMethod | null;
  onClose: () => void;
  onVerified: () => void;
}

// Verifies a bank account entered by hand (POST /payment-methods/:id/verify-microdeposits) with the code on
// Stripe's $0.01 deposit, or with the two small deposits' amounts when the bank sent those instead. A wrong
// code says how many tries are left; after too many the account must be removed and added again.
export default function VerifyBankModal({ method, onClose, onVerified }: VerifyBankModalProps) {
  const [mode, setMode] = useState<"code" | "amounts">("code");
  const [code, setCode] = useState("");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const reset = () => {
    setMode("code");
    setCode("");
    setFirst("");
    setSecond("");
    setErrors({});
    setFailure(null);
  };

  const handleClose = () => {
    if (verifying) return;
    reset();
    onClose();
  };

  const clear = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    setFailure(null);
  };

  const handleVerify = async () => {
    if (!method) return;
    const valid =
      mode === "code"
        ? await validateAndSetErrors(verifyCodeSchema, { descriptorCode: code }, setErrors)
        : await validateAndSetErrors(verifyAmountsSchema, { first, second }, setErrors);
    if (!valid) return;
    setVerifying(true);
    const body =
      mode === "code" ? { descriptorCode: code.trim().toUpperCase() } : { amounts: [Number(first), Number(second)] };
    const r = await sponsorRequest<SponsorPaymentMethod>("POST", routes.api.sponsorPaymentMethodVerify(method.id), {
      body,
    });
    setVerifying(false);
    if (r.view) {
      toast.success(`${r.view.label} verified`);
      reset();
      onVerified();
      return;
    }
    setFailure(r.message ?? "Couldn't verify it, please try again.");
  };

  return (
    <Modal isOpen={!!method} onClose={handleClose} title="Verify bank account">
      {method && (
        <div className="w-full flex flex-col gap-5">
          <p className="text-midnight-navy/80 text-base leading-6">
            {mode === "code"
              ? `Stripe sent ${method.label} a $0.01 deposit. Enter the 6-character code from its description (it starts with SM).`
              : `Enter the two small deposits Stripe sent ${method.label}, in cents.`}
          </p>
          {mode === "code" ? (
            <Input
              label="Deposit code"
              name="descriptorCode"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                clear("descriptorCode");
              }}
              placeholder="SM11AA"
              maxLength={6}
              autoComplete="off"
              error={errors.descriptorCode}
            />
          ) : (
            <div className="flex gap-3">
              <Input
                label="First (cents)"
                name="first"
                value={first}
                onChange={(e) => {
                  setFirst(e.target.value);
                  clear("first");
                }}
                placeholder="32"
                inputMode="numeric"
                maxLength={2}
                error={errors.first}
                className="flex-1"
              />
              <Input
                label="Second (cents)"
                name="second"
                value={second}
                onChange={(e) => {
                  setSecond(e.target.value);
                  clear("second");
                }}
                placeholder="45"
                inputMode="numeric"
                maxLength={2}
                error={errors.second}
                className="flex-1"
              />
            </div>
          )}
          <Button
            variant="text"
            size="sm"
            label={mode === "code" ? "My bank shows two small amounts instead" : "Use the deposit code instead"}
            onClick={() => {
              setMode(mode === "code" ? "amounts" : "code");
              setErrors({});
              setFailure(null);
            }}
            className="self-start text-[#6a4be6] hover:text-[#4a2fc0] underline"
          />
          {failure && (
            <p role="alert" className="text-sm text-red-600">
              {failure}
            </p>
          )}
          <div className="flex gap-3">
            <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={verifying} fullWidth />
            <Button
              label={verifying ? "Verifying…" : "Verify"}
              variant="cta"
              onClick={handleVerify}
              disabled={verifying}
              fullWidth
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
