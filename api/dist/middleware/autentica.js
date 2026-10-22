"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autentica = autentica;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function autentica(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || process.env.JWT_KEY || "segredo");
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
    }
    catch (error) {
        console.error("[auth] Falha ao validar token", {
            method: req.method,
            path: req.originalUrl,
            erro: error instanceof Error ? error.message : error,
        });
        return res.status(401).json({ erro: "Token inválido ou expirado" });
    }
}
