const express = require("express");
const db = require("better-sqlite3")("database.db", { verbose: console.log });
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
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
  "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
);

app.post("/lagBruker", (req, res) => {
  const { name, email, password, role } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (user) {
    res.send("User already exists");
    setTimeout(() => {
      res.redirect("/register");
    }, 2000);
  } else {
    const hash = bcrypt.hashSync(password, 6);
    const user = insertStmt.run(name, email, hash, "medlem");
    const medlem = user.role;
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
    const hash = bcrypt.hashSync(password, 6);
    insertStmt.run(name, email, hash, role);
    res.send("User created");
  }
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
