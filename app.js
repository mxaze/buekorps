const express = require("express");
const db = require("better-sqlite3")("database.db");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const app = express();

app.use(express.urlencoded({ extended: false }));
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
  "INSERT INTO users (name, role, email, password, token) VALUES (?, ?, ?, ?, ?)"
);

const updateStmt = db.prepare(
  "UPDATE users SET name = ?, role = ?, email = ? WHERE id = ?"
);

const hashPassword = (password) => {
  const saltRounds = 6;
  return bcrypt.hashSync(password, saltRounds);
};

const token = crypto.randomUUID();

const findByToken = db.prepare("SELECT * FROM users WHERE token = ?");

function createExampleData() {
  insertStmt.run("Admin", "admin", "admin@test.com", hashPassword("Passord01"), token);
  console.log("Created exampledata successfully");
}

app.get("/json/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.send(users);
});

app.get("/user/admin/edit/:id", (req, res) => {
  res.sendFile(__dirname + "/public/user/admin/edit/id.html");
});

app.get("/user/admin/create", (req, res) => {
  res.sendFile(__dirname + "/public/user/admin/create.html");
});

app.get("/user/medlem/kontaktinfo", (req, res) => {
  res.sendFile(__dirname + "/public/user/medlem/kontaktinfo.html");
});

app.post("/post/slettBruker/:id", (req, res) => {
  const id = req.params.id;
  const deleteStatement = db.prepare("DELETE FROM users WHERE id = ?");
  deleteStatement.run(id);
  res.redirect("/user/admin/edit");
});

app.post("/lagBruker", (req, res) => {
  const { name, email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (user) {
    res.send("User already exists");
    setTimeout(() => {
      res.redirect("/register");
    }, 2000);
  } else {
    const passwordHash = bcrypt.hashSync(password, 6);
    const token = crypto.randomUUID();
    const user = insertStmt.run(name, "medlem", email, passwordHash, token);
    res.redirect(`/user/medlem/`);
  }
});

app.post("/adminCreate", (req, res) => {
  const { name, email, password, role } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (user) {
    res.send("User already exists");
    setTimeout(() => {
      res.redirect("/user/admin/create");
    }, 1000);
  } else {
    const passwordHash = bcrypt.hashSync(password, 6);
    const token = crypto.randomUUID();
    insertStmt.run(name, role, email, passwordHash, token);
    res.redirect(`/user/admin/create`);
  }
});

app.post("/editUser", (req, res) => {
  const id = req.body.id;
  const { name, email, role} = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (name != user.name) {
    const updateStmt = db.prepare("UPDATE users SET name = ? WHERE id = ?");
    updateStmt.run(name, id);
  }

  if (email != user.email) {
    const updateStmt = db.prepare("UPDATE users SET email = ? WHERE id = ?");
    updateStmt.run(email, id);
  }

  if (role != user.role) {
    if (role != "velg") {
      const updateStmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
      updateStmt.run(role, id);
    }
  }

  res.redirect("/user/admin/edit");
});

// login works
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) {
    res.status(401).send("Wrong email or password");
    return;
  }

  const compare = bcrypt.compareSync(password, user.password);

  if (compare) {
    req.session.user = user;
    res.redirect(`/user/${user.role}`);
  } else {
    res.status(401).send("Wrong email or password");
  }
});

app.use("/", express.static(path.join(__dirname, "public")));

app.listen(3000, () => {
  console.log(`Click link http://localhost:3000`);
});
