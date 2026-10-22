"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
exports.enviarEmail = enviarEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});
async function enviarEmail(destinatario, assunto, corpoHtml) {
    console.log("=== TENTANDO ENVIAR EMAIL ===");
    console.log("GMAIL_USER:", process.env.GMAIL_USER ? "DEFINIDO" : "NÃO DEFINIDO");
    console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "DEFINIDO" : "NÃO DEFINIDO");
    console.log("Destinatário:", destinatario);
    try {
        const info = await exports.transporter.sendMail({
            from: `"PetPel" <${process.env.GMAIL_USER}>`,
            to: destinatario,
            subject: assunto,
            html: corpoHtml
        });
        console.log("✅ E-mail enviado com sucesso:", info.messageId);
        return info;
    }
    catch (error) {
        console.error("❌ Erro ao enviar e-mail:", error);
        throw error;
    }
}
