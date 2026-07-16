"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText: string;
};

export function SubmitButton({ children, pendingText }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-rose-600 text-white hover:bg-rose-500">
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
