"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SpinLoader from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HIVE_KEYCHAIN_INSTALL_URL,
  HIVE_KEYCHAIN_WEBSITE_URL,
} from "@/constants/constants";
import { useGeminiKeyManager } from "@/hooks/use-gemini-key-manager";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function TestingsPage() {
  const t = useTranslations("TestingsPage");
  const tErrorHook = useTranslations("GeminiKeyManagerErrors");
  const { isKeychainAvailable, encodeData, decodeData, isLoadingKeychain } =
    useGeminiKeyManager();
  const [username, setUsername] = useState("");
  const [dataToEncode, setDataToEncode] = useState("");
  const [encodedData, setEncodedData] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "encoding" | "decoding" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleTestEncodeAndDecode = async () => {
    if (!username.trim() || !dataToEncode.trim()) {
      alert(t("alertInputsRequired"));
      return;
    }

    setStatus("encoding");
    setEncodedData(null);
    setDecodedData(null);
    setError(null);

    try {
      const encoded = await encodeData(username.trim(), dataToEncode.trim());
      setEncodedData(encoded);
      setStatus("decoding");
      const decoded = await decodeData(username.trim(), encoded);
      setDecodedData(decoded);
      setStatus("success");
    } catch (e: any) {
      console.log("error: ", { e }); //TODO REMOVE
      console.error(t("errorLabel"), e);
      // Intenta traducir el mensaje de error si es una clave conocida, sino usa un fallback
      try {
        setError(tErrorHook(e.message as any));
      } catch (translationError) {
        // Si e.message no es una clave válida en tErrorHook, usa un mensaje genérico
        setError(t("unknownError"));
      }
      setStatus("error");
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingKeychain ? (
              <SpinLoader message={t("loaderMessage")} />
            ) : (
              <div className="space-y-4">
                <>
                  <p>
                    {t("keychainAvailable")}{" "}
                    <span
                      className={
                        isKeychainAvailable
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {isKeychainAvailable ? t("yes") : t("no")}
                    </span>
                  </p>

                  {!isKeychainAvailable && (
                    <div className="text-center p-4 border rounded-md text-red-600">
                      <p className="mb-2">{t("keychainNotDetected")}</p>
                      <a
                        href={HIVE_KEYCHAIN_INSTALL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        suppressHydrationWarning={true}
                        className="text-blue-600 hover:underline block mb-2"
                      >
                        {t("installLink")}
                      </a>
                      <a
                        href={HIVE_KEYCHAIN_WEBSITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        suppressHydrationWarning={true}
                        className="text-blue-600 hover:underline block"
                      >
                        {t("websiteLink")}
                      </a>
                    </div>
                  )}

                  {isKeychainAvailable && (
                    <div className="space-y-3 border p-4 rounded-md">
                      <h3 className="font-semibold">{t("testSectionTitle")}</h3>
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t("usernamePlaceholder")}
                        disabled={
                          status !== "idle" &&
                          status !== "success" &&
                          status !== "error"
                        }
                      />
                      <Input
                        type="text"
                        value={dataToEncode}
                        onChange={(e) => setDataToEncode(e.target.value)}
                        placeholder={t("dataPlaceholder")}
                        disabled={
                          status !== "idle" &&
                          status !== "success" &&
                          status !== "error"
                        }
                      />
                      <Button
                        onClick={handleTestEncodeAndDecode}
                        className="w-full"
                        disabled={
                          (status !== "idle" &&
                            status !== "success" &&
                            status !== "error") ||
                          !username.trim() ||
                          !dataToEncode.trim()
                        }
                      >
                        {status === "idle" && t("buttonInitial")}
                        {status === "encoding" && t("buttonEncoding")}
                        {status === "decoding" && t("buttonDecoding")}
                        {status === "success" && t("buttonSuccess")}
                        {status === "error" && t("buttonError")}
                      </Button>

                      {status !== "idle" && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>
                            {t("statusLabel")}{" "}
                            <span
                              className={`font-semibold ${
                                status === "success"
                                  ? "text-green-600"
                                  : status === "error"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </p>

                          {dataToEncode && (
                            <p>
                              {t("originalDataLabel")}{" "}
                              <code>{dataToEncode}</code>
                            </p>
                          )}

                          {encodedData && (
                            <div>
                              <div className="flex items-center gap-1">
                                <p>{t("encryptedDataLabel")}</p>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs text-xs p-2"
                                  >
                                    <p className="font-semibold mb-1">
                                      {t("tooltipEncryptionTitle")}
                                    </p>
                                    <p>{t("tooltipEncryptionBody")}</p>
                                    <p className="mt-1 font-semibold">
                                      {t("tooltipSecurityTitle")}
                                    </p>
                                    <p>{t("tooltipSecurityBody")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="w-full overflow-x-auto rounded-md bg-muted p-2 text-sm font-mono text-muted-foreground">
                                <code>{encodedData}</code>
                                <p className="mt-1 text-xs text-gray-500">
                                  {t("storageNote")}
                                </p>
                              </div>
                            </div>
                          )}

                          {decodedData && (
                            <p>
                              {t("decryptedDataLabel")}{" "}
                              <code>{decodedData}</code>
                            </p>
                          )}

                          {error && (
                            <p className="text-red-600">
                              {t("errorLabel")} {error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
