"use client";

import { Button } from "@/components/ui/button"; // Asumiendo que tienes un componente Button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Asumiendo que tienes un componente Input
import { KEYCHAIN_ENCRYPTION_TEST_MESSAGE } from "@/constants/constants";
import { useGeminiKeyManager } from "@/hooks/use-gemini-key-manager"; // Ajusta la ruta si es necesario
import { useState } from "react";

export default function TestingsPage() {
  const { isKeychainAvailable, testEncodeMessage, testDecodeMessage } =
    useGeminiKeyManager();
  const [username, setUsername] = useState("");
  const [encodedMessage, setEncodedMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestEncodeAndDecode = () => {
    if (username.trim()) {
      setIsTesting(true);
      setEncodedMessage(null); // Limpiar mensaje codificado anterior
      console.log("Iniciando prueba de Codificación -> Decodificación...");
      testEncodeMessage(username.trim(), (encodedMsg) => {
        console.log(
          "Codificación exitosa. Mensaje codificado recibido:",
          encodedMsg
        );
        setEncodedMessage(encodedMsg); // Guardar el mensaje codificado en estado
        testDecodeMessage(username.trim(), encodedMsg); // Iniciar la decodificación
        setIsTesting(false); // Finalizar el estado de prueba después de iniciar la decodificación
      });
    } else {
      alert("Por favor, introduce un nombre de usuario de Hive.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Página de Pruebas de Hive Keychain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {isKeychainAvailable && (
            <div className="space-y-3 border p-4 rounded-md">
              <h3 className="font-semibold">
                Prueba de Flujo Codificación → Decodificación
              </h3>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario de Hive"
                disabled={isTesting}
              />
              <Button
                onClick={handleTestEncodeAndDecode}
                className="w-full"
                disabled={isTesting || !username.trim()}
              >
                {isTesting ? "Probando..." : "Iniciar Prueba"}
              </Button>
              {encodedMessage && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    Mensaje original codificado:{" "}
                    <code>{KEYCHAIN_ENCRYPTION_TEST_MESSAGE}</code>
                  </p>
                  <p>
                    Mensaje codificado (desde encode):{" "}
                    <code>{encodedMessage}</code>
                  </p>
                  <p>Revisa la consola para la respuesta de decodificación.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
