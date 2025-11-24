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
  if (req.session && req.session.user) { // autenticado
    return res.json({
      authenticated: true,
      user: req.session.user,
    });
  }
  return res.status(401).json({ // não autenticado
    authenticated: false,
  });
});

// ====================================================================
// ROTA DE LOGIN
// ====================================================================
app.post("/login", async (req, res) => { 
  console.log("=== POST /login ===");
  console.log("Body recebido:", req.body);

  const { email, senha } = req.body;

  if (!email || !senha) { // se dados incompletos
    return res.status(400).json({
      status: "error",
      message: "E-mail e senha são obrigatórios.",
    });
  }

  try { // tentativa de login
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

    if (!senhaConfere) { // senha incorreta
      return res.status(401).json({
        status: "error",
        message: "E-mail ou senha inválidos.",
      });
    }

    // 3. Login OK -> salvar na sessão
    req.session.user = { // dados do usuário na sessão
      id: usuario.ID_usuario,
      nome: usuario.nome,
      email: usuario.email,
    };

    console.log("[/login] Login OK para ID_usuario =", usuario.ID_usuario);

    return res.status(200).json({ 
      status: "success",
      message: "Login realizado com sucesso!",
      redirect: "/lavouras", // o front vai redirecionar para cá
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
app.get("/usuarios", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "usuarios.html"));
});

// API para retornar os usuários em JSON
app.get("/api/usuarios", async (req, res) => {
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


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
