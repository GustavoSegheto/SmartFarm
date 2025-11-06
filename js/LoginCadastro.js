/**
 * Aguarda o conteúdo do HTML ser completamente carregado antes de executar o script.
 * Isso previne erros de 'null' ao tentar selecionar elementos que ainda não existem.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Seleciona os elementos do DOM uma única vez e os armazena em constantes
  // 'const' é usado pois essas variáveis não serão reatribuídas.
  const card = document.querySelector(".card");
  const loginButton = document.querySelector(".loginButton");
  const cadastroButton = document.querySelector(".cadastroButton");

  // Verifica se os elementos essenciais existem antes de adicionar os 'listeners'
  if (card && loginButton && cadastroButton) {
    /**
     * Adiciona um 'listener' de clique ao botão de login.
     * 'addEventListener' é a forma moderna e preferida em vez de 'onclick'.
     */
    loginButton.addEventListener("click", () => {
      card.classList.remove("cadastroActive");
      card.classList.add("loginActive");
    });

    /**
     * Adiciona um 'listener' de clique ao botão de cadastro.
     */
    cadastroButton.addEventListener("click", () => {
      card.classList.remove("loginActive");
      card.classList.add("cadastroActive");
    });
  } else {
    // Loga um erro no console se algum elemento não for encontrado
    console.error(
      "Erro: Não foi possível encontrar um ou mais elementos (card, loginButton, cadastroButton) no DOM."
    );
  }
});
