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
import { useState } from "react";

export default function TestingsPage() {
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
      alert(
        "Por favor, introduce un nombre de usuario de Hive y los datos a codificar."
      );
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
      console.error("Error durante la encriptación/desencriptación:", e);
      setError(e.message || "Ocurrió un error desconocido.");
      setStatus("error");
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Página de Pruebas de Hive Keychain</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingKeychain ? (
              <SpinLoader message="Verificando Hive Keychain..." />
            ) : (
              <div className="space-y-4">
                <>
                  <p>
                    Hive Keychain disponible:{" "}
                    <span
                      className={
                        isKeychainAvailable
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {isKeychainAvailable ? "Sí" : "No"}
                    </span>
                  </p>

                  {!isKeychainAvailable && (
                    <div className="text-center p-4 border rounded-md text-red-600">
                      <p className="mb-2">
                        Hive Keychain no detectado. Necesitas instalar la
                        extensión para usar esta funcionalidad.
                      </p>
                      <a
                        href={HIVE_KEYCHAIN_INSTALL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        suppressHydrationWarning={true}
                        className="text-blue-600 hover:underline block mb-2"
                      >
                        🔗 Haz clic aquí para instalar Hive Keychain
                      </a>
                      <a
                        href={HIVE_KEYCHAIN_WEBSITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        suppressHydrationWarning={true}
                        className="text-blue-600 hover:underline block"
                      >
                        🌐 Visita la página oficial de Hive Keychain
                      </a>
                    </div>
                  )}

                  {isKeychainAvailable && (
                    <div className="space-y-3 border p-4 rounded-md">
                      <h3 className="font-semibold">
                        Prueba de Encriptación → Desencriptación
                      </h3>
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Tu nombre de usuario de Hive"
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
                        placeholder="Datos a encriptar (ej: tu clave API)"
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
                        {status === "idle" && "Iniciar Prueba"}
                        {status === "encoding" && "Encriptando..."}
                        {status === "decoding" && "Desencriptando..."}
                        {status === "success" && "Prueba Exitosa (Reiniciar)"}
                        {status === "error" && "Error (Reintentar)"}
                      </Button>

                      {status !== "idle" && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>
                            Estado:{" "}
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
                              Datos Originales: <code>{dataToEncode}</code>
                            </p>
                          )}

                          {encodedData && (
                            <div>
                              <div className="flex items-center gap-1">
                                <p>Datos Encriptados:</p>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs text-xs p-2"
                                  >
                                    <p className="font-semibold mb-1">
                                      Información de Encriptación:
                                    </p>
                                    <p>
                                      Hive Keychain usa AES-256 (derivado de tus
                                      claves de Hive vía ECDH) para proteger
                                      este dato. El prefijo '#' indica un
                                      mensaje encriptado.
                                    </p>
                                    <p className="mt-1 font-semibold">
                                      Seguridad:
                                    </p>
                                    <p>
                                      Descifrar esto por fuerza bruta es
                                      inviable. La seguridad depende de la
                                      custodia de tu clave privada de Hive. Si
                                      tu clave privada se compromete, este dato
                                      puede ser desencriptado. MANTEN TUS CLAVES
                                      DE HIVE SEGURAS!
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="w-full overflow-x-auto rounded-md bg-muted p-2 text-sm font-mono text-muted-foreground">
                                <code>{encodedData}</code>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                Esta es la cadena que se guardará localmente
                                (encriptada).
                              </p>
                            </div>
                          )}

                          {decodedData && (
                            <p>
                              Datos Desencriptados: <code>{decodedData}</code>
                            </p>
                          )}

                          {error && (
                            <p className="text-red-600">Error: {error}</p>
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
