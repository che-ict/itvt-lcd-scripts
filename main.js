const { parse } = require("csv");
const fs = require("fs");
const path = require("path");

if (process.env.TOKEN && process.env.LIFETIME_URL) {
  throw new Error("Define .env file with `TOKEN` and `LIFETIME_URL`");
}

const token =
  process.env.TOKEN || "";

const filePath = path.join(__dirname, "users.csv");

const results = [];

fs.createReadStream(filePath)
  .pipe(parse({ delimiter: ";", from_line: 2 }))
  .on("data", async ([number, name, email]) => {
    const password =
      number + email.substring(0, 1).toUpperCase() + email.substring(1, 6);
    
    results.push({
      number,
      name,
      email,
      password,
    });
  })
  .on("end", async () => {
    console.log("CSV-bestand succesvol ingelezen en verwerkt. Start aanmaken gebruikers.");
    console.log(results);

    for (const item of results) {
      await createUser(item.name, item.email, item.password);
    }
  })
  .on("error", (error) => {
    console.error("Fout bij het lezen van het bestand:", error);
  });

const createUser = async (name, email, password) => {
  const result = await fetch(
    `${process.env.LIFETIME_URL}/lifetimeapi/rest/v2/users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Username: email,
        Name: name,
        Email: email,
        IsActive: true,
        RoleKey: "cc379379-9ac8-4ff1-aead-3bf83ac65acc",
        RoleName: "Student",
        Password: password,
      }),
    }
  ).then((result) => result.json())
  .then(async (jsonResult) => {
    await fetch(
        `${process.env.LIFETIME_URL}/lifetimeapi/rest/v2/users/${jsonResult.Key}/setpassword/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Password: password,
          }),
        }
      )
  })
  return result;
};
