// NodeJS/server.js
"use strict";

//criação de branch
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./config/conexao");
const session = require("express-session"); // <--- NOVO

const app = express();
const PORT = process.env.PORT || 3000;

console.log(">>> SERVER.JS DA PASTA NODEJS FOI CARREGADO <<<");

// Middlewares para ler JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (server.js está em NodeJS/)
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ---------------- SESSÃO ----------------
app.use(
  session({
    secret: "um-segredo-bem-dificil-de-adivinhar", // em produção, use env
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hora de sessão
    },
  })
);

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect("/");
}

// Página de Lavouras (protegida)
app.get("/lavouras", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Lavouras.html"));
});

// API para checar sessão
app.get("/api/sessao", (req, res) => {
  if (req.session && req.session.user) {
    // autenticado
    return res.json({
      authenticated: true,
      user: req.session.user,
    });
  }
  return res.status(401).json({
    // não autenticado
    authenticated: false,
  });
});

// ====================================================================
// ROTA DE LOGIN (ALTERADA)
// ====================================================================
app.post("/login", async (req, res) => {
  console.log("=== POST /login ===");
  console.log("Body recebido:", req.body);

  const { email, senha } = req.body;

  if (!email || !senha) {
    // se dados incompletos
    return res.status(400).json({
      status: "error",
      message: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    // tentativa de login
    // 1. Buscar usuário pelo e-mail
    const sql =
      "SELECT ID_usuario, nome, email, senha FROM usuario WHERE email = ? LIMIT 1";
    const params = [email];

    const [rows] = await db.query(sql, params);

    if (!rows || rows.length === 0) {
      // Nenhum usuário com esse e-mail
      return res.status(401).json({
        status: "error",
        message: "E-mail ou senha inválidos.",
      });
    }

    const usuario = rows[0];

    // 2. Comparar a senha digitada com o hash
    const senhaConfere = await bcrypt.compare(senha, usuario.senha);

    if (!senhaConfere) {
      // senha incorreta
      return res.status(401).json({
        status: "error",
        message: "E-mail ou senha inválidos.",
      });
    }

    // 3. Login OK -> salvar na sessão
    req.session.user = {
      // dados do usuário na sessão
      id: usuario.ID_usuario,
      nome: usuario.nome,
      email: usuario.email,
    };

    console.log("[/login] Login OK para ID_usuario =", usuario.ID_usuario);

    return res.status(200).json({
      status: "success",
      message: "Login realizado com sucesso!",
      redirect: "/Menulateral.html", // o front vai redirecionar para cá
    });
  } catch (error) {
    console.error("[/login] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao realizar login.",
    });
  }
});

// ====================================================================
// ROTA PARA MENU LATERAL (PÁGINA INICIAL)
// ====================================================================

app.get("/Menulateral.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Menulateral.html"));
});

// Proteger acesso direto ao Menulateral.html
app.get("/Menulateral.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Menulateral.html"));
});

// ====================================================================
// ROTA DE LOGOUT
// ====================================================================
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    // limpa cookie da sessão (nome padrão do cookie de sessão do express-session)
    res.clearCookie("connect.sid");
    return res.json({ status: "success", message: "Logout ok" });
  });
});

// ====================================================================
// ROTA DE CADASTRO COM SENHA CRIPTOGRAFADA
// ====================================================================
app.post("/cadastro", async (req, res) => {
  console.log("=== POST /cadastro ===");
  console.log("Body recebido:", req.body);

  const { nome, email, telefone, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      status: "error",
      message: "Nome, e-mail e senha são obrigatórios.",
    });
  }

  try {
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    console.log("Senha (texto) :", senha);
    console.log("Senha (hash)  :", senhaHash);

    // ordem das colunas: nome, email, senha, telefone
    const sql =
      "INSERT INTO usuario (nome, email, senha, telefone) VALUES (?, ?, ?, ?)";
    const params = [nome, email, senhaHash, telefone || null];

    const [result] = await db.query(sql, params);

    console.log("[/cadastro] Usuário cadastrado, id =", result.insertId);

    return res.status(201).json({
      status: "success",
      message: "Usuário cadastrado com sucesso!",
    });
  } catch (error) {
    console.error("[/cadastro] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao registrar usuário.",
      detalhes: error.message,
    });
  }
});

// Página de listagem de usuários
app.get("/usuarios", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "usuarios.html"));
});

// API para retornar os usuários em JSON
app.get("/api/usuarios", ensureAuthenticated, async (req, res) => {
  try {
    const sql =
      "SELECT ID_usuario, nome, email, telefone FROM usuario ORDER BY nome";
    const [rows] = await db.query(sql);

    return res.json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("[/api/usuarios] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao listar usuários.",
    });
  }
});

// Bloqueio de acesso direto ao arquivo HTML
app.get("/Lavouras.html", (req, res) => {
  return res.redirect("/lavouras");
});

// ====================================================================
// API PARA DADOS DO SENSOR (GRÁFICO PIZZA)
// ====================================================================
app.get("/api/sensor/ultimo", ensureAuthenticated, async (req, res) => {
  try {
    // Busca a última leitura inserida (ordenada pelo ID decrescente)
    const sql = `
      SELECT nitrogenio, fosforo, potassio 
      FROM info_sensor 
      ORDER BY ID_info DESC 
      LIMIT 1
    `;

    const [rows] = await db.query(sql);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Nenhuma leitura de sensor encontrada.",
      });
    }

    // Retorna os dados encontrados
    return res.json({
      status: "success",
      data: rows[0],
    });
  } catch (error) {
    console.error("[/api/sensor/ultimo] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao buscar dados do sensor.",
    });
  }
});

// ====================================================================
// NOVAS ROTAS PARA O SELETOR DE LAVOURAS (ADICIONADAS AQUI)
// ====================================================================

// ROTA PARA BUSCAR LAVOURAS DO USUÁRIO (para o seletor) - VERIFIQUE ESTA ROTA
// Atualize a rota /api/lavouras/lista para histórico (mostra todas exceto ocultas)
app.get("/api/lavouras/lista", ensureAuthenticated, async (req, res) => {
  try {
    const idUsuario = req.session.user.id;

    const sql = `
      SELECT 
        ID_lavoura,
        nome_lavoura AS nome,
        latitude,
        longitude,
        status
      FROM lavoura 
      WHERE ID_usuario = ? 
        AND status != 'oculta'
      ORDER BY nome_lavoura
    `;

    const [rows] = await db.query(sql, [idUsuario]);

    return res.json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("[GET /api/lavouras/lista] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao buscar lavouras.",
    });
  }
});

// ROTA PARA DADOS COMPLETOS DE UMA LAVOURA (gráficos + clima) - VERSÃO FINAL CORRIGIDA
app.get(
  "/api/lavouras/:id/dados-completos",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;
      const idUsuario = req.session.user.id;

      // Verifica se a lavoura pertence ao usuário
      const checkSql =
        "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
      const [checkRows] = await db.query(checkSql, [id, idUsuario]);

      if (checkRows.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Permissão negada ou lavoura não encontrada.",
        });
      }

      // 1. Busca dados do clima (última leitura)
      const climaSql = `
      SELECT 
        temp_ar, 
        umid_ar, 
        vel_vento, 
        pluviosidade, 
        fotoperiodo,
        clima,
        DATE_FORMAT(data_leitura, '%d/%m/%Y %H:%i') as data_formatada
      FROM info_ambiente 
      WHERE ID_lavoura = ? 
      ORDER BY data_leitura DESC 
      LIMIT 1
    `;

      const [climaRows] = await db.query(climaSql, [id]);
      const climaData = climaRows.length > 0 ? climaRows[0] : null;

      // 2. Busca dados do sensor (última leitura) - COM NOMES CORRETOS DAS COLUNAS
      // Primeiro, verifica se há sensor associado à lavoura
      const sensorLavouraSql = `
      SELECT l.ID_sensor, s.apelido 
      FROM lavoura l
      LEFT JOIN sensor s ON l.ID_sensor = s.ID_sensor
      WHERE l.ID_lavoura = ?
    `;

      const [sensorLavouraRows] = await db.query(sensorLavouraSql, [id]);
      let sensorData = null;

      if (sensorLavouraRows.length > 0 && sensorLavouraRows[0].ID_sensor) {
        // Se a lavoura tem sensor associado, busca os dados
        const sensorSql = `
        SELECT 
          nitrogenio,
          fosforo,
          potassio,
          umid_solo,
          ph_solo,
          temp_solo,
          DATE_FORMAT(leitura_sensor, '%d/%m/%Y %H:%i') as data_leitura_sensor
        FROM info_sensor 
        WHERE ID_sensor = ?
        ORDER BY leitura_sensor DESC 
        LIMIT 1
      `;

        const [sensorRows] = await db.query(sensorSql, [
          sensorLavouraRows[0].ID_sensor,
        ]);

        if (sensorRows.length > 0) {
          sensorData = {
            ID_sensor: sensorLavouraRows[0].ID_sensor,
            apelido: sensorLavouraRows[0].apelido,
            nitrogenio: sensorRows[0].nitrogenio,
            fosforo: sensorRows[0].fosforo,
            potassio: sensorRows[0].potassio,
            umidade_solo: sensorRows[0].umid_solo, // Mapeando umid_solo -> umidade_solo
            ph_solo: sensorRows[0].ph_solo,
            temperatura_solo: sensorRows[0].temp_solo, // Mapeando temp_solo -> temperatura_solo
            data_leitura_sensor: sensorRows[0].data_leitura_sensor,
          };
        }
      }

      // 3. Busca histórico de temperaturas para gráfico (últimos 7 dias)
      const historicoTempSql = `
      SELECT 
        DATE(data_leitura) as data,
        AVG(temp_ar) as temp_media,
        MAX(temp_ar) as temp_max,
        MIN(temp_ar) as temp_min
      FROM info_ambiente 
      WHERE ID_lavoura = ? 
        AND data_leitura >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(data_leitura)
      ORDER BY data DESC
      LIMIT 7
    `;

      const [historicoRows] = await db.query(historicoTempSql, [id]);

      return res.json({
        status: "success",
        data: {
          clima: climaData,
          sensor: sensorData,
          historicoTemperatura: historicoRows.reverse(), // Inverter para ordem cronológica
          lavouraId: id,
        },
      });
    } catch (error) {
      console.error("[GET /api/lavouras/:id/dados-completos] ERRO:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao buscar dados da lavoura.",
      });
    }
  }
);

// Rota para buscar o clima atual da lavoura (Tabela info_ambiente)
app.get("/api/lavouras/:id/clima", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.session.user.id;

    // Verifica se a lavoura pertence ao usuário
    const checkSql =
      "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
    const [checkRows] = await db.query(checkSql, [id, idUsuario]);

    if (checkRows.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "Permissão negada.",
      });
    }

    const sql = `
      SELECT 
        temp_ar, 
        umid_ar, 
        pluviosidade, 
        vel_vento, 
        clima, 
        data_leitura
      FROM info_ambiente 
      WHERE ID_lavoura = ? 
      ORDER BY data_leitura DESC 
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.json({
        status: "empty",
        message: "Sem dados climáticos para esta lavoura.",
      });
    }

    return res.json({
      status: "success",
      data: rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar clima:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Erro no servidor." });
  }
});

/* ============================================================
 * CRUD DE LAVOURAS
 * ============================================================ */

/* ============================================================
 * AJUSTE NA ROTA DE CRIAR LAVOURA
 * ============================================================ */
app.post("/api/lavouras", ensureAuthenticated, async (req, res) => {
  try {
    // Agora recebemos 'idSensor' vindo diretamente do <select>
    const { nomeLavoura, dataPlantio, cultura, latitude, longitude, idSensor } =
      req.body;
    const idUsuario = req.session.user.id;

    if (!cultura || !dataPlantio) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatórios faltando." });
    }

    const sql = `
      INSERT INTO lavoura 
      (ID_usuario, ID_sensor, nome_lavoura, tipo_cultura, data_inicio_plantio, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Se idSensor for string vazia ou "0", gravamos NULL
    const sensorParaGravar = idSensor && idSensor !== "0" ? idSensor : null;

    const values = [
      idUsuario,
      sensorParaGravar,
      nomeLavoura || "Minha Lavoura",
      cultura,
      dataPlantio,
      latitude || null,
      longitude || null,
    ];

    const [result] = await db.query(sql, values);

    return res
      .status(201)
      .json({
        status: "success",
        message: "Lavoura criada!",
        id: result.insertId,
      });
  } catch (error) {
    console.error("Erro ao criar lavoura:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Erro ao salvar lavoura." });
  }
});

// 2. READ (Listar lavouras do usuário logado)
app.get("/api/lavouras", ensureAuthenticated, async (req, res) => {
  try {
    const idUsuario = req.session.user.id;

    // Formata a data para YYYY-MM-DD para facilitar no input type="date"
    const sql = `
      SELECT 
        ID_lavoura,
        ID_sensor, 
        nome_lavoura AS nome, 
        tipo_cultura AS cultura, 
        DATE_FORMAT(data_inicio_plantio, '%Y-%m-%d') AS data, 
        latitude, 
        longitude,
        status 
      FROM lavoura 
      WHERE ID_usuario = ?
        AND status != 'oculta'
      ORDER BY 
        CASE status
          WHEN 'ativa' THEN 1
          WHEN 'concluída' THEN 2
          ELSE 3
        END,
        ID_lavoura DESC
    `;

    const [rows] = await db.query(sql, [idUsuario]);

    return res.json({
      status: "success",
      data: rows,
    });

  } catch (error) {
    console.error("[GET /api/lavouras] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao buscar lavouras.",
    });
  }
});

// 3. UPDATE (Atualizar lavoura - Versão Corrigida e Unificada)
app.put("/api/lavouras/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    // ADICIONADO: idSensor na leitura do corpo da requisição
    const { nomeLavoura, dataPlantio, cultura, latitude, longitude, idSensor } =
      req.body;
    const idUsuario = req.session.user.id;

    // 1. Verifica se a lavoura pertence ao usuário antes de editar
    const checkSql =
      "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
    const [checkRows] = await db.query(checkSql, [id, idUsuario]);

    if (checkRows.length === 0) {
      return res
        .status(403)
        .json({
          status: "error",
          message: "Permissão negada ou lavoura não encontrada.",
        });
    }

    // 2. Lógica para tratar o sensor:
    // Se vier vazio ou "0", gravamos NULL (remove o sensor).
    const sensorParaGravar = idSensor && idSensor !== "0" ? idSensor : null;

    // 3. SQL Atualizado com ID_sensor
    const updateSql = `
      UPDATE lavoura 
      SET 
        nome_lavoura = ?, 
        tipo_cultura = ?, 
        data_inicio_plantio = ?, 
        latitude = ?, 
        longitude = ?,
        ID_sensor = ? 
      WHERE ID_lavoura = ?
    `;

    // 4. Executa a atualização (A ordem dos parâmetros deve bater com os '?' acima)
    await db.query(updateSql, [
      nomeLavoura,
      cultura,
      dataPlantio,
      latitude,
      longitude,
      sensorParaGravar, // Novo campo
      id,
    ]);

    return res.json({
      status: "success",
      message: "Lavoura atualizada com sucesso!",
    });
  } catch (error) {
    console.error("[PUT /api/lavouras] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao atualizar lavoura.",
    });
  }
});

// 4. DELETE (Excluir lavoura)
app.delete("/api/lavouras/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.session.user.id;

    // Verifica propriedade
    const checkSql =
      "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
    const [checkRows] = await db.query(checkSql, [id, idUsuario]);

    if (checkRows.length === 0) {
      return res
        .status(403)
        .json({ status: "error", message: "Permissão negada." });
    }

    const deleteSql = "DELETE FROM lavoura WHERE ID_lavoura = ?";
    await db.query(deleteSql, [id]);

    return res.json({
      status: "success",
      message: "Lavoura excluída com sucesso!",
    });
  } catch (error) {
    console.error("[DELETE /api/lavouras] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao excluir lavoura.",
    });
  }
});

// NO SERVER.JS, adicione estas rotas após as rotas CRUD de lavouras:

// ====================================================================
// ROTAS PARA CONCLUSÃO E "EXCLUSÃO" DE LAVOURAS
// ====================================================================

// Concluir lavoura
app.put("/api/lavouras/:id/concluir", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.session.user.id;

    // Verifica se a lavoura pertence ao usuário
    const checkSql =
      "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
    const [checkRows] = await db.query(checkSql, [id, idUsuario]);

    if (checkRows.length === 0) {
      return res
        .status(403)
        .json({ status: "error", message: "Permissão negada." });
    }

    // Atualiza status para "concluída" e data_fim
    const updateSql = `
      UPDATE lavoura 
      SET 
        status = 'concluída',
        data_fim = CURDATE()
      WHERE ID_lavoura = ?
    `;

    await db.query(updateSql, [id]);

    return res.json({
      status: "success",
      message: "Lavoura concluída com sucesso!",
    });
  } catch (error) {
    console.error("[PUT /api/lavouras/:id/concluir] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao concluir lavoura.",
    });
  }
});

// "Excluir" lavoura (marcar como oculta)
app.put("/api/lavouras/:id/ocultar", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.session.user.id;

    // Verifica se a lavoura pertence ao usuário
    const checkSql =
      "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
    const [checkRows] = await db.query(checkSql, [id, idUsuario]);

    if (checkRows.length === 0) {
      return res
        .status(403)
        .json({ status: "error", message: "Permissão negada." });
    }

    // Marca como oculta (não deleta realmente)
    const updateSql = `
      UPDATE lavoura 
      SET 
        status = 'oculta',
        data_fim = CURDATE()
      WHERE ID_lavoura = ?
    `;

    await db.query(updateSql, [id]);

    return res.json({
      status: "success",
      message: "Lavoura removida da sua visão!",
    });
  } catch (error) {
    console.error("[PUT /api/lavouras/:id/ocultar] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao ocultar lavoura.",
    });
  }
});

/* ============================================================
 * ROTAS DE SENSORES (NOVA LÓGICA)
 * ============================================================ */

// 1. LISTAR SENSORES DO USUÁRIO (Para preencher a Combobox)
app.get("/api/sensores/usuario", ensureAuthenticated, async (req, res) => {
  try {
    const idUsuario = req.session.user.id;
    // Busca apenas ID e Apelido dos sensores deste usuário
    const sql = "SELECT ID_sensor, apelido FROM sensor WHERE ID_usuario = ?";
    const [rows] = await db.query(sql, [idUsuario]);

    return res.json({ status: "success", data: rows });
  } catch (error) {
    console.error("Erro ao listar sensores:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Erro ao buscar sensores." });
  }
});

// 2. EDITAR APELIDO DO SENSOR
app.put("/api/sensores/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params; // ID do sensor
    const { apelido } = req.body; // Novo nome
    const idUsuario = req.session.user.id;

    if (!apelido) {
      return res
        .status(400)
        .json({ status: "error", message: "Apelido é obrigatório." });
    }

    // Garante que só edita se o sensor pertencer ao usuário logado
    const sql =
      "UPDATE sensor SET apelido = ? WHERE ID_sensor = ? AND ID_usuario = ?";
    const [result] = await db.query(sql, [apelido, id, idUsuario]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          status: "error",
          message: "Sensor não encontrado ou não pertence a você.",
        });
    }

    return res.json({
      status: "success",
      message: "Sensor atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao editar sensor:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Erro ao atualizar sensor." });
  }
});

/* ============================================================
 * ROTAS PARA HISTÓRICO DE LAVOURAS
 * ============================================================ */

// 1. Buscar todas as lavouras do usuário (ativas e históricas)
app.get("/api/historico/lavouras", ensureAuthenticated, async (req, res) => {
  try {
    const idUsuario = req.session.user.id;

    const sql = `
      SELECT 
        ID_lavoura,
        nome_lavoura AS nome,
        tipo_cultura AS cultura,
        DATE_FORMAT(data_inicio_plantio, '%d/%m/%Y') AS data_inicio,
        DATE_FORMAT(data_fim, '%d/%m/%Y') AS data_fim,
        status,
        CASE 
          WHEN status = 'concluída' THEN 'Concluída'
          WHEN status = 'oculta' THEN 'Oculta'
          ELSE 'Em Andamento'
        END AS status_display
      FROM lavoura 
      WHERE ID_usuario = ?
      ORDER BY 
        CASE status 
          WHEN 'ativa' THEN 1
          WHEN 'concluída' THEN 2
          WHEN 'oculta' THEN 3
          ELSE 4
        END,
        data_inicio_plantio DESC
    `;

    const [rows] = await db.query(sql, [idUsuario]);

    return res.json({
      status: "success",
      data: rows,
    });
  } catch (error) {
    console.error("[GET /api/historico/lavouras] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao buscar histórico de lavouras.",
    });
  }
});

// 2. Buscar dados históricos COMPLETOS de uma lavoura específica
app.get(
  "/api/historico/lavouras/:id/detalhes",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;
      const idUsuario = req.session.user.id;

      // Verifica se a lavoura pertence ao usuário
      const checkSql =
        "SELECT ID_lavoura, nome_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
      const [checkRows] = await db.query(checkSql, [id, idUsuario]);

      if (checkRows.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Permissão negada ou lavoura não encontrada.",
        });
      }

      const lavouraNome = checkRows[0].nome_lavoura;

      // 1. Buscar dados do clima (todas as leituras)
      const climaSql = `
      SELECT 
        temp_ar, 
        umid_ar, 
        vel_vento, 
        pluviosidade, 
        fotoperiodo,
        clima,
        DATE_FORMAT(data_leitura, '%d/%m/%Y %H:%i') as data_leitura
      FROM info_ambiente 
      WHERE ID_lavoura = ?
      ORDER BY data_leitura DESC
      LIMIT 100  -- Limitar a 100 registros para não sobrecarregar
    `;

      const [climaRows] = await db.query(climaSql, [id]);

      // 2. Buscar dados do sensor (se houver sensor associado)
      let sensorRows = [];

      const sensorLavouraSql = `
      SELECT l.ID_sensor
      FROM lavoura l
      WHERE l.ID_lavoura = ?
    `;

      const [sensorLavouraResult] = await db.query(sensorLavouraSql, [id]);

      if (sensorLavouraResult.length > 0 && sensorLavouraResult[0].ID_sensor) {
        const sensorSql = `
        SELECT 
          nitrogenio,
          fosforo,
          potassio,
          umid_solo,
          ph_solo,
          temp_solo,
          DATE_FORMAT(leitura_sensor, '%d/%m/%Y %H:%i') as data_leitura
        FROM info_sensor 
        WHERE ID_sensor = ?
        ORDER BY leitura_sensor DESC
        LIMIT 100
      `;

        [sensorRows] = await db.query(sensorSql, [
          sensorLavouraResult[0].ID_sensor,
        ]);
      }

      // 3. Combinar dados para tabela unificada
      const dadosCombinados = [];

      // Adicionar dados de clima
      climaRows.forEach((clima) => {
        dadosCombinados.push({
          tipo: "clima",
          data_leitura: clima.data_leitura,
          umidade_solo: null,
          umidade_ar: clima.umid_ar,
          velocidade_vento: clima.vel_vento,
          ph_solo: null,
          clima: clima.clima,
          temperatura: clima.temp_ar,
          nitrogenio: null,
          fosforo: null,
          potassio: null,
          temp_solo: null,
        });
      });

      // Adicionar dados do sensor
      sensorRows.forEach((sensor) => {
        dadosCombinados.push({
          tipo: "sensor",
          data_leitura: sensor.data_leitura,
          umidade_solo: sensor.umid_solo,
          umidade_ar: null,
          velocidade_vento: null,
          ph_solo: sensor.ph_solo,
          clima: null,
          temperatura: null,
          nitrogenio: sensor.nitrogenio,
          fosforo: sensor.fosforo,
          potassio: sensor.potassio,
          temp_solo: sensor.temp_solo,
        });
      });

      // Ordenar por data (mais recente primeiro)
      dadosCombinados.sort((a, b) => {
        return (
          new Date(b.data_leitura.split("/").reverse().join("-")) -
          new Date(a.data_leitura.split("/").reverse().join("-"))
        );
      });

      return res.json({
        status: "success",
        data: {
          lavoura: {
            id: id,
            nome: lavouraNome,
            dados_combinados: dadosCombinados,
            total_registros: dadosCombinados.length,
            registros_clima: climaRows.length,
            registros_sensor: sensorRows.length,
          },
        },
      });
    } catch (error) {
      console.error("[GET /api/historico/lavouras/:id/detalhes] ERRO:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao buscar detalhes históricos.",
      });
    }
  }
);

// 3. Marcar lavoura como concluída
app.put("/api/lavouras/:id/concluir", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.session.user.id;

    // Verifica se a lavoura pertence ao usuário
    const checkSql =
      "SELECT ID_lavoura FROM lavoura WHERE ID_lavoura = ? AND ID_usuario = ?";
    const [checkRows] = await db.query(checkSql, [id, idUsuario]);

    if (checkRows.length === 0) {
      return res
        .status(403)
        .json({ status: "error", message: "Permissão negada." });
    }

    const updateSql = `
      UPDATE lavoura 
      SET 
        status = 'concluída',
        data_fim = CURDATE()
      WHERE ID_lavoura = ?
    `;

    await db.query(updateSql, [id]);

    return res.json({
      status: "success",
      message: "Lavoura marcada como concluída com sucesso!",
    });
  } catch (error) {
    console.error("[PUT /api/lavouras/:id/concluir] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao concluir lavoura.",
    });
  }
});

// 4. Filtrar lavouras por período
app.get(
  "/api/historico/lavouras/filtrar",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const idUsuario = req.session.user.id;
      const { data_inicio, data_fim, status, nome } = req.query;

      let sql = `
      SELECT 
        ID_lavoura,
        nome_lavoura AS nome,
        tipo_cultura AS cultura,
        DATE_FORMAT(data_inicio_plantio, '%d/%m/%Y') AS data_inicio,
        DATE_FORMAT(data_fim, '%d/%m/%Y') AS data_fim,
        status,
        CASE 
          WHEN status = 'concluída' THEN 'Concluída'
          WHEN status = 'oculta' THEN 'Oculta'
          ELSE 'Em Andamento'
        END AS status_display
      FROM lavoura 
      WHERE ID_usuario = ?
    `;

      const params = [idUsuario];

      // Aplicar filtros dinamicamente
      if (data_inicio) {
        sql += " AND data_inicio_plantio >= ?";
        params.push(data_inicio);
      }

      if (data_fim) {
        sql += " AND (data_fim <= ? OR data_fim IS NULL)";
        params.push(data_fim);
      }

      if (status && status !== "todos") {
        sql += " AND status = ?";
        params.push(status);
      }

      if (nome) {
        sql += " AND nome_lavoura LIKE ?";
        params.push(`%${nome}%`);
      }

      sql += " ORDER BY data_inicio_plantio DESC";

      const [rows] = await db.query(sql, params);

      return res.json({
        status: "success",
        data: rows,
      });
    } catch (error) {
      console.error("[GET /api/historico/lavouras/filtrar] ERRO:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao filtrar lavouras.",
      });
    }
  }
);

// 5. Buscar estatísticas do histórico
app.get(
  "/api/historico/estatisticas",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const idUsuario = req.session.user.id;

      const sql = `
      SELECT 
        COUNT(*) as total_lavouras,
        SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) as lavouras_ativas,
        SUM(CASE WHEN status = 'concluída' THEN 1 ELSE 0 END) as lavouras_concluidas,
        SUM(CASE WHEN status = 'oculta' THEN 1 ELSE 0 END) as lavouras_ocultas,
        MIN(data_inicio_plantio) as primeira_lavoura,
        MAX(COALESCE(data_fim, data_inicio_plantio)) as ultima_atividade
      FROM lavoura 
      WHERE ID_usuario = ?
    `;

      const [rows] = await db.query(sql, [idUsuario]);

      return res.json({
        status: "success",
        data: rows[0] || {},
      });
    } catch (error) {
      console.error("[GET /api/historico/estatisticas] ERRO:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao buscar estatísticas.",
      });
    }
  }
);

/* ============================================================
 * 404 GENÉRICO
 * ============================================================ */

app.use((req, res) => {
  console.log("[404] Rota não encontrada:", req.method, req.url);
  res.status(404).send("Página não encontrada.");
});

/* ============================================================
 * SUBIDA DO SERVIDOR
 * ============================================================ */

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
