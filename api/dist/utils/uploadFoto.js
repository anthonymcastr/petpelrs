"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FOTOS = exports.LIMITE_FOTO_BYTES = void 0;
exports.receberFotos = receberFotos;
exports.receberLogo = receberLogo;
exports.fotosRecebidas = fotosRecebidas;
exports.logoRecebida = logoRecebida;
exports.tipoDaImagem = tipoDaImagem;
const multer_1 = __importDefault(require("multer"));
exports.LIMITE_FOTO_BYTES = 4 * 1024 * 1024;
exports.MAX_FOTOS = 6;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: exports.LIMITE_FOTO_BYTES, files: exports.MAX_FOTOS },
});
const uploadLogo = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: exports.LIMITE_FOTO_BYTES, files: 1 },
});
function receberFotos(req, res, next) {
    upload.array("fotos", exports.MAX_FOTOS)(req, res, (erro) => {
        if (!erro)
            return next();
        if (erro instanceof multer_1.default.MulterError) {
            if (erro.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ erro: "A foto é grande demais. Use uma imagem de até 4 MB." });
            }
            if (erro.code === "LIMIT_FILE_COUNT" || erro.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({ erro: `Envie no máximo ${exports.MAX_FOTOS} fotos.` });
            }
        }
        console.error("Erro ao receber fotos:", erro);
        return res.status(400).json({ erro: "Não foi possível ler as fotos enviadas." });
    });
}
function receberLogo(req, res, next) {
    uploadLogo.single("logo")(req, res, (erro) => {
        if (!erro)
            return next();
        if (erro instanceof multer_1.default.MulterError && erro.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ erro: "A imagem é grande demais. Use uma imagem de até 4 MB." });
        }
        console.error("Erro ao receber logo:", erro);
        return res.status(400).json({ erro: "Não foi possível ler a imagem enviada." });
    });
}
function fotosRecebidas(req) {
    return Array.isArray(req.files) ? req.files : [];
}
function logoRecebida(req) {
    return req.file;
}
function tipoDaImagem(buffer) {
    if (buffer.length > 12 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        return "image/jpeg";
    if (buffer.length > 12 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
        return "image/png";
    if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
        return "image/webp";
    return null;
}
