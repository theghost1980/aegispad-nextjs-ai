import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

export interface AsyncOperationConfig<TSuccessPayload = void> {
  /** La función asíncrona principal a ejecutar. Se espera que lance un error en caso de fallo. */
  operation: () => Promise<TSuccessPayload>;

  /** Si es `true` (por defecto), el hook gestionará el mensaje de operación (inicio y limpieza).
   *  Si es `false`, se asume que la `operation` misma gestiona sus mensajes intermedios. */
  manageOperationMessage?: boolean;
  /** Mensaje para mostrar en el GlobalLoader mientras se procesa (usado si `manageOperationMessage` es `true`). */
  onStartMessage?: string;

  /** Mensaje para el toast de éxito. Puede ser un string o una función que recibe el resultado de la operación. */
  onSuccessMessage?: string | ((payload: TSuccessPayload) => string);
  /** Título para el toast de éxito. Por defecto, usará el título de éxito genérico proporcionado al hook. */
  successToastTitle?: string;

  /** Mensaje para el toast de error. Puede ser un string o una función que recibe el error. */
  onErrorMessage?: string | ((error: any) => string);
  /** Título para el toast de error. Por defecto, usará el título de error genérico proporcionado al hook. */
  errorToastTitle?: string;
  /** Mensaje de error por defecto si la operación lanza un error sin mensaje. */
  defaultErrorMessage?: string;

  /** Callback ejecutado después de una operación exitosa (ej. para actualizaciones de estado). */
  onSuccessCallback?: (payload: TSuccessPayload) => void;
  /** Callback ejecutado después de una operación fallida. */
  onErrorCallback?: (error: any) => void;
  /** Callback ejecutado en el bloque `finally`, después del manejo de éxito o error (ej. para limpiar acciones activas). */
  onFinallyCallback?: () => void;

  /** Opcional: Si es `true`, no mostrará un toast de éxito. */
  suppressSuccessToast?: boolean;
  /** Opcional: Si es `true`, no mostrará un toast de error. */
  suppressErrorToast?: boolean;
}

export function useAsyncOperationRunner(
  /** Setter para el mensaje del cargador global. */
  setCurrentOperationMessage: (message: string | null) => void,
  /** Traducciones para los títulos de toast por defecto. */
  defaultToastTitles: { success: string; error: string }
) {
  const [, startProcessingTransition] = useTransition();
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
        // Es buena práctica loguear el error real para depuración.
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
