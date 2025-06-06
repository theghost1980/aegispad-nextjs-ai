import { useToast } from "@/hooks/use-toast";
import { type TransitionStartFunction } from "react";

export interface AsyncOperationConfig<TSuccessPayload = void> {
  operation: () => Promise<TSuccessPayload>;
  manageOperationMessage?: boolean;
  onStartMessage?: string;
  onSuccessMessage?: string | ((payload: TSuccessPayload) => string);
  successToastTitle?: string;
  onErrorMessage?: string | ((error: any) => string);
  errorToastTitle?: string;
  defaultErrorMessage?: string;
  onSuccessCallback?: (payload: TSuccessPayload) => void;
  onErrorCallback?: (error: any) => void;
  onFinallyCallback?: () => void;
  suppressSuccessToast?: boolean;
  suppressErrorToast?: boolean;
}

export function useAsyncOperationRunner(
  setCurrentOperationMessage: (message: string | null) => void,
  defaultToastTitles: { success: string; error: string },
  startProcessingTransition: TransitionStartFunction
) {
  const { toast } = useToast();

  const run = async <TSuccessPayload = void>(
    config: AsyncOperationConfig<TSuccessPayload>
  ) => {
    const shouldManageMessage = config.manageOperationMessage !== false;

    if (shouldManageMessage && config.onStartMessage) {
      setCurrentOperationMessage(config.onStartMessage);
    }

    startProcessingTransition(async () => {
      try {
        const result = await config.operation();

        if (!config.suppressSuccessToast && config.onSuccessMessage) {
          const message =
            typeof config.onSuccessMessage === "function"
              ? config.onSuccessMessage(result)
              : config.onSuccessMessage;
          toast({
            title: config.successToastTitle || defaultToastTitles.success,
            description: message,
          });
        }
        config.onSuccessCallback?.(result);
      } catch (error: any) {
        console.error("Async operation runner caught an error:", error);
        if (!config.suppressErrorToast) {
          const message =
            typeof config.onErrorMessage === "function"
              ? config.onErrorMessage(error)
              : config.onErrorMessage ||
                error.message ||
                config.defaultErrorMessage ||
                "An unexpected error occurred.";
          toast({
            title: config.errorToastTitle || defaultToastTitles.error,
            description: message,
            variant: "destructive",
          });
        }
        config.onErrorCallback?.(error);
      } finally {
        if (shouldManageMessage) {
          setCurrentOperationMessage(null);
        }
        config.onFinallyCallback?.();
      }
    });
  };

  return { runAsyncOperation: run };
}
