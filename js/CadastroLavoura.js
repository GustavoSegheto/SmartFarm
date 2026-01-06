// CadastroLavoura.js - VERSÃO ATUALIZADA
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
  const selectSensorEdicao = document.getElementById("selecaoSensorEdicao");
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

  // PILHA DE RESTAURAÇÃO (para "ocultar" em vez de deletar)
  let lavourasOcultadas = [];

  // --- Funções de Navegação ---

  function mostrarTela(tela) {
    [listaLavouras, telaCadastro, telaSensor, telaEdicao].forEach(
      (el) => (el.style.display = "none")
    );

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
        sensores.forEach((s) => {
          htmlOpcoes += `<option value="${s.ID_sensor}">${s.apelido}</option>`;
        });

        // Preenche todas as combos de sensor
        selectSensorLavoura.innerHTML = htmlOpcoes;
        selectSensorEdicao.innerHTML = htmlOpcoes;

        // Combo específica de "Editar Apelido"
        let htmlEdit = "";
        sensores.forEach((s) => {
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
        listaLavouras.innerHTML = `
          <div class="mensagem-sem-lavouras">
            <i class="fas fa-seedling"></i>
            <h3>Nenhuma lavoura encontrada</h3>
            <p>Clique em "Adicionar Lavoura" para criar sua primeira lavoura.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      listaLavouras.innerHTML = `<p style='color:#f44336; text-align:center;'>Erro ao carregar lavouras.</p>`;
    }
  }

  function renderizarCartao(lavoura) {
    const cartao = document.createElement("div");
    cartao.className = "cartao-lavoura";
    cartao.dataset.id = lavoura.ID_lavoura;
    cartao.dataset.status = lavoura.status || "ativa";

    // Determinar cor do status
    let statusClass = "";
    let statusIcon = "";
    switch (lavoura.status) {
      case "concluída":
        statusClass = "status-concluida";
        statusIcon = '<i class="fas fa-check-circle"></i> ';
        break;
      case "oculta":
        statusClass = "status-oculta";
        statusIcon = '<i class="fas fa-eye-slash"></i> ';
        break;
      default:
        statusClass = "status-ativa";
        statusIcon = '<i class="fas fa-seedling"></i> ';
    }

    let textoSensor = "Nenhum sensor vinculado";
    let corIcone = "#ccc";

    if (lavoura.ID_sensor) {
      const nomeOuId = lavoura.nome_sensor || `ID: ${lavoura.ID_sensor}`;
      textoSensor = `Conectado: ${nomeOuId}`;
      corIcone = "#4caf50";
    }

    cartao.innerHTML = `
      <div class="info-lavoura">
        <div class="status-indicator ${statusClass}">
          ${statusIcon}${
      lavoura.status
        ? lavoura.status.charAt(0).toUpperCase() + lavoura.status.slice(1)
        : "Ativa"
    }
        </div>
        <h3>${lavoura.nome || "Lavoura"}</h3>
        <p><strong>Cultura:</strong> ${lavoura.cultura}</p>
        <p><strong>Data:</strong> ${lavoura.data}</p>
        <p style="color: ${corIcone}; margin-top: 5px;">
          <small><i class="fas fa-wifi"></i> ${textoSensor}</small>
        </p>
      </div>
      <div class="acoes-lavoura">
        <button class="btn-acao btn-editar" title="Editar"><i class="fas fa-pencil-alt"></i></button>
        <button class="btn-acao btn-excluir" title="Ocultar"><i class="fas fa-eye-slash"></i></button>
      </div>
    `;

    // --- LÓGICA DO BOTÃO EDITAR ---
    const btnEditar = cartao.querySelector(".btn-editar");
    btnEditar.onclick = () => {
      if (lavoura.status === "oculta") {
        alert(
          "Esta lavoura está oculta. Restaure-a primeiro para poder editá-la."
        );
        return;
      }

      carregarSensoresNasCombos().then(() => {
        // Preenche o formulário de edição com os dados do cartão
        lavouraEditIdInput.value = lavoura.ID_lavoura;
        nomeLavouraEdicao.value = lavoura.nome;
        dataPlantioEdicao.value = lavoura.data;
        culturaEdicao.value = lavoura.cultura;
        latitudeEdicao.value = lavoura.latitude || "";
        longitudeEdicao.value = lavoura.longitude || "";
        selectSensorEdicao.value = lavoura.ID_sensor || "0";

        mostrarTela(telaEdicao);
      });
    };

    // --- LÓGICA DO BOTÃO "EXCLUIR" (AGORA OCULTAR) ---
    const btnExcluir = cartao.querySelector(".btn-excluir");
    btnExcluir.onclick = async () => {
      const lavouraNome = lavoura.nome || "Lavoura sem nome";

      if (lavoura.status === "oculta") {
        alert("Esta lavoura já está oculta.");
        return;
      }

      if (
        confirm(
          `Deseja ocultar a lavoura "${lavouraNome}"?\n\nA lavoura não será deletada, apenas removida da sua visão. Você poderá restaurá-la depois usando o botão "Restaurar".`
        )
      ) {
        try {
          // 1. Salva na pilha antes de ocultar
          lavourasOcultadas.push({
            ...lavoura,
            dataOcultacao: new Date().toISOString(),
          });

          // 2. Chama API para ocultar (não deletar)
          const response = await fetch(
            `/api/lavouras/${lavoura.ID_lavoura}/ocultar`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
            }
          );

          const data = await response.json();

          if (data.status === "success") {
            // 3. Remove o cartão da interface imediatamente
            cartao.style.opacity = "0.5";
            cartao.style.transform = "scale(0.95)";

            setTimeout(() => {
              cartao.remove();

              // Verifica se ainda há lavouras visíveis
              const cartoesRestantes =
                document.querySelectorAll(".cartao-lavoura");
              if (cartoesRestantes.length === 0) {
                carregarLavouras(); // Recarrega para mostrar mensagem de sem lavouras
              }
            }, 300);

            alert(
              `Lavoura "${lavouraNome}" ocultada com sucesso!\n\nUse o botão "Restaurar" para torná-la visível novamente.`
            );
          } else {
            alert("Erro ao ocultar lavoura: " + data.message);
          }
        } catch (error) {
          console.error("Erro ao ocultar lavoura:", error);
          alert("Erro ao ocultar lavoura.");
        }
      }
    };

    listaLavouras.appendChild(cartao);
  }

  // --- LÓGICA RESTAURAR (para lavouras ocultadas) ---
  btnRestaurar.addEventListener("click", async () => {
    if (lavourasOcultadas.length === 0) {
      return alert("Não há lavouras recentes para restaurar.");
    }

    // Pega o último item ocultado
    const itemRestaurar = lavourasOcultadas[lavourasOcultadas.length - 1];

    const confirmar = confirm(
      `Deseja restaurar a lavoura "${
        itemRestaurar.nome
      }"?\n\nOcultada em: ${new Date(
        itemRestaurar.dataOcultacao
      ).toLocaleString("pt-BR")}`
    );

    if (!confirmar) return;

    try {
      // Usa a API para restaurar (marcar como ativa)
      const response = await fetch(
        `/api/lavouras/${itemRestaurar.ID_lavoura}/restaurar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        // Remove da pilha de ocultadas
        lavourasOcultadas.pop();

        alert(`Lavoura "${itemRestaurar.nome}" restaurada com sucesso!`);

        // Recarrega a lista
        carregarLavouras();

        // Se a tela de cadastro estiver aberta, atualiza sensores também
        if (telaCadastro.style.display === "flex") {
          await carregarSensoresNasCombos();
        }
      } else {
        alert("Erro ao restaurar lavoura: " + data.message);

        // Se o erro for que a lavoura não está mais oculta, remove da pilha
        if (data.message.includes("não está oculta")) {
          lavourasOcultadas.pop();
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar lavoura:", error);
      alert("Erro ao restaurar lavoura. Verifique se o servidor está rodando.");
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
      latitude: document.getElementById("latitude").value || null,
      longitude: document.getElementById("longitude").value || null,
      idSensor: selectSensorLavoura.value,
    };

    try {
      const resp = await fetch("/api/lavouras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(dados),
      });

      const data = await resp.json();

      if (data.status === "success") {
        alert("Lavoura criada com sucesso!");
        formCadastro.reset();
        voltarParaLista();
      } else {
        alert("Erro ao criar lavoura: " + data.message);
      }
    } catch (error) {
      console.error("Erro ao criar lavoura:", error);
      alert("Erro ao criar lavoura.");
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
      latitude: latitudeEdicao.value || null,
      longitude: longitudeEdicao.value || null,
      idSensor: selectSensorEdicao.value,
    };

    try {
      const resp = await fetch(`/api/lavouras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(dados),
      });

      const data = await resp.json();

      if (data.status === "success") {
        alert("Lavoura atualizada com sucesso!");
        formEdicao.reset();
        voltarParaLista();
      } else {
        alert("Erro ao atualizar lavoura: " + data.message);
      }
    } catch (error) {
      console.error("Erro ao atualizar lavoura:", error);
      alert("Erro ao atualizar lavoura.");
    }
  });

  // 3. Renomear Sensor
  formSensor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idSensor = selectSensorEditar.value;
    const novoNome = inputNovoApelido.value.trim();

    if (!novoNome) {
      alert("Digite um novo apelido para o sensor.");
      return;
    }

    try {
      const resp = await fetch(`/api/sensores/${idSensor}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ apelido: novoNome }),
      });

      const data = await resp.json();

      if (data.status === "success") {
        alert("Apelido do sensor atualizado!");
        formSensor.reset();
        await carregarSensoresNasCombos();
        mostrarTela(telaCadastro);
      } else {
        alert("Erro ao atualizar sensor: " + data.message);
      }
    } catch (error) {
      console.error("Erro ao atualizar sensor:", error);
      alert("Erro ao atualizar sensor.");
    }
  });

  // Eventos de Navegação Simples
  btnAdicionar.addEventListener("click", () => {
    formCadastro.reset();
    carregarSensoresNasCombos();
    mostrarTela(telaCadastro);
  });

  btnGerenciarSensor.addEventListener("click", () => {
    carregarSensoresNasCombos();
    mostrarTela(telaSensor);
  });

  btnCancelarCadastro.addEventListener("click", voltarParaLista);
  btnCancelarSensor.addEventListener("click", () => mostrarTela(telaCadastro));
  btnCancelarEdicao.addEventListener("click", voltarParaLista);

  // Inicializa
  carregarLavouras();
  carregarSensoresNasCombos();
});

// Adicionar estilo para a mensagem de sem lavouras
document.head.insertAdjacentHTML(
  "beforeend",
  `
  <style>
    .mensagem-sem-lavouras {
      text-align: center;
      padding: 40px 20px;
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      margin: 20px auto;
      max-width: 500px;
    }
    
    .mensagem-sem-lavouras i {
      font-size: 3rem;
      color: #4caf50;
      margin-bottom: 15px;
      display: block;
    }
    
    .mensagem-sem-lavouras h3 {
      margin-bottom: 10px;
      color: #4caf50;
    }
    
    .mensagem-sem-lavouras p {
      color: #ccc;
      line-height: 1.5;
    }
    
    .status-indicator {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-ativa {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
    }
    
    .status-concluida {
      background: linear-gradient(135deg, #2196f3, #0d47a1);
      color: white;
    }
    
    .status-oculta {
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;
    }
  </style>
`
);
