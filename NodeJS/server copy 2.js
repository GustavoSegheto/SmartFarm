// NodeJS/server.js
"use strict";

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./config/conexao"); // mantém o seu módulo de conexão

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares para ler JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================
// Arquivos estáticos
// ====================
// server.js está em NodeJS/, por isso voltamos um nível (..)
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// ====================
// Rotas de páginas
// ====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/lavouras", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Lavouras.html"));
});

app.get("/avisos", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Avisos.html"));
});

app.get("/cotas", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Cotas.html"));
});

app.get("/historico", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "Historico.html"));
});

// ====================
// Rota de cadastro (POST)
// ====================
// Insere na tabela `usuario` com senha criptografada
app.post("/cadastro", (req, res) => {
  const { nome, email, telefone, senha } = req.body;

  // Validação simples
  if (!nome || !email || !telefone || !senha) {
    return res.status(400).json({
      status: "error",
      message: "Todos os campos são obrigatórios.",
    });
  }

  // Geração do hash da senha
  const saltRounds = 10;
  const senhaHash = bcrypt.hashSync(senha, saltRounds);

  const sql =
    "INSERT INTO usuario (nome, email, telefone, senha) VALUES (?, ?, ?, ?)";
  const values = [nome, email, telefone, senhaHash];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar usuário:", err);
      return res.status(500).json({
        status: "error",
        message: "Erro ao registrar usuário.",
      });
    }

    console.log(`Usuário cadastrado com sucesso! ID: ${result.insertId}`);
    return res.status(201).json({
      status: "success",
      message: "Usuário cadastrado com sucesso!",
    });
  });
});

// (Opcional) rota de login pode ser implementada depois
// app.post("/login", ...);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
