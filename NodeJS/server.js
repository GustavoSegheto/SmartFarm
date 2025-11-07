// server.js
"use strict";

const express = require("express");
const path = require("path");
const db = require('./config/conexao');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para ler JSON/formulários, caso você use POST depois
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Arquivos estáticos do frontend ===
// HTML está em /public
app.use(express.static(path.join(__dirname, "..", "public")));

// CSS, JS e imagens estão fora de /public
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// === Rotas de páginas ===

// Rota principal -> public/index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Rotas amigáveis opcionais (se você quiser acessar sem .html)
app.get("/lavouras", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Lavouras.html"));
});

app.get("/avisos", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Avisos.html"));
});

app.get("/cotas", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Cotas.html"));
});

app.get("/historico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Historico.html"));
});

// =========================================================================
// ROTA DE CADASTRO (POST)
// =========================================================================
app.post('/cadastro', (req, res) => {
    // req.body contém os dados enviados pelo formulário (ex: { nome: 'João', email: 'joao@ex.com', ... })
    const { nome, email, telefone, senha } = req.body;

    // SQL: Usamos '?' para placeholders, o que ajuda a prevenir SQL Injection
    const sql = 'INSERT INTO usuario (nome, email, telefone, senha) VALUES (?, ?, ?, ?)';

    // Valores a serem inseridos
    const values = [nome, email, telefone, senha];

    // Executa a consulta no banco de dados
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            // Envia uma resposta de erro para o frontend
            return res.status(500).json({ status: 'error', message: 'Erro ao registrar usuário.' });
        }

        console.log(`Usuário cadastrado com sucesso! ID: ${result.insertId}`);
        // Envia uma resposta de sucesso para o frontend
        res.status(201).json({ status: 'success', message: 'Usuário cadastrado com sucesso!' });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
