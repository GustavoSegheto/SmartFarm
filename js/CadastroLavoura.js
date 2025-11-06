/**
 * Aguarda o DOM ser totalmente carregado antes de executar o script.
 * Isso garante que todos os elementos (botões, formulários) existam.
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- Seleção de Elementos do DOM ---

  // Telas e Contêineres
  const listaLavouras = document.getElementById("listaLavouras");
  const telaCadastro = document.getElementById("telaCadastro");
  const telaSensor = document.getElementById("telaSensor");
  const telaEdicao = document.getElementById("telaEdicao");

  // Botões Principais
  const btnAdicionar = document.getElementById("btnAdicionar");
  const btnRestaurar = document.getElementById("btnRestaurar");

  // Formulários (agora selecionando as tags <form>)
  const formCadastro = document.getElementById("formCadastro");
  const formSensor = document.getElementById("formSensor");
  const formEdicao = document.getElementById("formEdicao");

  // Elementos do Formulário de Cadastro
  const opcoesLavoura = document.querySelectorAll(
    "#telaCadastro .opcao-lavoura"
  );
  const nomeLavouraInput = document.getElementById("nomeLavoura");
  const btnCancelarCadastro = document.getElementById("btnCancelarCadastro");
  const btnAdicionarSensor = document.getElementById("btnAdicionarSensor");

  // Elementos do Formulário de Sensor
  const btnCancelarSensor = document.getElementById("btnCancelarSensor");
  const btnSalvarSensor = document.getElementById("btnSalvarSensor");

  // Elementos do Formulário de Edição
  const lavouraEditIdInput = document.getElementById("lavouraEditId");
  const opcoesEdicao = document.querySelectorAll(
    "#opcoesEdicao .opcao-lavoura"
  );
  const nomeLavouraEdicao = document.getElementById("nomeLavouraEdicao");
  const dataPlantioEdicao = document.getElementById("dataPlantioEdicao");
  const culturaEdicao = document.getElementById("culturaEdicao");
  const latitudeEdicao = document.getElementById("latitudeEdicao");
  const longitudeEdicao = document.getElementById("longitudeEdicao");
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
  // O botão de salvar edição é 'type="submit"', então ouvimos o 'submit' do formulário

  // --- Estado da Aplicação ---
  let lavourasExcluidas = [];
  let lavouraEditando = null; // Armazena a lavoura sendo editada

  // --- Funções de Controle da UI (Interface) ---

  /**
   * Mostra uma tela de formulário específica e esconde a lista.
   * @param {HTMLElement} tela - O elemento da tela a ser mostrado.
   */
  function mostrarTela(tela) {
    listaLavouras.style.display = "none";
    telaCadastro.classList.remove("ativo");
    telaSensor.classList.remove("ativo");
    telaEdicao.classList.remove("ativo");
    tela.classList.add("ativo");
  }

  /**
   * Esconde todas as telas de formulário e mostra a lista de lavouras.
   */
  function voltarParaLista() {
    listaLavras.style.display = "block";
    telaCadastro.classList.remove("ativo");
    telaSensor.classList.remove("ativo");
    telaEdicao.classList.remove("ativo");
  }

  /**
   * Limpa todos os campos do formulário de cadastro.
   */
  function limparFormularioCadastro() {
    formCadastro.reset(); // Método reset() limpa todos os campos do formulário
    opcoesLavoura.forEach((o) => o.classList.remove("selecionada"));
  }

  /**
   * Preenche o formulário de edição com os dados de uma lavoura.
   * @param {object} lavoura - O objeto da lavoura contendo os dados.
   */
  function preencherFormularioEdicao(lavoura) {
    lavouraEditIdInput.value = lavoura.id; // Preenche o ID oculto
    nomeLavouraEdicao.value = lavoura.nome;
    dataPlantioEdicao.value = lavoura.data;
    culturaEdicao.value = lavoura.cultura;
    latitudeEdicao.value = lavoura.lat;
    longitudeEdicao.value = lavoura.long;

    opcoesEdicao.forEach((o) => o.classList.remove("selecionada"));
    opcoesEdicao.forEach((opcao) => {
      if (opcao.getAttribute("data-valor") === lavoura.nome) {
        opcao.classList.add("selecionada");
      }
    });
  }

  /**
   * Configura a lógica de clique para as opções de lavoura.
   * @param {NodeList} opcoes - A lista de elementos de opção.
   * @param {HTMLInputElement} input - O campo de input a ser preenchido.
   */
  function setupOpcoesSelecionaveis(opcoes, input) {
    opcoes.forEach((opcao) => {
      // Evento de clique para selecionar
      opcao.addEventListener("click", function () {
        opcoes.forEach((o) => o.classList.remove("selecionada"));
        this.classList.add("selecionada");
        input.value = this.getAttribute("data-valor");
      });
    });

    // Evento de digitação para desmarcar
    input.addEventListener("input", function () {
      opcoes.forEach((o) => o.classList.remove("selecionada"));
    });
  }

  // --- Funções de Lógica de Negócio (CRUD) ---

  /**
   * Cria e adiciona um cartão de lavoura na lista do DOM.
   * @param {string} nome
   * @param {string} data
   * @param {string} cultura
   * @param {string} lat
   * @param {string} long
   * @param {string} [id] - Opcional: ID existente (para edição ou restauração)
   */
  function adicionarLavouraAoDOM(
    nome,
    data,
    cultura,
    lat,
    long,
    id = Date.now().toString()
  ) {
    const cartaoLavoura = document.createElement("div");
    cartaoLavoura.className = "cartao-lavoura";
    cartaoLavoura.setAttribute("data-id", id);
    cartaoLavoura.innerHTML = `
        <div class="info-lavoura">
          <h3>${nome}</h3>
          <p><strong>Data de plantio:</strong> ${data}</p>
          <p><strong>Cultura:</strong> ${cultura}</p>
          <p><strong>Localização:</strong> ${lat}, ${long}</p>
        </div>
        <div class="acoes-lavoura">
          <button class="btn-acao btn-editar" title="Editar">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn-acao btn-excluir" title="Excluir">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    listaLavouras.appendChild(cartaoLavoura);

    // Adicionar eventos aos botões de ação do *novo* cartão
    const btnEditar = cartaoLavoura.querySelector(".btn-editar");
    const btnExcluir = cartaoLavoura.querySelector(".btn-excluir");

    // Evento de Editar
    btnEditar.addEventListener("click", () => {
      // Armazena a lavoura que está sendo editada
      lavouraEditando = {
        id: id,
        nome: nome,
        data: data,
        cultura: cultura,
        lat: lat,
        long: long,
        elemento: cartaoLavoura, // Referência ao elemento do DOM
      };

      preencherFormularioEdicao(lavouraEditando);
      mostrarTela(telaEdicao);
    });

    // Evento de Excluir
    btnExcluir.addEventListener("click", () => {
      if (confirm(`Tem certeza que deseja excluir a lavoura "${nome}"?`)) {
        lavourasExcluidas.push({
          id: id,
          nome: nome,
          data: data,
          cultura: cultura,
          lat: lat,
          long: long,
          elemento: cartaoLavoura,
        });
        cartaoLavoura.remove();
        // TODO: Futuramente, fazer um fetch() para /lavoura/excluir/:id
      }
    });
  }

  /**
   * Carrega os dados de exemplo iniciais.
   */
  function carregarLavourasExemplo() {
    adicionarLavouraAoDOM(
      "Lavoura de tomate",
      "2024-01-15",
      "Tomate",
      "-23.5505",
      "-46.6333"
    );
    adicionarLavouraAoDOM(
      "Lavoura de batata",
      "2024-02-01",
      "Batata",
      "-23.5510",
      "-46.6340"
    );
    adicionarLavouraAoDOM(
      "Lavoura de cenoura",
      "2024-01-20",
      "Cenoura",
      "-23.5520",
      "-46.6350"
    );
  }

  // --- Vinculação de Eventos (Event Listeners) ---

  // Botões de navegação principal
  btnAdicionar.addEventListener("click", () => mostrarTela(telaCadastro));
  btnAdicionarSensor.addEventListener("click", () => mostrarTela(telaSensor));

  // Botões de cancelamento
  btnCancelarCadastro.addEventListener("click", () => {
    voltarParaLista();
    limparFormularioCadastro();
  });
  btnCancelarSensor.addEventListener("click", () => mostrarTela(telaCadastro));
  btnCancelarEdicao.addEventListener("click", () => {
    voltarParaLista();
    lavouraEditando = null; // Limpa a lavoura em edição
  });

  // Lógica de seleção de opções
  setupOpcoesSelecionaveis(opcoesLavoura, nomeLavouraInput);
  setupOpcoesSelecionaveis(opcoesEdicao, nomeLavouraEdicao);

  // Botão de salvar sensor (não é um submit de formulário principal)
  btnSalvarSensor.addEventListener("click", () => {
    const tipoSensor = document.getElementById("tipoSensor").value;
    const modeloSensor = document.getElementById("modeloSensor").value;

    if (!tipoSensor || !modeloSensor) {
      alert("Por favor, preencha todos os campos do sensor.");
      return;
    }

    alert(`Sensor ${modeloSensor} (${tipoSensor}) adicionado com sucesso!`);
    // TODO: Futuramente, salvar este sensor em um array
    // e associá-lo à lavoura que está sendo cadastrada.
    mostrarTela(telaCadastro);
  });

  // --- Manipulação de Formulários (Submit) ---

  /**
   * Evento de SUBMIT do formulário de CADASTRO
   * Esta é a prática correta para integração com backend.
   */
  formCadastro.addEventListener("submit", (event) => {
    // 1. Impede o envio padrão do formulário (que recarregaria a página)
    event.preventDefault();

    // 2. Coleta os dados do formulário
    const nome = nomeLavouraInput.value || "Lavoura sem nome";
    const data =
      document.getElementById("dataPlantio").value || "Não informada";
    const cultura = document.getElementById("cultura").value || "Não informada";
    const lat = document.getElementById("latitude").value || "Não informada";
    const long = document.getElementById("longitude").value || "Não informada";

    // 3. Validação simples
    if (!nome || !data || !cultura) {
      alert("Por favor, preencha pelo menos Nome, Data e Cultura.");
      return;
    }

    // 4. (PASSO FUTURO - BACKEND)
    // const formData = new FormData(formCadastro);
    // fetch('/lavoura/salvar', { method: 'POST', body: formData })
    //   .then(response => response.json())
    //   .then(novaLavoura => {
    //      adicionarLavouraAoDOM(novaLavoura.nome, ..., novaLavoura.id);
    //   });

    // 5. (Versão atual - Front-end) Adiciona ao DOM
    adicionarLavouraAoDOM(nome, data, cultura, lat, long);
    voltarParaLista();
    limparFormularioCadastro();
    alert("Lavoura cadastrada com sucesso!");
  });

  /**
   * Evento de SUBMIT do formulário de EDIÇÃO
   */
  formEdicao.addEventListener("submit", (event) => {
    // 1. Impede o envio padrão
    event.preventDefault();

    if (!lavouraEditando) return; // Segurança, caso algo dê errado

    // 2. Coleta os dados
    const nome = nomeLavouraEdicao.value || "Lavoura sem nome";
    const data = dataPlantioEdicao.value || "Não informada";
    const cultura = culturaEdicao.value || "Não informada";
    const lat = latitudeEdicao.value || "Não informada";
    const long = longitudeEdicao.value || "Não informada";
    const id = lavouraEditando.id;

    // 3. Validação
    if (!nome || !data || !cultura) {
      alert("Por favor, preencha pelo menos Nome, Data e Cultura.");
      return;
    }

    // 4. (PASSO FUTURO - BACKEND)
    // const formData = new FormData(formEdicao); // Pega os dados do form de edição
    // fetch(`/lavoura/editar/${id}`, { method: 'POST', body: formData })
    //   .then(...)

    // 5. (Versão atual - Front-end) Atualiza o DOM
    const infoLavoura = lavouraEditando.elemento.querySelector(".info-lavoura");
    infoLavoura.innerHTML = `
        <h3>${nome}</h3>
        <p><strong>Data de plantio:</strong> ${data}</p>
        <p><strong>Cultura:</strong> ${cultura}</p>
        <p><strong>Localização:</strong> ${lat}, ${long}</p>
      `;

    // Atualiza os dados no objeto 'lavouraEditando' para o caso de exclusão futura
    // (Embora não seja mais 'lavouraEditando' após salvar)

    voltarParaLista();
    lavouraEditando = null; // Limpa o estado de edição
    alert("Lavoura atualizada com sucesso!");
  });

  // Botão Restaurar
  btnRestaurar.addEventListener("click", () => {
    if (lavourasExcluidas.length === 0) {
      alert("Nenhuma lavoura para restaurar.");
      return;
    }

    const lavouraParaRestaurar = lavourasExcluidas.pop();

    // Adiciona de volta ao DOM (os event listeners já são recriados)
    adicionarLavouraAoDOM(
      lavouraParaRestaurar.nome,
      lavouraParaRestaurar.data,
      lavouraParaRestaurar.cultura,
      lavouraParaRestaurar.lat,
      lavouraParaRestaurar.long,
      lavouraParaRestaurar.id
    );
    alert(`Lavoura "${lavouraParaRestaurar.nome}" restaurada com sucesso!`);
    // TODO: Futuramente, fazer um fetch() para /lavoura/restaurar/:id
  });

  // --- Inicialização ---
  // Carrega as lavouras de exemplo quando a página é aberta
  carregarLavourasExemplo();

  // Garante que a lista esteja visível no início
  voltarParaLista();
});
