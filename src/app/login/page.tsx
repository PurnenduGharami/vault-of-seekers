
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 space-y-8">
      <div className="text-center">
        <h1 className="font-title font-bold uppercase text-foreground tracking-wider text-4xl md:text-5xl">
          Vault of Seekers
        </h1>
        <p className="text-lg md:text-xl text-foreground mt-2">
          All Paths. One Vault.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
