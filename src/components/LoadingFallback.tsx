
"use client";

import { Loader2 } from "lucide-react";

export default function LoadingFallback({ message = "Loading page..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full h-full min-h-[300px] p-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-lg font-body text-muted-foreground">{message}</p>
    </div>
  );
}
