import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Dialog, type DialogVariant } from '@/components/Dialog';

type ShowOptions = {
  variant?: DialogVariant;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type DialogState = ShowOptions & { visible: boolean };

type DialogContextValue = {
  /** Generic show — full control. */
  show: (opts: ShowOptions) => void;
  /** Quick success message with optional title. */
  showSuccess: (message: string, title?: string) => void;
  /** Quick error message with optional title. */
  showError: (message?: string, title?: string) => void;
  /** Confirmation dialog. Resolves with `true` on confirm, `false` on cancel. */
  confirm: (opts: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const DEFAULT_ERROR_TITLE = 'Etwas ist schiefgegangen';
const DEFAULT_ERROR_MESSAGE = 'Bitte versuche es erneut.';
const DEFAULT_SUCCESS_TITLE = 'Erfolgreich';

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: '',
  });

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback((opts: ShowOptions) => {
    setState({ ...opts, visible: true });
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      show({
        variant: 'success',
        title: title ?? DEFAULT_SUCCESS_TITLE,
        message,
      });
    },
    [show]
  );

  const showError = useCallback(
    (message?: string, title?: string) => {
      show({
        variant: 'error',
        title: title ?? DEFAULT_ERROR_TITLE,
        message: message ?? DEFAULT_ERROR_MESSAGE,
      });
    },
    [show]
  );

  const confirm = useCallback(
    (opts: {
      title: string;
      message?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      destructive?: boolean;
    }) =>
      new Promise<boolean>((resolve) => {
        show({
          variant: 'confirm',
          title: opts.title,
          message: opts.message,
          confirmLabel: opts.confirmLabel,
          cancelLabel: opts.cancelLabel,
          destructive: opts.destructive,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    [show]
  );

  const value = useMemo<DialogContextValue>(
    () => ({ show, showSuccess, showError, confirm }),
    [show, showSuccess, showError, confirm]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Dialog
        visible={state.visible}
        variant={state.variant}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        destructive={state.destructive}
        onConfirm={state.onConfirm}
        onCancel={state.onCancel}
        onDismiss={dismiss}
      />
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog() must be used inside <DialogProvider>');
  }
  return ctx;
}
