"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Coins } from "lucide-react";
import type { FC } from "react";

interface EditorTokenUsageProps {
  currentRequestTokens: number | null;
  detailedTokenUsage: { text?: number; image?: number } | null;
  sessionTotalTokens: number;
  estimatedInitialSessionTokens: number;
  tokensLeftInSession: number;
  tTokenUsage: (
    key: keyof IntlMessages["TokenUsage"],
    values?: Record<string, any>
  ) => string;
}

const EditorTokenUsage: FC<EditorTokenUsageProps> = ({
  currentRequestTokens,
  detailedTokenUsage,
  sessionTotalTokens,
  estimatedInitialSessionTokens,
  tokensLeftInSession,
  tTokenUsage,
}) => {
  const renderTokenUsageDetails = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tTokenUsage("lastOp")}</span>
        <span className="font-semibold">
          {currentRequestTokens?.toLocaleString() ?? "N/A"}
        </span>
      </div>
      {(detailedTokenUsage?.text || detailedTokenUsage?.image) && (
        <div className="pl-2 text-xs">
          {detailedTokenUsage.text !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {tTokenUsage("textTokens")}
              </span>
              <span className="font-semibold">
                {detailedTokenUsage.text.toLocaleString()}
              </span>
            </div>
          )}
          {detailedTokenUsage.image !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {tTokenUsage("imageTokens")}
              </span>
              <span className="font-semibold">
                {detailedTokenUsage.image.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {tTokenUsage("sessionTotal")}
        </span>
        <span className="font-semibold">
          {sessionTotalTokens.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {tTokenUsage("sessionQuota")}
        </span>
        <span className="font-semibold">
          {estimatedInitialSessionTokens.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {tTokenUsage("estRemaining")}
        </span>
        <span
          className={`font-semibold ${
            tokensLeftInSession <= 0 ? "text-destructive" : "text-foreground"
          }`}
        >
          {tokensLeftInSession.toLocaleString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-xs">
      {" "}
      {/* Ajustado para Popover, sin márgenes externos */}
      {/* Ajustado para el flujo del documento */}
      <Accordion
        type="single"
        collapsible
        className="w-full bg-card text-card-foreground shadow-lg rounded-lg border"
      >
        <AccordionItem value="token-stats" className="border-b-0 rounded-lg">
          <AccordionTrigger className="flex w-full items-center justify-between rounded-t-lg p-4 text-left hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:border-b">
            <div className="flex items-center text-lg font-semibold">
              <Coins className="mr-2 h-5 w-5 text-primary" />
              {tTokenUsage("title")}
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 data-[state=closed]:p-0">
            {renderTokenUsageDetails()}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default EditorTokenUsage;
