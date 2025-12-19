document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos ---
  const listaLavouras = document.getElementById("listaLavouras");
  const telaCadastro = document.getElementById("telaCadastro");
  const telaSensor = document.getElementById("telaSensor"); // Modal de Edição
  const telaEdicao = document.getElementById("telaEdicao");

  const btnAdicionar = document.getElementById("btnAdicionar");
  
  // Formulários
  const formCadastro = document.getElementById("formCadastro");
  const formSensor = document.getElementById("formSensor");
  const formEdicao = document.getElementById("formEdicao");

  // Inputs Lavoura
  const nomeLavouraInput = document.getElementById("nomeLavoura");
  const selectSensorLavoura = document.getElementById("selecaoSensor"); // Combobox principal
  const btnCancelarCadastro = document.getElementById("btnCancelarCadastro");
  const btnGerenciarSensor = document.getElementById("btnGerenciarSensor");

  // Inputs Edição Sensor
  const selectSensorEditar = document.getElementById("sensorParaEditar");
  const inputNovoApelido = document.getElementById("novoApelido");
  const btnCancelarSensor = document.getElementById("btnCancelarSensor");

  // Inputs Edição Lavoura
  const lavouraEditIdInput = document.getElementById("lavouraEditId");
  const nomeLavouraEdicao = document.getElementById("nomeLavouraEdicao");
  const dataPlantioEdicao = document.getElementById("dataPlantioEdicao");
  const culturaEdicao = document.getElementById("culturaEdicao");
  const latitudeEdicao = document.getElementById("latitudeEdicao");
  const longitudeEdicao = document.getElementById("longitudeEdicao");
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
  
  let lavouraEditando = null;

  // --- Funções Auxiliares ---

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
    carregarLavouras();
  }

  // --- API: Buscar Sensores do Usuário ---
  async function carregarSensoresNasCombos() {
    try {
      const resp = await fetch("/api/sensores/usuario");
      const json = await resp.json();

      if (json.status === "success") {
        const sensores = json.data;
        
        // 1. Preenche Combobox da Tela de Cadastro de Lavoura
        let htmlLavoura = '<option value="0">-- Selecione um sensor --</option>';
        sensores.forEach(s => {
          htmlLavoura += `<option value="${s.ID_sensor}">${s.apelido} (ID: ${s.ID_sensor})</option>`;
        });
        selectSensorLavoura.innerHTML = htmlLavoura;

        // 2. Preenche Combobox da Tela de Editar Sensor
        let htmlEdit = '';
        sensores.forEach(s => {
          htmlEdit += `<option value="${s.ID_sensor}">${s.apelido}</option>`;
        });
        selectSensorEditar.innerHTML = htmlEdit;
      }
    } catch (err) {
      console.error("Erro ao listar sensores:", err);
    }
  }

  // --- API: Carregar Lavouras ---
  async function carregarLavouras() {
    try {
      const response = await fetch("/api/lavouras");
      const json = await response.json();
      listaLavouras.innerHTML = "";

      if (json.status === "success" && json.data.length > 0) {
        json.data.forEach(renderizarCartao);
      } else {
        listaLavouras.innerHTML = "<p style='color:white; text-align:center;'>Nenhuma lavoura encontrada.</p>";
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderizarCartao(lavoura) {
    const cartao = document.createElement("div");
    cartao.className = "cartao-lavoura";
    
    // Lógica para exibir o texto do sensor
    let textoSensor = "Nenhum sensor vinculado";
    let corIcone = "#ccc"; // Cinza

    if (lavoura.ID_sensor) {
      // Se tiver apelido (nome_sensor), usa ele. Se não, usa o ID.
      const nomeOuId = lavoura.nome_sensor || `ID: ${lavoura.ID_sensor}`;
      textoSensor = `Conectado: ${nomeOuId}`;
      corIcone = "#4caf50"; // Verde
    }

    cartao.innerHTML = `
      <div class="info-lavoura">
        <h3>${lavoura.nome || "Lavoura"}</h3>
        <p><strong>Cultura:</strong> ${lavoura.cultura}</p>
        <p><strong>Data:</strong> ${lavoura.data}</p>
        
        <p style="color: ${corIcone}; margin-top: 5px;">
          <small>
            <i class="fas fa-wifi"></i> ${ lavoura.ID_sensor || textoSensor}
          </small>
        </p>
      </div>
      <div class="acoes-lavoura">
        <button class="btn-acao btn-excluir"><i class="fas fa-times"></i></button>
      </div>
    `;
    
    // Botão Excluir
    cartao.querySelector(".btn-excluir").onclick = async () => {
      if(confirm("Excluir esta lavoura?")) {
        await fetch(`/api/lavouras/${lavoura.ID_lavoura}`, { method: "DELETE" });
        carregarLavouras();
      }
    };

    listaLavouras.appendChild(cartao);
  }

  // --- Eventos de Navegação ---

  btnAdicionar.addEventListener("click", () => {
    formCadastro.reset();
    carregarSensoresNasCombos(); // Atualiza lista ao abrir
    mostrarTela(telaCadastro);
  });

  btnGerenciarSensor.addEventListener("click", () => {
    carregarSensoresNasCombos(); // Garante lista atualizada
    mostrarTela(telaSensor);
  });

  btnCancelarCadastro.addEventListener("click", voltarParaLista);
  btnCancelarSensor.addEventListener("click", () => mostrarTela(telaCadastro));
  btnCancelarEdicao.addEventListener("click", voltarParaLista);

  // --- SUBMIT: SALVAR LAVOURA ---
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const dados = {
      nomeLavoura: document.getElementById("nomeLavoura").value,
      dataPlantio: document.getElementById("dataPlantio").value,
      cultura: document.getElementById("cultura").value,
      latitude: document.getElementById("latitude").value,
      longitude: document.getElementById("longitude").value,
      // Pega o valor selecionado na combobox
      idSensor: selectSensorLavoura.value 
    };

    try {
      const resp = await fetch("/api/lavouras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });
      const res = await resp.json();

      if(res.status === "success") {
        alert("Lavoura criada com sucesso!");
        formCadastro.reset();
        voltarParaLista();
      } else {
        alert("Erro: " + res.message);
      }
    } catch(err) {
      console.error(err);
      alert("Erro de conexão.");
    }
  });

  // --- SUBMIT: EDITAR SENSOR (Renomear) ---
  formSensor.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const idSensor = selectSensorEditar.value;
    const novoNome = inputNovoApelido.value;

    if(!novoNome) return alert("Digite um novo apelido.");

    try {
      const resp = await fetch(`/api/sensores/${idSensor}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apelido: novoNome })
      });
      const res = await resp.json();

      if(res.status === "success") {
        alert("Apelido do sensor atualizado!");
        formSensor.reset();
        carregarSensoresNasCombos(); // Atualiza as listas
        mostrarTela(telaCadastro); // Volta para o cadastro de lavoura
      } else {
        alert("Erro: " + res.message);
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Inicialização
  carregarLavouras();
});