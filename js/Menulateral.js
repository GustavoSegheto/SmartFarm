// js/Menulateral.js
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  await verificarSessao();
});

async function verificarSessao() {
  try {
    const resp = await fetch("/api/sessao", { credentials: "same-origin" });

    if (!resp.ok) {
      window.location.href = "/";
      return;
    }

    const data = await resp.json();

    if (!data.authenticated || !data.user) {
      window.location.href = "/";
      return;
    }

    // Sessão ok - página pode ser exibida
    console.log("Usuário autenticado:", data.user.nome);
    
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "/";
  }
}
