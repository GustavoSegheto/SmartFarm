/**
 * Adiciona listeners de evento para interatividade dos cards (Favorito e Carrinho).
 */
document.addEventListener("DOMContentLoaded", function () {
  // 1. Lógica para o botão de Favorito
  const favoriteButtons = document.querySelectorAll(".favorite-btn");

  favoriteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const icon = this.querySelector("i");

      // Alternar entre ícone de contorno (far) e ícone preenchido (fas)
      if (icon.classList.contains("far")) {
        icon.classList.remove("far");
        icon.classList.add("fas");
        this.classList.add("active");
        console.log(
          `Produto ID ${
            this.closest(".product-card").dataset.productId
          } favoritado!`
        );
      } else {
        icon.classList.remove("fas");
        icon.classList.add("far");
        this.classList.remove("active");
        console.log(
          `Produto ID ${
            this.closest(".product-card").dataset.productId
          } removido dos favoritos.`
        );
      }
    });
  });

  // 2. Lógica para o botão de Adicionar ao Carrinho
  const addToCartButtons = document.querySelectorAll(".add-to-cart");

  addToCartButtons.forEach((button) => {
    // Usa uma flag ou atributo para controlar o estado
    let isAdded = false;

    button.addEventListener("click", function () {
      const originalText = this.getAttribute("data-text"); // "Adicionar ao Carrinho"
      const spanElement = this.querySelector("span");

      if (!isAdded) {
        // Estado: Adicionado
        spanElement.textContent = "Adicionado!";
        this.style.backgroundColor = "#2e7d32"; // Verde escuro
        this.querySelector("i").className = "fas fa-check"; // Ícone de check
        isAdded = true;

        setTimeout(() => {
          // Após 2 segundos, volta ao normal
          spanElement.textContent = originalText;
          this.style.backgroundColor = ""; // Volta ao CSS normal
          this.querySelector("i").className = "fas fa-shopping-cart"; // Ícone de carrinho
          isAdded = false;
        }, 2000);

        console.log(
          `Produto ID ${
            this.closest(".product-card").dataset.productId
          } adicionado ao carrinho!`
        );
      }
      // Se isAdded for true, o botão é clicado enquanto o timer está rodando,
      // e ele simplesmente ignora o clique (melhor experiência de usuário)
    });
  });
});
