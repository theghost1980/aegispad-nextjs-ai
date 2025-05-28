import { JWT_SECRET } from "@/config/server-config";
import {
  JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
} from "@/constants/constants";
import { getHiveAccount } from "@/lib/hive/server-utils"; // Nuestra nueva utilidad
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { Signature } from "@hiveio/dhive";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAMES = process.env.ADMIN_USERNAMES?.split(",") || [];

export async function POST(request: NextRequest) {
  try {
    const { username, challenge, signature } = await request.json();

    if (!username || !challenge || !signature) {
      return NextResponse.json(
        { message: "Username, challenge, and signature are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    // 1. Verificar el challenge en Supabase
    const { data: challengeData, error: challengeError } = await supabase
      .from("auth_challenges")
      .select("id, challenge_string, expires_at")
      .eq("hive_username", username)
      .eq("challenge_string", challenge)
      .single(); // Esperamos solo uno o ninguno

    if (challengeError || !challengeData) {
      console.error("Challenge verification error:", challengeError);
      return NextResponse.json(
        { message: "Invalid or expired challenge." },
        { status: 401 }
      );
    }

    if (new Date(challengeData.expires_at) < new Date()) {
      // Opcional: Eliminar challenge expirado
      await supabase
        .from("auth_challenges")
        .delete()
        .eq("id", challengeData.id);
      return NextResponse.json(
        { message: "Challenge has expired." },
        { status: 401 }
      );
    }

    // 2. Verificar la firma
    let signatureBuffer: Buffer;
    try {
      signatureBuffer = Buffer.from(signature, "hex");
      if (signatureBuffer.length !== 65) {
        throw new Error("Signature buffer has incorrect length.");
      }
    } catch (bufferError: any) {
      return NextResponse.json(
        { message: "Invalid signature format." },
        { status: 400 }
      );
    }

    const dhiveSig = Signature.fromBuffer(signatureBuffer);
    const challengeHash = crypto
      .createHash("sha256")
      .update(challenge) // Usamos el challenge original
      .digest();

    const recoveredPubKey = dhiveSig.recover(challengeHash);
    const recoveredPubKeyString = recoveredPubKey.toString();

    const account = await getHiveAccount(username);
    if (!account) {
      return NextResponse.json(
        { message: "Hive account not found." },
        { status: 404 }
      );
    }

    const userPostingKeys =
      account.posting?.key_auths?.map(([key]) => key.toString()) || [];

    if (!userPostingKeys.includes(recoveredPubKeyString)) {
      return NextResponse.json(
        { message: "Signature verification failed. Key mismatch." },
        { status: 401 }
      );
    }

    // 3. Autenticación exitosa, eliminar challenge usado
    await supabase.from("auth_challenges").delete().eq("id", challengeData.id);

    // 4. Buscar o crear perfil en Supabase
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, hive_username, user_role, theme_preference, login_redirect_preference"
      ) // Seleccionar nuevas preferencias
      .eq("hive_username", username)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116: no rows returned
      throw profileError;
    }

    const determinedRole = ADMIN_USERNAMES.includes(username)
      ? "admin"
      : "user";

    if (!profile) {
      const { data: newProfile, error: insertProfileError } = await supabase
        .from("profiles")
        .insert({
          hive_username: username,
          last_login_at: new Date().toISOString(),
          user_role: determinedRole,
          theme_preference: "system",
          login_redirect_preference: "/",
        })
        .select(
          "id, hive_username, user_role, theme_preference, login_redirect_preference"
        )
        .single();
      if (insertProfileError) throw insertProfileError;
      profile = newProfile;
    } else {
      await supabase
        .from("profiles")
        .update({
          last_login_at: new Date().toISOString(),
          user_role: determinedRole,
        })
        .eq("id", profile.id);

      profile.user_role = determinedRole;
      profile.theme_preference = profile.theme_preference || "system";
      profile.login_redirect_preference =
        profile.login_redirect_preference || "/";
    }

    if (!profile) throw new Error("Failed to get or create user profile.");

    // 5. Generar JWTs
    const tokenPayload: {
      sub: string;
      username: string;
      role?: string;
    } = {
      sub: profile.id,
      username: profile.hive_username,
      role: profile.user_role,
    };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET!!, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(tokenPayload, JWT_SECRET!, {
      expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
    });

    // 6. Almacenar hash del refresh token (Implementación pendiente si decides hacerlo en DB)
    // Por ahora, solo devolvemos el refresh token para que el cliente lo guarde en IndexedDB.
    // Si lo guardas en DB, aquí iría la lógica para hashearlo e insertarlo en `refresh_tokens`.

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        username: profile.hive_username,
        id: profile.id,
        role: profile.user_role,
        theme_preference: profile.theme_preference,
        login_redirect_preference: profile.login_redirect_preference,
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        message: "An unexpected server error occurred.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
