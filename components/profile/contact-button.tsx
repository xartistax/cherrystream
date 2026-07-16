import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ContactButtonProps = {
  username: string;
  disabled?: boolean;
};

export function ContactButton({ username, disabled = false }: ContactButtonProps) {
  return (
    <Button render={<Link href={`/api/contact/${username}/whatsapp`} />} disabled={disabled} className="bg-emerald-600 text-white hover:bg-emerald-500">
      <MessageCircle className="size-4" />
      WhatsApp
    </Button>
  );
}
