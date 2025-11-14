document.addEventListener("DOMContentLoaded", async () => {
  const userArea = document.getElementById("usuario-area");
  const nomeSpan = document.getElementById("usuario-nome");
  const btnLogout = document.getElementById("btnLogout");

  const logoutPopup = document.getElementById("logout-popup");
  const logoutConfirm = document.getElementById("logout-confirm");
  const logoutCancel = document.getElementById("logout-cancel");

  // 1) Verificar sessão do usuário
  try {
    const resp = await fetch("/api/sessao", { credentials: "same-origin" });

    if (!resp.ok) {
      window.location.href = "/";
      return;
    }

    const data = await resp.json();

    if (!data.authenticated || !data.user) {
      window.location.href = "/";
      return;
    }

    if (nomeSpan) {
      nomeSpan.textContent = data.user.nome || data.user.email || "Usuário";
    }
    if (userArea) {
      userArea.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "/";
    return;
  }

  // 2) Popup de logout
  if (btnLogout && logoutPopup && logoutConfirm && logoutCancel) {
    // Abrir popup ao clicar em "Sair"
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // evita conflito com o dropdown
      logoutPopup.classList.remove("hidden");
    });

    // Cancelar
    logoutCancel.addEventListener("click", () => {
      logoutPopup.classList.add("hidden");
    });

    // Confirmar
    logoutConfirm.addEventListener("click", async () => {
      try {
        await fetch("/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });

        logoutPopup.classList.add("hidden");
        window.location.href = "/";
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        logoutPopup.classList.add("hidden");
        window.location.href = "/";
      }
    });
  } else {
    console.error("Elementos de logout não encontrados no DOM.");
  }
});


/**
 * Aguarda o DOM ser totalmente carregado antes de executar
 * os scripts dos gráficos e sensores.
 */
document.addEventListener("DOMContentLoaded", function () {
  // --- 1. Script do Velocímetro (JustGage) ---

  // Verifica se as bibliotecas JustGage e Raphael estão carregadas
  if (typeof Raphael !== "undefined" && typeof JustGage !== "undefined") {
    let vento = new JustGage({
      id: "velocimetro",
      value: 12,
      min: 0,
      max: 60,
      title: "Km/h",
      label: "Velocidade",
      gaugeWidthScale: 0.6,
      levelColors: ["#00ff00", "#ffcc00", "#ff0000"],
      counter: true,
      customSectors: [
        {
          color: "#00ff00",
          lo: 0,
          hi: 20,
        },
        {
          color: "#ffcc00",
          lo: 20,
          hi: 40,
        },
        {
          color: "#ff0000",
          lo: 40,
          hi: 60,
        },
      ],
    });

    // --- Simulação de Atualização de Sensores ---
    setInterval(() => {
      // Atualiza velocímetro
      if (vento) {
        const novaVelocidade = Math.floor(Math.random() * 61);
        vento.refresh(novaVelocidade);
      }

      // Atualizar valores de texto dos sensores
      const umidadeSoloEl = document.getElementById("umidadeSoloValor");
      const phSoloEl = document.getElementById("phSoloValor");
      const umidadeArEl = document.getElementById("umidadeArValor");

      if (umidadeSoloEl) {
        umidadeSoloEl.textContent = (Math.random() * 30 + 60).toFixed(0) + "%";
      }
      if (phSoloEl) {
        phSoloEl.textContent = (Math.random() * 1.5 + 5.5).toFixed(1);
      }
      if (umidadeArEl) {
        umidadeArEl.textContent = (Math.random() * 30 + 60).toFixed(0) + "%";
      }
    }, 3000); // Atualiza a cada 3 segundos
  } else {
    console.error("Raphael ou JustGage não carregado.");
  }

  // --- 2. Script do Gráfico de Pizza (Chart.js) ---
  const ctxPizza = document.getElementById("graficoPizza");
  if (ctxPizza) {
    const dados = {
      labels: ["Nitrogênio", "Fósforo", "Potássio", "Outros"],
      datasets: [
        {
          label: "Distribuição",
          data: [25, 35, 20, 20],
          backgroundColor: [
            "#1b5e20", // Verde escuro (Nitrogênio)
            "#2e7d32", // Verde médio (Fósforo)
            "#43a047", // Verde claro (Potássio)
            "#81c784", // Verde bem claro (Outros)
          ],
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 15,
        },
      ],
    };

    const configPizza = {
      type: "doughnut",
      data: dados,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            display: false, // Legenda está no HTML
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                let value = context.raw || 0;
                return `${label}: ${value}%`;
              },
            },
          },
        },
      },
    };

    const graficoPizza = new Chart(ctxPizza.getContext("2d"), configPizza);
  } else {
    console.error("Elemento canvas 'graficoPizza' não encontrado.");
  }

  // --- 3. Script do Gráfico de Temperatura (Chart.js) ---
  const ctxTemp = document.getElementById("temperatureChart");
  if (ctxTemp) {
    const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const maxTemperatures = [28, 30, 32, 29, 31, 33, 30];
    const minTemperatures = [18, 19, 20, 17, 19, 21, 20];

    const temperatureChart = new Chart(ctxTemp.getContext("2d"), {
      type: "bar",
      data: {
        labels: daysOfWeek,
        datasets: [
          {
            label: "Máxima",
            data: maxTemperatures,
            backgroundColor: "rgba(255, 107, 107, 0.8)",
            borderColor: "#ff6b6b",
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: "Mínima",
            data: minTemperatures,
            backgroundColor: "rgba(77, 171, 247, 0.8)",
            borderColor: "#4dabf7",
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              padding: 8,
              font: { size: 11, weight: "500" },
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 6,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: 8,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y}°C`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 15,
            max: 35,
            grid: { color: "rgba(0, 0, 0, 0.05)", drawBorder: false },
            ticks: {
              callback: (value) => value + "°C",
              font: { size: 10 },
              stepSize: 5,
              padding: 5,
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, padding: 5 },
          },
        },
        interaction: { mode: "index", intersect: false },
      },
    });

    // Atualizar os valores de texto max/min
    const maxTempEl = document.getElementById("maxTempValue");
    const minTempEl = document.getElementById("minTempValue");

    if (maxTempEl) {
      maxTempEl.textContent = Math.max(...maxTemperatures) + "°C";
    }
    if (minTempEl) {
      minTempEl.textContent = Math.min(...minTemperatures) + "°C";
    }
  } else {
    console.error("Elemento canvas 'temperatureChart' não encontrado.");
  }

  // --- 4. Event Listeners para Botões Flutuantes ---

  const btnConcluir = document.getElementById("btnConcluirLavoura");
  const btnExcluir = document.getElementById("btnExcluirLavoura");

  if (btnConcluir) {
    btnConcluir.addEventListener("click", () => {
      if (
        confirm(
          'Deseja realmente marcar esta lavoura como "concluída"? Esta ação não pode ser desfeita.'
        )
      ) {
        alert("Lavoura concluída com sucesso!");
        // TODO: Futuramente, fazer fetch() para /lavoura/concluir/:id
        // e redirecionar para a lista de lavouras.
        // window.location.href = 'CadastroLavoura.html';
      }
    });
  }

  if (btnExcluir) {
    btnExcluir.addEventListener("click", () => {
      // O nome da lavoura não está disponível, então usamos uma msg genérica
      if (
        confirm(
          "Tem certeza que deseja EXCLUIR esta lavoura? Todos os dados (sensores, histórico) serão perdidos."
        )
      ) {
        alert("Lavoura excluída com sucesso!");
        // TODO: Futuramente, fazer fetch() para /lavoura/excluir/:id
        // e redirecionar para a lista de lavouras.
        // window.location.href = 'CadastroLavoura.html';
      }
    });
  }
});
