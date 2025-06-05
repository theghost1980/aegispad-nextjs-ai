import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VOICE_COMMANDS, VOICE_PUNCTUATION_MAP } from "@/constants/constants";
import { useLocale } from "next-intl";

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, values?: Record<string, any>) => string;
}

const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const locale = useLocale();
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

          <Accordion type="single" collapsible className="w-full mt-6">
            <AccordionItem value="punctuation-commands">
              <AccordionTrigger className="font-semibold text-md py-3 hover:no-underline">
                {t("voiceHelpModal.punctuation_commands_title")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3 pt-2">
                  {t("voiceHelpModal.punctuation_commands_desc")}
                </p>
                <ul className="space-y-3">
                  {(
                    VOICE_PUNCTUATION_MAP[locale] || VOICE_PUNCTUATION_MAP["en"]
                  ).map((rule) => (
                    <li key={rule.key} className="text-sm">
                      <p className="font-medium text-primary">{`"${rule.word_detection}"`}</p>
                      <p className="text-muted-foreground">
                        {t(`voiceHelpModal.${rule.key}_desc` as any, {
                          defaultValue: `Inserts "${rule.char_sign}"`,
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("voiceHelpModal.closeButton")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceHelpModal;
