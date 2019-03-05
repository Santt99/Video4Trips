const express = require("express")
const app = express()
const server = require("http").Server(app)
const expressLayouts = require('express-ejs-layouts')
const PORT = process.env.PORT || 80 

//EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')

//Routes
app.use('/',require('./routes/index'))
app.use('/upload',require('./routes/upload'))



server.listen(PORT,console.log(`Server Listening to PORT ${PORT}`))
