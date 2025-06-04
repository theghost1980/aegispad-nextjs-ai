import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VOICE_COMMANDS } from "@/constants/constants";

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, values?: Record<string, any>) => string; // Para traducciones
}

const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("voiceHelpModal.title")}</DialogTitle>
          <DialogDescription>
            {t("voiceHelpModal.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <h4 className="font-semibold text-md">
            {t("voiceHelpModal.commandListTitle")}
          </h4>
          <ul className="space-y-3">
            {VOICE_COMMANDS.map((cmd) => (
              <li key={cmd.action} className="text-sm">
                <p className="font-medium text-primary">
                  {cmd.keywords
                    .map((kw) => `"${kw}"`)
                    .join(
                      t("voiceHelpModal.orSeparator", { defaultValue: " or " })
                    )}
                </p>
                <p className="text-muted-foreground">
                  {t(`voiceHelpModal.${cmd.action}_desc` as any, {
                    defaultValue: `Description for ${cmd.action}`,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("voiceHelpModal.closeButton")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceHelpModal;
