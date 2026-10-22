import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export function autentica(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn("[auth] Token não fornecido", {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.warn("[auth] Header de autorização sem token", {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({ erro: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_KEY || "segredo",
    ) as {
      id?: number;
      clienteLogadoId?: number;
      role?: string;
      clienteLogadoRole?: string;
    };

    const id = decoded.id ?? decoded.clienteLogadoId;
    const role = decoded.role ?? decoded.clienteLogadoRole;

    if (!id || !role) {
      console.warn("[auth] Token sem id ou role", {
        method: req.method,
        path: req.originalUrl,
      });
      return res.status(401).json({ erro: "Token inválido" });
    }

    req.user = { id, role };
    console.info("[auth] Token validado", {
      method: req.method,
      path: req.originalUrl,
      usuarioId: id,
      role,
    });
    next();
  } catch (error) {
    console.error("[auth] Falha ao validar token", {
      method: req.method,
      path: req.originalUrl,
      erro: error instanceof Error ? error.message : error,
    });
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}
