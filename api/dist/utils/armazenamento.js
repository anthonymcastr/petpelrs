"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarImagem = enviarImagem;
exports.removerImagens = removerImagens;
const cloudinary_1 = require("cloudinary");
const node_stream_1 = require("node:stream");
const cloudinaryConfigurado = Boolean(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);
if (cloudinaryConfigurado) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
async function enviarImagem(buffer, tipo) {
    if (!cloudinaryConfigurado) {
        throw new Error("Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder: "petpel/animais", resource_type: "image", format: tipo.split("/")[1] }, (erro, resultado) => {
            if (erro || !resultado)
                return reject(erro || new Error("Cloudinary não retornou a imagem"));
            resolve({ url: resultado.secure_url, publicId: resultado.public_id });
        });
        node_stream_1.Readable.from(buffer).pipe(stream);
    });
}
async function removerImagens(publicIds) {
    if (!cloudinaryConfigurado || publicIds.length === 0)
        return;
    await Promise.allSettled(publicIds.map((publicId) => cloudinary_1.v2.uploader.destroy(publicId, { resource_type: "image" })));
}
