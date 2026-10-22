"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarCodigoConversa = gerarCodigoConversa;
function gerarCodigoConversa() {
    return ("PET-" +
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase());
}
