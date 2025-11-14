// NodeJS/server.js
"use strict";

const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./config/conexao"); // conexão já existente

const app = express();
const PORT = process.env.PORT || 3000;

/* ============================================================
 * HELPER PARA CONSULTAS AO BANCO (aceita promise OU callback)
 * ============================================================ */

/**
 * runQuery(sql, params)
 * - Se db.query retornar Promise (mysql2/promise), usamos await.
 * - Se for estilo callback (mysql), encapsulamos em Promise.
 */
async function runQuery(sql, params = []) {
  // Tentativa de detectar assinatura: 2 argumentos → estilo promise
  if (db.query.length <= 2) {
    // db.query(sql, params) → Promise<[rows, fields]>
    const [rows] = await db.query(sql, params);
    return rows;
  }

  // 3 argumentos → estilo callback: db.query(sql, params, callback)
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

/* ============================================================
 * MIDDLEWARES BÁSICOS
 * ============================================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão
app.use(
  session({
    secret: "um-segredo-bem-forte-aqui", // em produção, usar variável de ambiente
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1h
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// Evitar cache (principalmente em páginas protegidas)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Log de requisições para depuração
app.use((req, res, next) => {
  console.log(
    `[REQ] ${req.method} ${req.url}  user=`,
    req.session?.user || null
  );
  next();
});

/* ============================================================
 * ARQUIVOS ESTÁTICOS (apenas CSS / JS / ASSETS)
 * ============================================================ *
 * Não exponho /public inteira para não permitir acesso direto
 * a Lavouras.html sem passar pela rota protegida.
 */

app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

/* ============================================================
 * MIDDLEWARE DE AUTENTICAÇÃO
 * ============================================================ */

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // Se for chamada de API (AJAX/JSON), responde 401 em JSON
  const aceitaJson = req.xhr || (req.headers.accept || "").includes("application/json");
  if (aceitaJson) {
    return res.status(401).json({
      authenticated: false,
      message: "Usuário não autenticado.",
    });
  }

  // Se for rota de página (como /lavouras), redireciona para o login com um flag
  return res.redirect("/?auth=0");
}


/* ============================================================
 * ROTAS DE PÁGINA (HTML)
 * ============================================================ */

// Tela inicial (login/cadastro)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Tela de Lavouras – PROTEGIDA
app.get("/lavouras", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Lavouras.html"));
});

// Tela de Usuários – PROTEGIDA
app.get("/usuarios", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "usuarios.html"));
});

// Bloqueio de acesso direto ao arquivo HTML
app.get("/Lavouras.html", (req, res) => {
  return res.redirect("/lavouras");
});

/* ============================================================
 * APIS DE SESSÃO / AUTENTICAÇÃO
 * ============================================================ */

// Verificar sessão (usado em Lavouras.js)
app.get("/api/sessao", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user,
    });
  }
  return res.status(401).json({ authenticated: false });
});

// Login
app.post("/login", async (req, res) => {
  console.log("=== POST /login ===");
  console.log("Body recebido:", req.body);

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      status: "error",
      message: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    const sql =
      "SELECT ID_usuario, nome, email, senha FROM usuario WHERE email = ? LIMIT 1";

    const rows = await runQuery(sql, [email]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "E-mail ou senha inválidos.",
      });
    }

    const usuario = rows[0];

    const senhaConfere = await bcrypt.compare(senha, usuario.senha);
    if (!senhaConfere) {
      return res.status(401).json({
        status: "error",
        message: "E-mail ou senha inválidos.",
      });
    }

    // Login OK → grava usuário na sessão
    req.session.user = {
      id: usuario.ID_usuario,
      nome: usuario.nome,
      email: usuario.email,
    };

    console.log("[/login] Login OK para ID_usuario =", usuario.ID_usuario);

    return res.status(200).json({
      status: "success",
      message: "Login realizado com sucesso!",
      redirect: "/lavouras",
    });
  } catch (error) {
    console.error("[/login] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao realizar login.",
    });
  }
});

// Logout (usado pelo popup da Lavouras)
app.post("/logout", (req, res) => {
  console.log("[POST /logout] session.user antes =", req.session?.user || null);

  if (!req.session) {
    return res.json({
      status: "success",
      message: "Já estava deslogado.",
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("[/logout] ERRO ao destruir sessão:", err);
      return res.status(500).json({
        status: "error",
        message: "Erro ao fazer logout.",
      });
    }

    res.clearCookie("connect.sid");
    return res.json({
      status: "success",
      message: "Logout realizado com sucesso.",
    });
  });
});

/* ============================================================
 * APIS DE USUÁRIOS
 * ============================================================ */

// Cadastro de usuário
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

    const sql =
      "INSERT INTO usuario (nome, email, senha, telefone) VALUES (?, ?, ?, ?)";
    const params = [nome, email, senhaHash, telefone || null];

    const result = await runQuery(sql, params);

    console.log(
      `[/cadastro] Usuário cadastrado com sucesso! ID: ${result.insertId || "?"}`
    );

    return res.status(201).json({
      status: "success",
      message: "Usuário cadastrado com sucesso!",
    });
  } catch (error) {
    console.error("[/cadastro] ERRO:", error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao registrar usuário.",
    });
  }
});

// Listar usuários (para usuarios.html) – protegido
app.get("/api/usuarios", ensureAuthenticated, async (req, res) => {
  try {
    const sql =
      "SELECT ID_usuario, nome, email, telefone FROM usuario ORDER BY nome";

    const rows = await runQuery(sql);

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
