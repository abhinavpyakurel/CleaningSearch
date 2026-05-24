import { RegisterForm } from "@/app/register/register-form";
import { registerAction } from "@/app/register/actions";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <RegisterForm action={registerAction} />
    </main>
  );
}
