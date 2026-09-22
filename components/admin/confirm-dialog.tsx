"use client";

import { TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={loading ? () => undefined : onCancel} title={title} adm>
      <div className="flex items-start gap-3.5">
        <span className="rounded-full bg-red-500/10 p-2.5 text-red-500">
          <TriangleAlert size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-adm-text">{description}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="adm" size="sm" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
