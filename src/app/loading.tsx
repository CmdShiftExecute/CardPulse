export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing logo mark */}
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-sage-400/20 flex items-center justify-center">
            <div className="h-5 w-5 rounded-lg bg-sage-400/60 animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-text-muted animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
