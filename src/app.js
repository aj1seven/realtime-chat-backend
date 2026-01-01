require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) =>{
    res.send("Real time chat backend is running");
});

module.exports = app;


