// js/Usuarios.js
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("usuarios-tbody");
  const alertBox = document.getElementById("usuarios-alert");

  async function carregarUsuarios() {
    try {
      const response = await fetch("/api/usuarios");
      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        mostrarAlerta(
          result.message || "Erro ao carregar lista de usuários.",
          "error"
        );
        return;
      }

      const usuarios = result.data || [];

      if (usuarios.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="table__empty">Nenhum usuário cadastrado.</td></tr>';
        return;
      }

      tbody.innerHTML = "";
      usuarios.forEach((user) => {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.textContent = user.ID_usuario;

        const tdNome = document.createElement("td");
        tdNome.textContent = user.nome;

        const tdEmail = document.createElement("td");
        tdEmail.textContent = user.email;

        const tdTelefone = document.createElement("td");
        tdTelefone.textContent = user.telefone || "-";

        tr.appendChild(tdId);
        tr.appendChild(tdNome);
        tr.appendChild(tdEmail);
        tr.appendChild(tdTelefone);

        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      mostrarAlerta("Erro ao se comunicar com o servidor.", "error");
    }
  }

  function mostrarAlerta(mensagem, tipo) {
    if (!alertBox) return;
    alertBox.textContent = mensagem;
    alertBox.classList.remove("alert--hidden", "alert--error", "alert--info");
    alertBox.classList.add(tipo === "error" ? "alert--error" : "alert--info");
  }

  carregarUsuarios();
});
