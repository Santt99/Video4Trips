const express = require("express")
const app = express()
const server = require("http").Server(app)
const expressLayouts = require('express-ejs-layouts')

//Variables
const PORT = 80

//EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')

//Routes
app.use('/',require('./routes/index'))

server.listen(PORT,console.log(`Server Listening to PORT ${PORT}`))
