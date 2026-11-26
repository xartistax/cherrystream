type UploadProgressProps = {
  progress: number | null;
};

export function UploadProgress({ progress }: UploadProgressProps) {
  if (progress === null) {
    return null;
  }

  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="mt-4 space-y-2" aria-live="polite" aria-busy={normalizedProgress < 100}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Upload-Fortschritt"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedProgress}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-rose-500 to-pink-500 transition-[width] duration-300"
          style={{
            width: `${normalizedProgress}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{normalizedProgress < 100 ? "Fotos und Videos werden hochgeladen" : "Upload abgeschlossen"}</span>

        <span>{normalizedProgress} %</span>
      </div>
    </div>
  );
}
