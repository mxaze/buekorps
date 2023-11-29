const express = require("express");
const db = require("better-sqlite3")("database.db", { verbose: console.log });
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

const insertStmt = db.prepare(
  "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
);

app.post("/lagBruker", (req, res) => {
  const { name, email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (user) {
    res.send("User already exists");
  } else {
    const hash = bcrypt.hashSync(password, 6);
    insertStmt.run(name, email, hash);
    res.send("User created");
    res.redirect("/");
  }
});

app.use("/", express.static(path.join(__dirname, "public")));

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
