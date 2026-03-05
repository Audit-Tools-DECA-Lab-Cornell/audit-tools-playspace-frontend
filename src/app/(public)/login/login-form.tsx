"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { setBrowserAuthSession } from "@/lib/auth/browser-session";
import type { UserRole } from "@/lib/auth/role";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const managerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type ManagerLoginValues = z.infer<typeof managerLoginSchema>;

const auditorLoginSchema = z.object({
  auditorCode: z.string().regex(/^[A-Za-z0-9]+$/, {
    message: "Auditor code must be alphanumeric.",
  }),
});

type AuditorLoginValues = z.infer<typeof auditorLoginSchema>;

function isSafeInternalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

function getDefaultDashboard(role: UserRole): string {
  return role === "manager" ? "/manager/dashboard" : "/auditor/dashboard";
}

function isAllowedNextPath(role: UserRole, nextPath: string): boolean {
  if (!isSafeInternalPath(nextPath)) return false;
  if (nextPath.startsWith("/settings")) return true;
  if (role === "manager") return nextPath.startsWith("/manager");
  return nextPath.startsWith("/auditor");
}

function getRedirectAfterLogin(role: UserRole, nextParam: string | null): string {
  if (nextParam && isAllowedNextPath(role, nextParam)) return nextParam;
  return getDefaultDashboard(role);
}

function createDemoAccessToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo_${Date.now()}`;
}

export interface LoginFormProps {
  nextParam: string | null;
}

export function LoginForm({ nextParam }: LoginFormProps) {
  const router = useRouter();

  const managerForm = useForm<ManagerLoginValues>({
    resolver: zodResolver(managerLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const auditorForm = useForm<AuditorLoginValues>({
    resolver: zodResolver(auditorLoginSchema),
    defaultValues: { auditorCode: "" },
    mode: "onSubmit",
  });

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-4 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Manager sign in</CardTitle>
              <CardDescription>
                Full-access dashboard: projects, places, auditors, and combined scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={managerForm.handleSubmit(() => {
                  setBrowserAuthSession({
                    role: "manager",
                    accessToken: createDemoAccessToken(),
                  });

                  const redirectPath = getRedirectAfterLogin("manager", nextParam);
                  router.push(redirectPath);
                })}
              >
                <div className="grid gap-2">
                  <Label htmlFor="manager_email">Email</Label>
                  <Input
                    id="manager_email"
                    type="email"
                    autoComplete="email"
                    placeholder="manager@company.com"
                    {...managerForm.register("email")}
                  />
                  {managerForm.formState.errors.email?.message ? (
                    <p className="text-sm text-destructive">
                      {managerForm.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="manager_password">Password</Label>
                  <Input
                    id="manager_password"
                    type="password"
                    autoComplete="current-password"
                    {...managerForm.register("password")}
                  />
                  {managerForm.formState.errors.password?.message ? (
                    <p className="text-sm text-destructive">
                      {managerForm.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                <Button type="submit">Sign in</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auditor sign in</CardTitle>
              <CardDescription>
                Limited access: execute assigned audits using your auditor code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={auditorForm.handleSubmit((values) => {
                  setBrowserAuthSession({
                    role: "auditor",
                    accessToken: createDemoAccessToken(),
                    auditorCode: values.auditorCode,
                  });

                  const redirectPath = getRedirectAfterLogin("auditor", nextParam);
                  router.push(redirectPath);
                })}
              >
                <div className="grid gap-2">
                  <Label htmlFor="auditor_code">Auditor code</Label>
                  <Input
                    id="auditor_code"
                    autoComplete="off"
                    placeholder="A1B2C3"
                    {...auditorForm.register("auditorCode")}
                  />
                  {auditorForm.formState.errors.auditorCode?.message ? (
                    <p className="text-sm text-destructive">
                      {auditorForm.formState.errors.auditorCode.message}
                    </p>
                  ) : null}
                </div>

                <Button type="submit">Continue</Button>
              </form>

              <Separator className="my-6" />

              <p className="text-sm text-muted-foreground">
                Auditors are identified strictly by code. No real names are displayed in the UI.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

