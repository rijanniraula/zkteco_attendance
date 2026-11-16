import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { ArrowRight, TickCircle, Timer1 } from "iconsax-reactjs";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";
import { BrandMark } from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

// Decorative week preview for the login panel (illustration only, not real data)
const PREVIEW_ROWS = [
  { initials: "AK", marks: ["present", "present", "late", "present", "present"] },
  { initials: "RS", marks: ["present", "absent", "present", "present", "leave"] },
  { initials: "MT", marks: ["late", "present", "present", "present", "present"] },
];
const STATUS_KEYS = { present: "present", late: "late", absent: "absent", leave: "leave" };

const WeekPreview = () => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <div className="w-full max-w-md rounded-2xl bg-card p-5 text-foreground shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)]" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold">This week</div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {format(days[0], "d MMM")} – {format(days[4], "d MMM")}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[2rem_repeat(5,1fr)] items-center gap-y-2.5 text-center">
        <span />
        {days.map((d, i) => (
          <div
            key={i}
            className={cn(
              "mx-auto flex w-8 flex-col rounded-md py-1 leading-tight",
              i === todayIndex ? "bg-highlight text-white" : "text-foreground"
            )}
          >
            <span className={cn("text-[10px]", i !== todayIndex && "text-muted-foreground")}>{format(d, "EEEEEE")}</span>
            <span className="text-[13px] font-semibold">{format(d, "d")}</span>
          </div>
        ))}
        {PREVIEW_ROWS.map((row) => (
          <React.Fragment key={row.initials}>
            <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
              {row.initials}
            </span>
            {row.marks.map((m, i) => (
              <span key={i}><StatusBadge status={STATUS_KEYS[m]} compact /></span>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 flex gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><TickCircle size={14} className="text-present" /> 11 on time</span>
        <span className="flex items-center gap-1.5"><Timer1 size={14} className="text-late" /> 2 late</span>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-card lg:grid-cols-2">
      {/* Sign-in form */}
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="font-brand text-[22px] leading-none">Attendance</span>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto my-auto w-full max-w-sm space-y-6 py-12">
          <div className="space-y-1.5">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in with the email and password your administrator gave you.</p>
          </div>

          <FormError message={error} />

          <div className="space-y-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Sign in
            {!isSubmitting && <ArrowRight />}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Forgot your password? Ask an administrator to reset it.
          </p>
        </form>

        <div className="text-xs text-muted-foreground">{format(new Date(), "EEEE, do MMMM yyyy")}</div>
      </section>

      {/* Showcase panel */}
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-center lg:gap-10">
        <div className="max-w-md space-y-3">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-0.02em]">Every working day, accounted for.</h2>
          <p className="text-[15px] leading-relaxed text-white/75">
            Punches from the office device show up here automatically. Employees see their own record;
            administrators keep it accurate.
          </p>
        </div>
        <WeekPreview />
        {/* soft decorative circles */}
        <span className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-32 -right-10 size-96 rounded-full bg-white/[0.06]" />
      </section>
    </main>
  );
};

export default LoginPage;
