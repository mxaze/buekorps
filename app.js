const express = require("express");
const db = require("better-sqlite3")("database.db");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { create } = require("domain");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser()); // always use cookieParser or bodyParser

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// inserts a user into the database with the given values
const insertUser = db.prepare(
  `INSERT INTO users (name, email, role, password, phone, adress, birthdate, peletong_id, forelder_id, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
);

const deleteStmt = db.prepare("DELETE FROM users WHERE id = ?");

const findByToken = db.prepare("SELECT * FROM users WHERE token = ?");

// creates a parent in the database with the given values
const createParent = db.prepare( `INSERT INTO forelder (name, email, password, token) VALUES (?, ?, ?, ?);`)

// creates a peletong in the database with the given values
const createPeletong = db.prepare(`INSERT INTO peletong (name) VALUES (?);`)

// updates the peletong_id of a user
const updateMedlemPeletong = db.prepare(`UPDATE users SET peletong_id = ? WHERE id = ?`)
// updates the forelder_id of a user
const updateForelderID = db.prepare(`UPDATE users SET forelder_id = ? WHERE id = ?`)

// removes a user from a peletong by setting their peletong_id to 0
const removeMedlem = db.prepare(`UPDATE users SET peletong_id = 0 WHERE id = ?`)

// deletes a user from the database
const deleteUser = db.prepare("DELETE FROM users WHERE id = ?")


const hashPassword = (password) => {
  const saltRounds = 6;
  return bcrypt.hashSync(password, saltRounds);
};

// Function for creating test data
function createTestData() {
  ("");
  insertUser.run(
    "admin", // name
    "admin@test.com", //email
    "admin", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "1", // peletong_id
    "3", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "leder", // name
    "leder@test.com", // email
    "leder", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "1", // peletong_id
    "0", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "fenrik", // name
    "fenrik@test.com", // email
    "leder", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "2", // peletong_id
    "0", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "forelder", // name
    "forelder@test.com", // email
    "forelder", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "1", // peletong_id
    "3", // forelder_id
    crypto.randomUUID() // token
  );
  createParent.run(
    "forelder", // name
    "forelder@test.com", // email
    hashPassword("Passord01"), // password
    crypto.randomUUID() // token
  );
  insertUser.run(
    "medlem", // name
    "medlem@test.com", // email
    "medlem", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "2", // peletong_id
    "0", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "ulrik", // name
    "ulrik@test.com", // email
    "medlem", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "1", // peletong_id
    "3", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "sigurd", // name
    "sigurd@test.com", // email
    "medlem", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "0", // peletong_id
    "0", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "emil", // name
    "emil@test.com", // email
    "medlem", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "0", // peletong_id
    "0", // forelder_id
    crypto.randomUUID() // token
  );
  insertUser.run(
    "henrik", // name
    "henrik@test.com", // email
    "medlem", // role
    hashPassword("Passord01"), // password
    "", // phone
    "", // adress
    "", // birthdate
    "1", // peletong_id
    "3", // forelder_id
    crypto.randomUUID() // token
  );

  // creates peletong
  createPeletong.run("Peletong 1");
  createPeletong.run("Fenrik skvadron");
}
app.get("/json/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.send(users);
});

app.get("/u/admin/edit", (req, res) => {
  res.sendFile(__dirname + "/public/user/admin/edit/index.html");
});
app.get("/u/admin/edit/:id", (req, res) => {
  res.sendFile(__dirname + "/public/user/admin/edit/id.html");
});

app.get("/u/admin/create", (req, res) => {
  res.sendFile(__dirname + "/public/user/admin/create.html");
});

app.get("/u/admin/", (req, res) => {
  res.sendFile(__dirname + "/public/user/admin/index.html");
});

app.get("/u/leder/", (req, res) => {
  res.sendFile(__dirname + "/public/user/leder/index.html");
});

app.get("/u/medlem/", (req, res) => {
  res.sendFile(__dirname + "/public/user/medlem/index.html");
});

app.get("/u/medlem/kontaktinfo", (req, res) => {
  res.sendFile(__dirname + "/public/user/medlem/kontaktinfo.html");
});

app.get("/u/medlem/peletong", (req, res) => {
  res.sendFile(__dirname + "/public/user/medlem/peletong.html");
});

app.post("/post/slettBruker/:id", (req, res) => {
  const id = req.params.id;
  deleteStmt.run(id);
  res.redirect("/u/admin/edit");
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
    const hashed = hashPassword(password);
    const token = crypto.randomUUID();
    insertUser.run(name, "medlem", email, hashed, token);
    res.redirect(`/u/medlem/`);
  }
});

app.post("/adminCreate", (req, res) => {
  const { name, email, role, password } = req.body; // gets the email and password from the request body
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email); // gets the user from the database
  const token = crypto.randomUUID(); // creates a random token

  if (user) {
    res.status(409).send("Email already exists"); // if the user exists, send a 409 status code
  } else {
    // hash the password
    const hash = bcrypt.hashSync(password, 6);

    // inserts the user into the database
    const insertUser = () => {
      insertUser.run(name, email, role, hash, "", "", "", "1", "0", token);
    };

    //
    switch (role) {
      case "forelder":
        insertUser();
        createParent.run(name, email, hash, token);
        setTimeout(() => {
          res.redirect("/admin/edit/");
        }, 1000);
        break;
      default:
        insertUser();
        setTimeout(() => {
          res.redirect("/admin/edit/");
        }, 1000);
    }
  }
});

app.post("/editUser", (req, res) => {
  const {
    id,
    name,
    email,
    role,
    peletong_id,
    phone,
    adress,
    birthdate,
    forelder_id,
  } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  // checks if the user has changed their name, email, role, peletong_id, phone, adress, birthdate or forelder_id
  if (name != user.name) {
    const updateStmt = db.prepare("UPDATE users SET name = ? WHERE id = ?");
    updateStmt.run(name, id);
  }

  if (email != user.email) {
    const updateStmt = db.prepare("UPDATE users SET email = ? WHERE id = ?");
    updateStmt.run(email, id);
  }

  if (role != user.role) {
    const updateStmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
    updateStmt.run(role, id);
  }

  if (peletong_id != user.peletong_id) {
    updateMedlemPeletong.run(peletong_id, id);
  }

  if (phone != user.phone) {
    const updateStmt = db.prepare("UPDATE users SET phone = ? WHERE id = ?");
    updateStmt.run(phone, id);
  }

  if (birthdate != user.birthdate) {
    const updateStmt = db.prepare(
      "UPDATE users SET birthdate = ? WHERE id = ?"
    );
    updateStmt.run(birthdate, id);
  }

  if (adress != user.adress) {
    const updateStmt = db.prepare("UPDATE users SET adress = ? WHERE id = ?");
    updateStmt.run(adress, id);
  }

  if (forelder_id != user.forelder_id) {
    updateForelderID.run(forelder_id, id);
  }


  res.redirect("/u/admin/edit");
});

// login works
app.post("/login", (req, res) => {
    const { email, password } = req.body; // gets the email and password from the request body
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email)
  
    // if the user does not exist, send a 401 status code
    if (!user) {
      res.status(401).send("Invalid email or password");
      return;
    }
  
    // compares the password from the request body with the password in the database
    const compare = bcrypt.compareSync(password, user.password);
  
    if (compare) {
      res.cookie("token", user.token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });
      // redirects the user to the correct page based on their role
      res.redirect(`/u/${user.role}`)
    } else {
      res.status(401).send("Invalid email or password");
    }
});
  
app.use("/", express.static(path.join(__dirname, "public")));


app.listen(3000, () => {
  console.log(`Click link http://localhost:3000`);
});
