import { JWT_SECRET } from "@/config/server-config";
import {
  JWT_ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
} from "@/constants/constants";
import jwt from "jsonwebtoken";
import ms from "ms"; // Importar la librería ms
import { NextRequest, NextResponse } from "next/server";

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

    // Convertir el string de expiración del access token a segundos
    const accessTokenExpiresInMs = ms(JWT_ACCESS_TOKEN_EXPIRES_IN);
    if (typeof accessTokenExpiresInMs !== "number") {
      console.error(
        `Invalid time string for JWT_ACCESS_TOKEN_EXPIRES_IN: ${JWT_ACCESS_TOKEN_EXPIRES_IN}`
      );
      throw new Error("Invalid access token expiration configuration.");
    }
    const accessTokenExpiresInSeconds = accessTokenExpiresInMs / 1000;

    const accessTokenOptions: jwt.SignOptions = {
      expiresIn: accessTokenExpiresInSeconds,
    };
    const newAccessToken = jwt.sign(
      newAccessTokenPayload,
      JWT_SECRET!,
      accessTokenOptions
    );

    // 3. Generar un nuevo refreshToken (rotación)
    const newRefreshTokenPayload: {
      sub: string;
      username: string;
      role?: string;
    } = {
      sub: payload.sub,
      username: payload.username,
    };
    if (payload.role) {
      newRefreshTokenPayload.role = payload.role;
    }

    // Convertir el string de expiración del refresh token a segundos
    const refreshTokenExpiresInMs = ms(JWT_REFRESH_TOKEN_EXPIRES_IN as any);
    if (typeof refreshTokenExpiresInMs !== "number") {
      console.error(
        `Invalid time string for JWT_REFRESH_TOKEN_EXPIRES_IN: ${JWT_REFRESH_TOKEN_EXPIRES_IN}`
      );
      throw new Error("Invalid refresh token expiration configuration.");
    }
    const refreshTokenExpiresInSeconds = refreshTokenExpiresInMs / 1000;

    const refreshTokenOptions: jwt.SignOptions = {
      expiresIn: refreshTokenExpiresInSeconds,
    };
    const newRefreshToken = jwt.sign(
      newRefreshTokenPayload,
      JWT_SECRET!,
      refreshTokenOptions
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
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
