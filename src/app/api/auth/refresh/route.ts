import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_TOKEN_EXPIRES_IN = "15m";
// const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d'; // No necesitamos generar un nuevo refresh token aquí necesariamente

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined. Please set it in your environment variables."
  );
}

interface RefreshTokenPayload {
  sub: string; // profile.id
  username: string;
  iat: number;
  exp: number;
  role?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token is required." },
        { status: 400 }
      );
    }

    // 1. Verificar el refresh token
    let decodedPayload: string | jwt.JwtPayload;
    try {
      decodedPayload = jwt.verify(refreshToken, JWT_SECRET!);
    } catch (error) {
      console.error("Invalid refresh token:", error);
      return NextResponse.json(
        { message: "Invalid or expired refresh token." },
        { status: 401 }
      );
    }

    // Verificar que el payload decodificado sea un objeto y tenga las propiedades esperadas
    if (
      typeof decodedPayload === "string" ||
      !decodedPayload ||
      typeof decodedPayload.sub !== "string" ||
      typeof decodedPayload.username !== "string"
    ) {
      return NextResponse.json(
        { message: "Invalid refresh token payload." },
        { status: 401 }
      );
    }

    const payload = decodedPayload as RefreshTokenPayload;

    // Opcional: Verificar si el refresh token existe en la tabla `refresh_tokens` de Supabase
    // si implementaste el guardado de hashes. Por ahora, omitimos este paso.
    // const supabase = createSupabaseServiceRoleClient();
    // const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    // const { data: storedToken, error: storedTokenError } = await supabase
    //   .from('refresh_tokens')
    //   .select('id')
    //   .eq('token_hash', hashedToken)
    //   .eq('profile_id', payload.sub) // Asegurar que pertenece al usuario
    //   .single();
    // if (storedTokenError || !storedToken) {
    //   return NextResponse.json({ message: 'Refresh token not found or revoked.' }, { status: 401 });
    // }

    // 2. Generar un nuevo accessToken
    const newAccessTokenPayload: {
      sub: string;
      username: string;
      role?: string;
    } = {
      sub: payload.sub,
      username: payload.username,
    };
    if (payload.role) {
      newAccessTokenPayload.role = payload.role;
    }
    const newAccessToken = jwt.sign(newAccessTokenPayload, JWT_SECRET!, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
    });

    return NextResponse.json({ accessToken: newAccessToken });
  } catch (error: any) {
    console.error("Refresh token API error:", error);
    return NextResponse.json(
      {
        message: "An unexpected server error occurred.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
