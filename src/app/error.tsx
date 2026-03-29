"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Application error:", error);
  return (
    <div className="fixed inset-0 flex items-center justify-center flex-col gap-2 p-4 overflow-auto">
      <p className="text-lg font-semibold text-center">Oops! Something went wrong.</p>
      <p className="text-sm text-muted-foreground text-center max-w-2xl break-words">
        {error.message}
      </p>
      {error.stack && (
        <pre className="text-xs bg-muted p-2 rounded max-w-2xl overflow-auto mt-2">
          {error.stack}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
      >
        Try again
      </button>
    </div>
  );
}
