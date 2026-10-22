"use client";

import { useActionState, useState, type ReactElement, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionState } from "@/lib/action";

type FormDialogProps = {
  /** Elemen pemicu, mis. <Button>Tambah</Button> */
  trigger: ReactElement;
  title: string;
  description?: ReactNode;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  successMessage?: string;
  destructive?: boolean;
  /** Dialog lebih lebar untuk form besar. */
  wide?: boolean;
  children?: ReactNode;
};

export function FormDialog({
  trigger,
  title,
  description,
  action,
  submitLabel = "Simpan",
  successMessage = "Berhasil disimpan",
  destructive,
  wide,
  children,
}: FormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className={wide ? "sm:max-w-xl" : undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {/* Form dipisah supaya state-nya ikut ter-reset tiap dialog dibuka ulang */}
        <DialogForm
          action={action}
          submitLabel={submitLabel}
          successMessage={successMessage}
          destructive={destructive}
          onDone={() => setOpen(false)}
        >
          {children}
        </DialogForm>
      </DialogContent>
    </Dialog>
  );
}

function DialogForm({
  action,
  submitLabel,
  successMessage,
  destructive,
  onDone,
  children,
}: {
  action: FormDialogProps["action"];
  submitLabel: string;
  successMessage: string;
  destructive?: boolean;
  onDone: () => void;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok) {
      toast.success(result.message ?? successMessage);
      onDone();
    }
    return result;
  }, {});

  return (
    <form action={formAction} className="grid gap-4">
      {children}

      {state.error ? (
        <div role="alert" className="grid gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">{state.error}</p>
          {state.detail?.length ? (
            <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-xs">
              {state.detail.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
        <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Pembungkus label + input agar form seragam. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
