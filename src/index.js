const express = require("express");
const { v4: uuidv4 } = require("uuid");
const PORT = 3333;

const app = express();

const customers = [];

function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "Customer not found." });
    }

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

app.use(express.json())

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);
    if (customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists." });
    }

    customers.push({ id: uuidv4(), cpf, name, statement: [] });
    return res.sendStatus(201);
});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body;

    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return res.sendStatus(201);
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);
    if (balance < amount) {
        return res.status(400).json({ error: "Insufficient funds." });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return res.sendStatus(201);

});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return res.json(statement);
});

app.patch("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { name } = req.body;

    customer.name = name;

    return res.sendStatus(201);
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);
});


app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    const customerIndex = customers.findIndex((_customer) => _customer.cpf === customer.cpf);

    customers.splice(customerIndex, 1);

    return res.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.json(balance);
});

app.listen(PORT);