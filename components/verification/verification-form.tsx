"use client";

import { Camera, IdCard, LoaderCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useState, useTransition } from "react";

import { submitVerificationAction } from "@/actions/submit-verification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/components/verification/compress-image";
import { cn } from "@/lib/utils";

type VerificationFormProps = {
  challengeCode: string;
};

type SelectedImage = {
  file: File;
  previewUrl: string;
};

type ImageFieldProps = {
  id: string;
  label: string;
  hint: string;
  icon: typeof Camera;
  image: SelectedImage | null;
  disabled: boolean;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
};

function ImageField({ id, label, hint, icon: Icon, image, disabled, onSelect }: ImageFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <label
        htmlFor={id}
        className={cn(
          "relative flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-center transition hover:bg-white/[0.05]",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {image ? (
          <Image src={image.previewUrl} alt={label} fill unoptimized className="object-cover" />
        ) : (
          <>
            <Icon className="size-6 text-zinc-500" />
            <span className="px-4 text-xs leading-5 text-zinc-500">{hint}</span>
          </>
        )}
      </label>

      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled} onChange={onSelect} />
    </div>
  );
}

export function VerificationForm({ challengeCode }: VerificationFormProps) {
  const router = useRouter();

  const [idDocument, setIdDocument] = useState<SelectedImage | null>(null);
  const [selfie, setSelfie] = useState<SelectedImage | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (idDocument) {
        URL.revokeObjectURL(idDocument.previewUrl);
      }
    };
  }, [idDocument]);

  useEffect(() => {
    return () => {
      if (selfie) {
        URL.revokeObjectURL(selfie.previewUrl);
      }
    };
  }, [selfie]);

  function handleSelection(setImage: (image: SelectedImage | null) => void) {
    return async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      event.target.value = "";

      if (!file) {
        return;
      }

      try {
        const compressed = await compressImage(file);

        setImage({
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
        });
        setError(null);
      } catch (compressionError) {
        setError(compressionError instanceof Error ? compressionError.message : "Das Bild konnte nicht verarbeitet werden.");
      }
    };
  }

  function handleSubmit() {
    if (!idDocument || !selfie) {
      setError("Bitte lade beide Fotos hoch.");
      return;
    }

    if (!consent) {
      setError("Bitte bestätige die Einwilligung.");
      return;
    }

    const formData = new FormData();
    formData.set("idDocument", idDocument.file);
    formData.set("selfie", selfie.file);
    formData.set("consent", "on");

    setError(null);

    startTransition(async () => {
      try {
        const result = await submitVerificationAction(formData);

        if (!result.success) {
          setError(result.message ?? "Die Verifizierung konnte nicht eingereicht werden.");
          return;
        }

        router.refresh();
      } catch (submitError) {
        console.error("Verification submit failed:", submitError);
        setError("Die Verifizierung konnte nicht eingereicht werden. Bitte versuche es erneut.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
        <p className="text-sm text-zinc-300">Dein persönlicher Code</p>

        <p className="mt-2 font-mono text-4xl font-black tracking-[0.3em] text-white">{challengeCode}</p>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Schreibe diesen Code gut lesbar auf einen Zettel und halte ihn auf dem Selfie neben dein Gesicht.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          id="idDocument"
          label="Ausweis oder Pass"
          hint="Vorderseite mit Foto und Geburtsdatum, alle Ecken sichtbar"
          icon={IdCard}
          image={idDocument}
          disabled={isPending}
          onSelect={handleSelection(setIdDocument)}
        />

        <ImageField
          id="selfie"
          label="Selfie mit Code"
          hint="Dein Gesicht und der Zettel mit dem Code gut erkennbar"
          icon={Camera}
          image={selfie}
          disabled={isPending}
          onSelect={handleSelection(setSelfie)}
        />
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-zinc-400">
        <input
          type="checkbox"
          checked={consent}
          disabled={isPending}
          onChange={(event) => {
            setConsent(event.target.checked);
          }}
          className="mt-1 size-4 accent-rose-500"
        />

        <span>
          Ich bin mindestens 18 Jahre alt und willige ein, dass CherryStream meine Dokumente zur Alters- und Identitätsprüfung verwendet. Die Fotos
          werden nach der Prüfung gelöscht.
        </span>
      </label>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="button" onClick={handleSubmit} disabled={isPending} className="w-full bg-rose-600 text-white hover:bg-rose-500">
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {isPending ? "Wird hochgeladen ..." : "Zur Prüfung einreichen"}
      </Button>
    </div>
  );
}
