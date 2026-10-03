// script.js
// O navegador só envia o número e o token do Google para o servidor
// e mostra o desenho que o servidor devolver.

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let tokenAtual = "";
let svgAtual = "";

// O Google chama esta função quando a pessoa entra com a conta dela.
window.aoEntrar = (resposta) => {
  tokenAtual = resposta.credential;
  mensagem.textContent = "Login feito com sucesso. Agora é só desenhar.";
};

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  const numero = Number(campoNumero.value);

  const cabecalhos = { "Content-Type": "application/json" };
  if (tokenAtual) {
    cabecalhos.Authorization = "Bearer " + tokenAtual;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: digite um número inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent =
        "Erro 401: entre com o Google antes de desenhar. Se você já entrou, faça o login de novo, porque ele pode ter expirado.";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent =
        "Erro " + resposta.status + ": não foi possível gerar o desenho.";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    mensagem.textContent = "Não foi possível falar com o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});