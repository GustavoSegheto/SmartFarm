/**
 * Script de Gerenciamento de Lavouras (CRUD Completo)
 * Integrado ao Backend Node.js
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- Seleção de Elementos ---
  const listaLavouras = document.getElementById("listaLavouras");
  const telaCadastro = document.getElementById("telaCadastro");
  const telaSensor = document.getElementById("telaSensor");
  const telaEdicao = document.getElementById("telaEdicao");

  const btnAdicionar = document.getElementById("btnAdicionar");
  const btnRestaurar = document.getElementById("btnRestaurar"); // Mantido visualmente, mas sem lógica de backend por enquanto

  const formCadastro = document.getElementById("formCadastro");
  const formSensor = document.getElementById("formSensor");
  const formEdicao = document.getElementById("formEdicao");

  // Campos Cadastro
  const opcoesLavoura = document.querySelectorAll("#telaCadastro .opcao-lavoura");
  const nomeLavouraInput = document.getElementById("nomeLavoura");
  const btnCancelarCadastro = document.getElementById("btnCancelarCadastro");
  const btnAdicionarSensor = document.getElementById("btnAdicionarSensor");

  // Campos Sensor
  const btnCancelarSensor = document.getElementById("btnCancelarSensor");
  const btnSalvarSensor = document.getElementById("btnSalvarSensor");

  // Campos Edição
  const lavouraEditIdInput = document.getElementById("lavouraEditId");
  const opcoesEdicao = document.querySelectorAll("#opcoesEdicao .opcao-lavoura");
  const nomeLavouraEdicao = document.getElementById("nomeLavouraEdicao");
  const dataPlantioEdicao = document.getElementById("dataPlantioEdicao");
  const culturaEdicao = document.getElementById("culturaEdicao");
  const latitudeEdicao = document.getElementById("latitudeEdicao");
  const longitudeEdicao = document.getElementById("longitudeEdicao");
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

  let lavouraEditando = null;

  // --- Funções de UI ---

  function mostrarTela(tela) {
    listaLavouras.style.display = "none";
    telaCadastro.classList.remove("ativo");
    telaSensor.classList.remove("ativo");
    telaEdicao.classList.remove("ativo");
    tela.classList.add("ativo");
  }

  function voltarParaLista() {
    listaLavouras.style.display = "block";
    telaCadastro.classList.remove("ativo");
    telaSensor.classList.remove("ativo");
    telaEdicao.classList.remove("ativo");
    // Recarrega a lista para garantir dados atualizados
    carregarLavourasDoBanco();
  }

  function limparFormularioCadastro() {
    formCadastro.reset();
    opcoesLavoura.forEach((o) => o.classList.remove("selecionada"));
  }

  function setupOpcoesSelecionaveis(opcoes, input) {
    opcoes.forEach((opcao) => {
      opcao.addEventListener("click", function () {
        opcoes.forEach((o) => o.classList.remove("selecionada"));
        this.classList.add("selecionada");
        input.value = this.getAttribute("data-valor");
      });
    });
    input.addEventListener("input", function () {
      opcoes.forEach((o) => o.classList.remove("selecionada"));
    });
  }

  // --- Funções de API (CRUD) ---

  /**
   * READ: Busca lavouras do backend e renderiza na tela
   */
  async function carregarLavourasDoBanco() {
    try {
      const response = await fetch("/api/lavouras");
      const json = await response.json();

      listaLavouras.innerHTML = ""; // Limpa a lista atual

      if (json.status === "success" && json.data.length > 0) {
        json.data.forEach((lavoura) => {
          renderizarCartaoLavoura(lavoura);
        });
      } else {
        listaLavouras.innerHTML = "<p style='color:white; text-align:center; margin-top:20px;'>Nenhuma lavoura cadastrada.</p>";
      }
    } catch (error) {
      console.error("Erro ao carregar lavouras:", error);
      alert("Erro ao carregar dados.");
    }
  }

  /**
   * Renderiza o HTML de um cartão de lavoura
   */
  function renderizarCartaoLavoura(lavoura) {
    const cartao = document.createElement("div");
    cartao.className = "cartao-lavoura";
    // Armazena o objeto inteiro no dataset para facilitar a edição
    cartao.dataset.lavoura = JSON.stringify(lavoura);

    cartao.innerHTML = `
      <div class="info-lavoura">
        <h3>${lavoura.nome || "Sem nome"}</h3>
        <p><strong>Data de plantio:</strong> ${formatarDataPTBR(lavoura.data)}</p>
        <p><strong>Cultura:</strong> ${lavoura.cultura}</p>
        <p><strong>Localização:</strong> ${lavoura.latitude || "?"}, ${lavoura.longitude || "?"}</p>
      </div>
      <div class="acoes-lavoura">
        <button class="btn-acao btn-editar" title="Editar">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="btn-acao btn-excluir" title="Excluir" data-id="${lavoura.ID_lavoura}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    listaLavouras.appendChild(cartao);

    // Configurar botão de Editar
    const btnEditar = cartao.querySelector(".btn-editar");
    btnEditar.addEventListener("click", () => {
      prepararEdicao(lavoura);
    });

    // Configurar botão de Excluir
    const btnExcluir = cartao.querySelector(".btn-excluir");
    btnExcluir.addEventListener("click", () => {
      excluirLavoura(lavoura.ID_lavoura, lavoura.nome);
    });
  }

  function prepararEdicao(lavoura) {
    lavouraEditando = lavoura;
    lavouraEditIdInput.value = lavoura.ID_lavoura;
    nomeLavouraEdicao.value = lavoura.nome;
    dataPlantioEdicao.value = lavoura.data; // formato YYYY-MM-DD
    culturaEdicao.value = lavoura.cultura;
    latitudeEdicao.value = lavoura.latitude;
    longitudeEdicao.value = lavoura.longitude;

    // Lógica visual das opções
    opcoesEdicao.forEach((o) => o.classList.remove("selecionada"));
    opcoesEdicao.forEach((opcao) => {
      if (opcao.getAttribute("data-valor") === lavoura.nome) {
        opcao.classList.add("selecionada");
      }
    });

    mostrarTela(telaEdicao);
  }

  /**
   * DELETE: Exclui lavoura via API
   */
  async function excluirLavoura(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir a lavoura "${nome}"?`)) return;

    try {
      const response = await fetch(`/api/lavouras/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.status === "success") {
        alert("Lavoura excluída!");
        carregarLavourasDoBanco();
      } else {
        alert("Erro ao excluir: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao excluir.");
    }
  }

  function formatarDataPTBR(dataISO) {
    if (!dataISO) return "Data inválida";
    // Recebe YYYY-MM-DD e retorna DD/MM/YYYY
    const partes = dataISO.split("-");
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // --- Event Listeners ---

  btnAdicionar.addEventListener("click", () => mostrarTela(telaCadastro));
  
  // Botões Cancelar
  btnCancelarCadastro.addEventListener("click", () => {
    voltarParaLista();
    limparFormularioCadastro();
  });
  btnCancelarEdicao.addEventListener("click", () => {
    voltarParaLista();
    lavouraEditando = null;
  });

  // CREATE: Submit do Formulário de Cadastro
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      nomeLavoura: nomeLavouraInput.value || "Minha Lavoura",
      dataPlantio: document.getElementById("dataPlantio").value,
      cultura: document.getElementById("cultura").value,
      latitude: document.getElementById("latitude").value,
      longitude: document.getElementById("longitude").value,
    };

    try {
      const response = await fetch("/api/lavouras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const result = await response.json();

      if (result.status === "success") {
        alert("Lavoura cadastrada com sucesso!");
        limparFormularioCadastro();
        voltarParaLista();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao salvar.");
    }
  });

  // UPDATE: Submit do Formulário de Edição
  formEdicao.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!lavouraEditando) return;

    const dados = {
      nomeLavoura: nomeLavouraEdicao.value,
      dataPlantio: dataPlantioEdicao.value,
      cultura: culturaEdicao.value,
      latitude: latitudeEdicao.value,
      longitude: longitudeEdicao.value,
    };

    try {
      const response = await fetch(`/api/lavouras/${lavouraEditIdInput.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const result = await response.json();

      if (result.status === "success") {
        alert("Lavoura atualizada!");
        lavouraEditando = null;
        voltarParaLista();
      } else {
        alert("Erro: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao atualizar.");
    }
  });

  // Outros Listeners (Sensor, Opções)
  btnAdicionarSensor.addEventListener("click", () => mostrarTela(telaSensor));
  btnCancelarSensor.addEventListener("click", () => mostrarTela(telaCadastro));
  
  // Botão de salvar sensor apenas visual por enquanto
  btnSalvarSensor.addEventListener("click", (e) => {
    // --- Lógica de Cadastro de Sensor (Integrada ao Banco) ---

  const inputApelidoSensor = document.getElementById("apelidoSensor"); // Pegamos pelo novo ID

  // Transformamos o botão em submit real do formulário ou manipulamos o click
  // Como o HTML tem type="submit" no botão salvar dentro do formSensor,
  // o ideal é ouvir o evento 'submit' do formSensor, igual fizemos no formCadastro.
  
  formSensor.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apelido = inputApelidoSensor.value;
    
    // (Opcional) Se quiser usar o tipo ou localização, você pode concatenar no apelido
    // ou precisaria criar colunas no banco para eles. 
    // Por enquanto enviaremos apenas o apelido conforme sua tabela SQL.

    if (!apelido) {
      alert("Por favor, informe um apelido ou modelo para o sensor.");
      return;
    }

    try {
      const response = await fetch("/api/sensores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apelido: apelido }),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Sensor cadastrado com sucesso!");
        formSensor.reset(); // Limpa o formulário
        mostrarTela(telaCadastro); // Volta para a tela anterior
      } else {
        alert("Erro ao salvar sensor: " + result.message);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro de conexão ao tentar salvar o sensor.");
    }
  });
    mostrarTela(telaCadastro);
  });

  setupOpcoesSelecionaveis(opcoesLavoura, nomeLavouraInput);
  setupOpcoesSelecionaveis(opcoesEdicao, nomeLavouraEdicao);

  // Inicialização
  carregarLavourasDoBanco();
});