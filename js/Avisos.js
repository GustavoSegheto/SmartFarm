/**
 * Aguarda o DOM ser totalmente carregado antes de adicionar
 * os event listeners (ouvintes de eventos).
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- Seleção dos Elementos ---
  const botoesFiltro = document.querySelectorAll(".botao-filtro");
  const botoesPagina = document.querySelectorAll(".botao-catalogo");
  const tabelaAvisos = document.getElementById("tabela-avisos");
  const linhasTabela = tabelaAvisos ? tabelaAvisos.querySelectorAll("tr") : [];

  // --- Lógica de Filtragem ---
  botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", () => {
      const statusFiltro = botao.getAttribute("data-filtro");

      // 1. Atualiza a classe 'ativo' nos botões de filtro
      botoesFiltro.forEach((btn) => btn.classList.remove("ativo"));
      botao.classList.add("ativo");

      // 2. Filtra as linhas da tabela
      linhasTabela.forEach((linha) => {
        const statusLinha = linha.getAttribute("data-status");

        if (statusFiltro === "todos" || statusFiltro === statusLinha) {
          linha.style.display = ""; // Mostra a linha
        } else {
          linha.style.display = "none"; // Esconde a linha
        }
      });
    });
  });

  // --- Lógica de Paginação ---
  botoesPagina.forEach((botao) => {
    botao.addEventListener("click", () => {
      const numeroPagina = botao.getAttribute("data-pagina");

      // 1. Atualiza a classe 'ativo' nos botões de página
      botoesPagina.forEach((btn) => btn.classList.remove("ativo"));
      botao.classList.add("ativo");

      // 2. Lógica futura para carregar dados
      // (O Node.js/Backend entraria aqui)
      console.log(`Página ${numeroPagina} selecionada.`);
      // Exemplo: carregarDadosDaPagina(numeroPagina);

      // Por enquanto, apenas simula a troca de página
      // (pode-se adicionar um 'alert' ou nada)
    });
  });

  // Função futura (exemplo para Node.js):
  // async function carregarDadosDaPagina(pagina) {
  //   const response = await fetch(`/api/avisos?pagina=${pagina}`);
  //   const novosAvisos = await response.json();
  //
  //   // Limpa a tabela e preenche com os novosAvisos
  //   tabelaAvisos.innerHTML = '';
  //   // ... (cria novas <tr> com os dados)
  // }
});
