document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos ---
  const listaLavouras = document.getElementById("listaLavouras");
  const telaCadastro = document.getElementById("telaCadastro");
  const telaSensor = document.getElementById("telaSensor");
  const telaEdicao = document.getElementById("telaEdicao");

  const btnAdicionar = document.getElementById("btnAdicionar");
  const btnRestaurar = document.getElementById("btnRestaurar"); // Botão RESTAURAR
  
  // Formulários
  const formCadastro = document.getElementById("formCadastro");
  const formSensor = document.getElementById("formSensor");
  const formEdicao = document.getElementById("formEdicao");

  // Inputs Cadastro
  const selectSensorLavoura = document.getElementById("selecaoSensor");
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
  const selectSensorEdicao = document.getElementById("selecaoSensorEdicao"); // Novo select
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
  
  // PILHA DE RESTAURAÇÃO (CTRL+Z)
  let lavourasExcluidas = []; 

  // --- Funções de Navegação ---

  function mostrarTela(tela) {
    [listaLavouras, telaCadastro, telaSensor, telaEdicao].forEach(el => el.style.display = 'none');
    
    if (tela === listaLavouras) {
        listaLavouras.style.display = "block";
        telaCadastro.classList.remove("ativo");
        telaSensor.classList.remove("ativo");
        telaEdicao.classList.remove("ativo");
    } else {
        tela.style.display = "flex"; // Flex para centralizar modal
        tela.classList.add("ativo");
    }
  }

  function voltarParaLista() {
    mostrarTela(listaLavouras);
    carregarLavouras();
  }

  // --- API e Lógica ---

  async function carregarSensoresNasCombos() {
    try {
      const resp = await fetch("/api/sensores/usuario");
      const json = await resp.json();

      if (json.status === "success") {
        const sensores = json.data;
        
        // Gera as opções
        let htmlOpcoes = '<option value="0">-- Sem Sensor --</option>';
        sensores.forEach(s => {
          htmlOpcoes += `<option value="${s.ID_sensor}">${s.apelido}</option>`;
        });

        // Preenche todas as combos de sensor
        selectSensorLavoura.innerHTML = htmlOpcoes;
        selectSensorEdicao.innerHTML = htmlOpcoes; // Combo da tela de edição

        // Combo específica de "Editar Apelido" (não tem opção "sem sensor")
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
    } catch (err) { console.error(err); }
  }

  function renderizarCartao(lavoura) {
    const cartao = document.createElement("div");
    cartao.className = "cartao-lavoura";
    
    let textoSensor = "Nenhum sensor vinculado";
    let corIcone = "#ccc";

    if (lavoura.ID_sensor) {
      const nomeOuId = lavoura.nome_sensor || `ID: ${lavoura.ID_sensor}`;
      textoSensor = `Conectado: ${nomeOuId}`;
      corIcone = "#4caf50";
    }

    cartao.innerHTML = `
      <div class="info-lavoura">
        <h3>${lavoura.nome || "Lavoura"}</h3>
        <p><strong>Cultura:</strong> ${lavoura.cultura}</p>
        <p><strong>Data:</strong> ${lavoura.data}</p>
        <p style="color: ${corIcone}; margin-top: 5px;">
          <small><i class="fas fa-wifi"></i> ${textoSensor}</small>
        </p>
      </div>
      <div class="acoes-lavoura">
        <button class="btn-acao btn-editar" title="Editar"><i class="fas fa-pencil-alt"></i></button>
        <button class="btn-acao btn-excluir" title="Excluir"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    
    // --- LÓGICA DO BOTÃO EDITAR ---
    const btnEditar = cartao.querySelector(".btn-editar");
    btnEditar.onclick = () => {
        carregarSensoresNasCombos().then(() => {
            // Preenche o formulário de edição com os dados do cartão
            lavouraEditIdInput.value = lavoura.ID_lavoura;
            nomeLavouraEdicao.value = lavoura.nome;
            dataPlantioEdicao.value = lavoura.data; // formato YYYY-MM-DD funciona direto no input date
            culturaEdicao.value = lavoura.cultura;
            latitudeEdicao.value = lavoura.latitude;
            longitudeEdicao.value = lavoura.longitude;
            selectSensorEdicao.value = lavoura.ID_sensor || "0"; 

            mostrarTela(telaEdicao);
        });
    };

    // --- LÓGICA DO BOTÃO EXCLUIR (Com "Ctrl+Z") ---
    const btnExcluir = cartao.querySelector(".btn-excluir");
    btnExcluir.onclick = async () => {
      if(confirm(`Excluir a lavoura "${lavoura.nome}"?`)) {
        
        // 1. Salva na pilha antes de deletar
        lavourasExcluidas.push(lavoura);
        
        // 2. Deleta do banco
        await fetch(`/api/lavouras/${lavoura.ID_lavoura}`, { method: "DELETE" });
        
        // 3. Atualiza interface
        carregarLavouras();
        alert("Lavoura excluída. Use 'Restaurar' para desfazer.");
      }
    };

    listaLavouras.appendChild(cartao);
  }

  // --- LÓGICA RESTAURAR (CTRL + Z) ---
  btnRestaurar.addEventListener("click", async () => {
    if (lavourasExcluidas.length === 0) {
        return alert("Não há lavouras recentes para restaurar.");
    }

    // Pega o último item removido (Pop)
    const itemRestaurar = lavourasExcluidas.pop();

    const dadosParaSalvar = {
        nomeLavoura: itemRestaurar.nome,
        dataPlantio: itemRestaurar.data,
        cultura: itemRestaurar.cultura,
        latitude: itemRestaurar.latitude,
        longitude: itemRestaurar.longitude,
        idSensor: itemRestaurar.ID_sensor
    };

    try {
        const resp = await fetch("/api/lavouras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosParaSalvar)
        });
        
        if(resp.ok) {
            alert(`Lavoura "${itemRestaurar.nome}" restaurada com sucesso!`);
            carregarLavouras();
        } else {
            alert("Erro ao restaurar lavoura.");
        }
    } catch(e) {
        console.error(e);
    }
  });

  // --- SUBMITS DOS FORMULÁRIOS ---

  // 1. Cadastrar Lavoura
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      nomeLavoura: document.getElementById("nomeLavoura").value,
      dataPlantio: document.getElementById("dataPlantio").value,
      cultura: document.getElementById("cultura").value,
      latitude: document.getElementById("latitude").value,
      longitude: document.getElementById("longitude").value,
      idSensor: selectSensorLavoura.value 
    };
    
    const resp = await fetch("/api/lavouras", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados)
    });
    if((await resp.json()).status === "success") {
        alert("Criado!"); formCadastro.reset(); voltarParaLista();
    }
  });

  // 2. Editar Lavoura (UPDATE)
  formEdicao.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = lavouraEditIdInput.value;
    const dados = {
        nomeLavoura: nomeLavouraEdicao.value,
        dataPlantio: dataPlantioEdicao.value,
        cultura: culturaEdicao.value,
        latitude: latitudeEdicao.value,
        longitude: longitudeEdicao.value,
        idSensor: selectSensorEdicao.value
    };

    try {
        const resp = await fetch(`/api/lavouras/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const res = await resp.json();

        if (res.status === "success") {
            alert("Lavoura atualizada!");
            formEdicao.reset();
            voltarParaLista();
        } else {
            alert("Erro: " + res.message);
        }
    } catch (err) { console.error(err); }
  });

  // 3. Renomear Sensor
  formSensor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idSensor = selectSensorEditar.value;
    const novoNome = inputNovoApelido.value;
    
    const resp = await fetch(`/api/sensores/${idSensor}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apelido: novoNome })
    });
    if((await resp.json()).status === "success") {
        alert("Apelido atualizado!"); formSensor.reset(); carregarSensoresNasCombos(); voltarParaLista();
    }
  });

  // Eventos de Navegação Simples
  btnAdicionar.addEventListener("click", () => { formCadastro.reset(); carregarSensoresNasCombos(); mostrarTela(telaCadastro); });
  btnGerenciarSensor.addEventListener("click", () => { carregarSensoresNasCombos(); mostrarTela(telaSensor); });
  btnCancelarCadastro.addEventListener("click", voltarParaLista);
  btnCancelarSensor.addEventListener("click", () => mostrarTela(telaCadastro));
  btnCancelarEdicao.addEventListener("click", voltarParaLista);

  // Inicializa
  carregarLavouras();
});