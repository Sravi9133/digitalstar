import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <LoginForm />
    </div>
  );
}
