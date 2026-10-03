import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  // Verificação 1: só aceita POST (senão, erro 405)
  if (request.method !== "POST") {
    return new Response("Método não permitido", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

    // Verificação 2: o corpo precisa ser um JSON válido com um número de 1 a 100 (senão, erro 400)
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return new Response("Corpo ausente ou JSON inválido", { status: 400 });
  }

  const numero = corpo?.numero;
  if (!numeroValido(numero)) {
    return new Response("O numero deve ser um inteiro entre 1 e 100", {
      status: 400,
    });
  }

    // Verificação 3: o token do Google precisa ser válido (senão, erro 401)
  const autorizacao = request.headers.get("Authorization") || "";
  const token = autorizacao.startsWith("Bearer ")
    ? autorizacao.slice(7).trim()
    : "";
  if (!token) {
    return new Response("Token ausente", { status: 401 });
  }

  let dados;
  try {
    const resposta = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(token)
    );
    if (resposta.status !== 200) {
      return new Response("Token inválido ou expirado", { status: 401 });
    }
    dados = await resposta.json();
  } catch {
    return new Response("Não foi possível validar o token", { status: 401 });
  }

  if (
    dados.aud !== env.GOOGLE_CLIENT_ID ||
    String(dados.email_verified) !== "true" ||
    !dados.email
  ) {
    return new Response("Token não aceito", { status: 401 });
  }

  const email = dados.email;

    // Tudo certo: gera o desenho assinado com o e-mail do Google (resposta 200)
  const svg = gerarDesenho(numero, email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
}