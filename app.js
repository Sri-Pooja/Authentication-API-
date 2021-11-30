const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

const dbpath = path.join(__dirname, "userData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBandServer();

//creating a user

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUserQuery = ` SELECT * FROM user WHERE username = '${username}' `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    if (request.body.password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(request.body.password, 10);
      const createUserQuery = `
            INSERT INTO user 
                (username, name, password, gender, location)
            VALUES
                ('${username}','${name}' ,'${hashedPassword}', '${gender}', '${location}')
        `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = ` SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(
      request.body.password,
      dbUser.password
    );
    if (isPasswordCorrect) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password API

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPasword } = request.body;
  const selectUserQuery = ` SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User doesn't exsist");
  } else {
    const isCurrentPasswordCorrect = await bcrypt.compare(
      request.body.oldPassword,
      dbUser.password
    );
    if (isCurrentPasswordCorrect) {
      if (request.body.newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
        const updatePasswordQuery = ` UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}' `;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
