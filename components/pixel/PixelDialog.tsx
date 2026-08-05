"use client";

import { useEffect, useRef, type ReactNode } from "react";

type PixelDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function PixelDialog({
  open,
  onClose,
  title,
  children,
}: PixelDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className="pixel-box m-auto w-[min(420px,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto p-0 backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3 font-display text-[0.625rem]">
        <span>{title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer px-1 focus-visible:outline-3 focus-visible:outline-accent-2"
        >
          ✕
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
