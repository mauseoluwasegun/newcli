"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Application error:", error);
  return (
    <div className="fixed inset-0 flex items-center justify-center flex-col gap-2 p-4">
      <p className="text-lg font-semibold">Oops! Something went wrong.</p>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Check browser console for full error details.
      </p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
      >
        Try again
      </button>
    </div>
  );
}
