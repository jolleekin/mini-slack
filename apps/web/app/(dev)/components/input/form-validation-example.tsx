"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button/button.tsx";
import { Input } from "@/components/ui/input/input.tsx";
import { Label } from "@/components/ui/label/label.tsx";

export function FormValidationExample() {
  const [submitted, setSubmitted] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setEmailInvalid(false);
  }, []);

  const handleSubmit = useCallback((e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      // Mark fields invalid so data-invalid styling kicks in
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);
    setSubmitted(true);
  }, []);

  const handleEmailChange = useCallback(() => {
    if (emailRef.current?.validity.valid) {
      setEmailInvalid(false);
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-sm space-y-4">
      <div className="space-y-1">
        <Label htmlFor="form-email" required>
          Email
        </Label>
        <Input
          ref={emailRef}
          id="form-email"
          type="email"
          placeholder="you@example.com"
          required
          // data-invalid triggers the danger border styling in the Input component
          data-invalid={emailInvalid || undefined}
          onChange={handleEmailChange}
        />
        {emailInvalid && emailRef.current?.validity.valueMissing && (
          <p className="text-danger-11 text-xs">
            Please enter your email address
          </p>
        )}
        {emailInvalid && emailRef.current?.validity.typeMismatch && (
          <p className="text-danger-11 text-xs">
            Please enter a valid email address
          </p>
        )}
      </div>

      {submitted && (
        <p className="text-success-11 text-sm font-medium">
          ✓ Form submitted successfully
        </p>
      )}
      <div className="flex gap-3">
        <Button type="reset" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" appearance="primary">
          Submit
        </Button>
      </div>
    </form>
  );
}
