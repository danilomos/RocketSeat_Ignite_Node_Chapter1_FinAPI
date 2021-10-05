const express = require("express");
const { v4: uuidv4 } = require("uuid");
const PORT = 3333;

const app = express();

const customers = [];

app.use(express.json())

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);
    if (customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists." });
    }

    customers.push({ id: uuidv4(), cpf, name, statements: [] });
    console.log(customers);
    return res.status(201).send();
});

app.listen(PORT);