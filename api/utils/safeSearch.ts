const API_USER = process.env.SIGHTENGINE_USER;
const API_SECRET = process.env.SIGHTENGINE_SECRET;

const MODELOS =
  'nudity-2.1,weapon,recreational_drug,medical,offensive-2.0,faces,face-age,gore-2.0,text,qr-content,tobacco,violence,self-harm,money,gambling';

// Recebe os bytes da foto enviada (upload) e manda direto para o Sightengine.
export async function verificaImagemSegura(imagem: Buffer, mimetype = 'image/jpeg') {
  console.log("Chamando Sightengine para upload de", imagem.length, "bytes"); // <-- LOG INÍCIO

  const form = new FormData();
  form.append('media', new Blob([new Uint8Array(imagem)], { type: mimetype }), 'foto');
  form.append('models', MODELOS);
  form.append('api_user', API_USER ?? '');
  form.append('api_secret', API_SECRET ?? '');

  const resposta = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(20000),
  });

  const result: any = await resposta.json();
  console.log("Sightengine result:", JSON.stringify(result, null, 2)); // <-- LOG RESULTADO

  // Se o serviço falhou, não dá para afirmar que a foto é segura: não deixa passar.
  if (!resposta.ok || result.status !== 'success') {
    throw new Error(`Sightengine falhou: ${result?.error?.message ?? resposta.status}`);
  }

  // Critérios PESADOS de bloqueio: bloqueia qualquer nudez, erotismo, sugestividade, armas, drogas, gore, ofensa, violência, etc.
  const improprio =
    (result.nudity && (
      result.nudity.raw > 0.1 ||
      result.nudity.partial > 0.1 ||
      result.nudity.erotica > 0.1 ||
      result.nudity.very_suggestive > 0.1 ||
      result.nudity.suggestive > 0.1
    )) ||
    (result.weapon && (result.weapon > 0.1 || (result.weapon.classes && Object.values(result.weapon.classes).some((v: any) => v > 0.1)))) ||
    (result.recreational_drug && (result.recreational_drug > 0.1 || (result.recreational_drug.prob && result.recreational_drug.prob > 0.1))) ||
    (result.gore && result.gore.prob > 0.1) ||
    (result.offensive && (result.offensive.prob > 0.1 || Object.values(result.offensive).some((v: any) => typeof v === 'number' && v > 0.1))) ||
    (result.violence && result.violence.prob > 0.1) ||
    (result["self-harm"] && result["self-harm"].prob > 0.1) ||
    (result.gambling && result.gambling.prob > 0.1) ||
    (result.tobacco && result.tobacco.prob > 0.1) ||
    (result.money && result.money.prob > 0.1);

  return !improprio;
}
