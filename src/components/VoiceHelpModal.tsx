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
import { defaultLocale } from "@/i18n/config";
import { useLocale } from "next-intl";

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, values?: Record<string, any>) => string;
  userRole: string | null;
}

const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({
  isOpen,
  onClose,
  t,
  userRole,
}) => {
  const locale = useLocale();
  const baseLanguage = locale.split("-")[0];

  const punctuationRulesToUse =
    VOICE_PUNCTUATION_MAP[locale as keyof typeof VOICE_PUNCTUATION_MAP] ||
    VOICE_PUNCTUATION_MAP[baseLanguage as keyof typeof VOICE_PUNCTUATION_MAP] ||
    VOICE_PUNCTUATION_MAP["en-US"] ||
    VOICE_PUNCTUATION_MAP["en"] ||
    [];

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
            {VOICE_COMMANDS.filter((cmd) => {
              if (cmd.action === "CMD_CREATE_ARTICLE") {
                return userRole === "admin";
              }
              return true;
            }).map((cmd) =>
              (() => {
                const langKeywords =
                  cmd.keywords[locale] || // ej. "es-ES"
                  cmd.keywords[baseLanguage] || // ej. "es"
                  cmd.keywords[defaultLocale] || // ej. "en-US" (del i18n config)
                  cmd.keywords["en-US"] || // Fallback duro a en-US
                  cmd.keywords["en"]; // Fallback duro a en

                return (
                  <li key={cmd.action} className="text-sm">
                    <p className="font-medium text-primary">
                      {(langKeywords || [])
                        .map((kw) => `"${kw}"`)
                        .join(
                          t("voiceHelpModal.orSeparator", {
                            defaultValue: " or ",
                          })
                        )}
                    </p>
                    <p className="text-muted-foreground">
                      {t(`voiceHelpModal.${cmd.action}_desc` as any, {
                        defaultValue: `Description for ${cmd.action}`,
                      })}
                    </p>
                  </li>
                );
              })()
            )}
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
                  {punctuationRulesToUse.map((rule) => (
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
