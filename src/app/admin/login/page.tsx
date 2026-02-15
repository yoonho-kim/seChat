import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen">
      <div className="reading-container flex min-h-screen items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
