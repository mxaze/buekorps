const express = require('express');
const db = require("better-sqlite3")("database.db", { verbose: console.log });
const bcrypt = require("bcrypt");
const session = require("express-session");
const req = require('express/lib/request');

const app = express();

const insertStmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");

app.post("/post/createUser", (req, res) => {
    const { name, email, password } = req.body;
    insertStmt.run(name, email, password);
    res.send("User created");
});

app.listen(3000, () => {
    console.log(`Server running on port 3000`);
  });