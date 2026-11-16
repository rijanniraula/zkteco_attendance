import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/field";

const ChangePasswordPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) {
      setError("New passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      await makeApiRequest({
        endpoint: ENDPOINTS.CHANGE_PASSWORD,
        method: "POST",
        requestBody: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader
        title="Change password"
        description={
          user?.must_change_password
            ? "Please set a new password before continuing."
            : "Use at least 8 characters."
        }
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Current password" htmlFor="currentPassword">
          <Input id="currentPassword" type="password" autoComplete="current-password"
            value={form.currentPassword} onChange={update("currentPassword")} required />
        </Field>
        <Field label="New password" htmlFor="newPassword">
          <Input id="newPassword" type="password" autoComplete="new-password" minLength={8}
            value={form.newPassword} onChange={update("newPassword")} required />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" minLength={8}
            value={form.confirm} onChange={update("confirm")} required />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Save password
        </Button>
      </form>
    </Card>
  );
};

export default ChangePasswordPage;
