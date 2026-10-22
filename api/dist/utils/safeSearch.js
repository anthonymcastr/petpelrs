"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaImagemSegura = verificaImagemSegura;
const axios_1 = __importDefault(require("axios"));
const API_USER = process.env.SIGHTENGINE_USER;
const API_SECRET = process.env.SIGHTENGINE_SECRET;
async function verificaImagemSegura(url) {
    console.log("Chamando Sightengine para:", url); // <-- LOG INÍCIO
    const response = await axios_1.default.get('https://api.sightengine.com/1.0/check.json', {
        params: {
            url,
            models: 'nudity-2.1,weapon,recreational_drug,medical,offensive-2.0,faces,face-age,gore-2.0,text,qr-content,tobacco,violence,self-harm,money,gambling',
            api_user: API_USER,
            api_secret: API_SECRET,
        },
    });
    const result = response.data;
    console.log("Sightengine result:", JSON.stringify(result, null, 2)); // <-- LOG RESULTADO
    // Critérios PESADOS de bloqueio: bloqueia qualquer nudez, erotismo, sugestividade, armas, drogas, gore, ofensa, violência, etc.
    const improprio = (result.nudity && (result.nudity.raw > 0.1 ||
        result.nudity.partial > 0.1 ||
        result.nudity.erotica > 0.1 ||
        result.nudity.very_suggestive > 0.1 ||
        result.nudity.suggestive > 0.1)) ||
        (result.weapon && (result.weapon > 0.1 || (result.weapon.classes && Object.values(result.weapon.classes).some((v) => v > 0.1)))) ||
        (result.recreational_drug && (result.recreational_drug > 0.1 || (result.recreational_drug.prob && result.recreational_drug.prob > 0.1))) ||
        (result.gore && result.gore.prob > 0.1) ||
        (result.offensive && (result.offensive.prob > 0.1 || Object.values(result.offensive).some((v) => typeof v === 'number' && v > 0.1))) ||
        (result.violence && result.violence.prob > 0.1) ||
        (result["self-harm"] && result["self-harm"].prob > 0.1) ||
        (result.gambling && result.gambling.prob > 0.1) ||
        (result.tobacco && result.tobacco.prob > 0.1) ||
        (result.money && result.money.prob > 0.1);
    return !improprio;
}
