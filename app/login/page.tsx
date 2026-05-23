import { LoginForm } from "@/app/login/login-form";
import { loginAction } from "@/app/login/actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <LoginForm action={loginAction} />
    </main>
  );
}
