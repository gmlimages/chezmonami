// API publique du système de toast.
// Utilisable depuis n'importe quel composant client : import { toast } from '@/lib/toast';

import { emit, makeToast } from '@/components/ui/Toast';
import { requestConfirm } from '@/components/ui/ConfirmDialog';

export const toast = {
  success: (message, options) => emit(makeToast('success', message, options)),
  error:   (message, options) => emit(makeToast('error',   message, options)),
  info:    (message, options) => emit(makeToast('info',    message, options)),
  warning: (message, options) => emit(makeToast('warning', message, options)),
};

// confirmDialog({ message, title, confirmLabel, cancelLabel, danger }) → Promise<boolean>
export const confirmDialog = requestConfirm;
