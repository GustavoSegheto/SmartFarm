/**
 * Adiciona interatividade aos campos de código de verificação,
 * permitindo o auto-foco e a navegação por Backspace.
 */
document.addEventListener("DOMContentLoaded", function () {
  // Seleciona todos os inputs do código
  const inputs = document.querySelectorAll(".code-inputs input");

  // Função para mover o foco para o próximo input
  function focusNextInput(currentIndex) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < inputs.length) {
      inputs[nextIndex].disabled = false;
      inputs[nextIndex].focus();
    } else {
      // Se for o último input, foca no botão de verificar (se existir)
      const verificarBtn = document.querySelector(".botao-verificar");
      if (verificarBtn) {
        verificarBtn.focus();
      }
    }
  }

  // Função para mover o foco para o input anterior
  function focusPreviousInput(currentIndex) {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      inputs[currentIndex].disabled = true; // Desabilita o input atual
      inputs[prevIndex].focus();
    }
  }

  // Adiciona o Event Listener para cada input
  inputs.forEach((input, index) => {
    // 1. Evento de Digitação (input): Lida com o auto-foco
    input.addEventListener("input", (e) => {
      // Garante que o input contenha apenas 1 caractere
      if (e.target.value.length === 1) {
        focusNextInput(index);
      }
    });

    // 2. Evento de Teclas (keydown): Lida com o backspace
    input.addEventListener("keydown", (e) => {
      // Se a tecla pressionada for 'Backspace' e o campo estiver vazio
      if (e.key === "Backspace" && e.target.value === "") {
        focusPreviousInput(index);
      }
    });
  });

  // 3. Lógica do botão de verificação (apenas um exemplo)
  const verificarBtn = document.querySelector(".botao-verificar");
  if (verificarBtn) {
    verificarBtn.addEventListener("click", () => {
      let code = "";
      inputs.forEach((input) => {
        code += input.value;
      });

      if (code.length === inputs.length) {
        alert(
          `Código de verificação submetido: ${code}. (Próxima tela de login/dashboard)`
        );
        // Aqui entraria a lógica de envio do código para o servidor
      } else {
        alert("Por favor, preencha todos os 6 dígitos do código.");
      }
    });
  }

  // Garante que o primeiro input esteja focado e habilitado ao carregar
  if (inputs.length > 0) {
    inputs[0].focus();
    inputs[0].disabled = false;
  }
});
