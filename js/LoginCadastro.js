// js/LoginCadastro.js
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".card");
  const loginButton = document.querySelector(".loginButton");
  const cadastroButton = document.querySelector(".cadastroButton");

  // Alternar abas Login / Cadastro
  if (card && loginButton && cadastroButton) {
    loginButton.addEventListener("click", () => {
      card.classList.remove("cadastroActive");
      card.classList.add("loginActive");
    });

    cadastroButton.addEventListener("click", () => {
      card.classList.remove("loginActive");
      card.classList.add("cadastroActive");
    });
  }

  // ============================
  // FORMULÁRIO DE LOGIN
  // ============================
  const formLoginContainer = document.querySelector(".FormLogin");
  const formLogin = formLoginContainer
    ? formLoginContainer.querySelector("form")
    : null;

  if (formLogin) {
    formLogin.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(formLogin);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            senha: data.senha,
          }),
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
          showFeedback(
            result.message || "Login realizado com sucesso!",
            "success"
          );

          if (result.redirect) {
            setTimeout(() => {
              window.location.href = result.redirect;
            }, 800); // pequeno delay para ver o popup
          }
        } else {
          showFeedback(
            result.message || "E-mail ou senha inválidos.",
            "error"
          );
        }
      } catch (error) {
        console.error("Erro ao realizar login:", error);
        showFeedback("Erro ao se comunicar com o servidor.", "error");
      }
    });
  }

  // ============================
  // FORMULÁRIO DE CADASTRO
  // ============================
  const cadastroFormContainer = document.querySelector(".formCadastro");
  const cadastroForm = cadastroFormContainer
    ? cadastroFormContainer.querySelector("form")
    : null;

  if (cadastroForm) {
    cadastroForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(cadastroForm);
      const data = Object.fromEntries(formData.entries());

      if (data.senha !== data.confirmaSenha) {
        showFeedback("As senhas não conferem.", "error");
        return;
      }

      try {
        const response = await fetch("/cadastro", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            senha: data.senha,
          }),
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
          showFeedback(result.message, "success");
          cadastroForm.reset();
          if (card) {
            card.classList.remove("cadastroActive");
            card.classList.add("loginActive");
          }
        } else {
          showFeedback(
            result.message || "Erro ao cadastrar usuário.",
            "error"
          );
        }
      } catch (error) {
        console.error("Erro ao enviar cadastro:", error);
        showFeedback("Erro ao se comunicar com o servidor.", "error");
      }
    });
  }

  // ============================
  // POPUP DE FEEDBACK
  // ============================
  function showFeedback(message, type) {
    const feedback = document.getElementById("feedback");
    const feedbackMessage = document.getElementById("feedback-message");
    const feedbackClose = document.getElementById("feedback-close");

    if (!feedback || !feedbackMessage || !feedbackClose) {
      alert(message);
      return;
    }

    feedbackMessage.textContent = message;

    feedback.classList.remove("hidden", "feedback--success", "feedback--error");
    feedback.classList.add(
      type === "success" ? "feedback--success" : "feedback--error"
    );

    feedbackClose.addEventListener(
      "click",
      () => {
        feedback.classList.add("hidden");
      },
      { once: true }
    );
  }
});
