const express = require("express")
const app = express()
const server = require("http").Server(app)
const expressLayouts = require('express-ejs-layouts')
const io = require('socket.io')(server);

//Variables
const PORT = process.env.PORT || 80 

//EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')

//Routes
app.use('/',require('./routes/index'))

// sockets 
io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('media',(data)=>{
        if(data.length > 0){

        }else{
            socket.emit("error")
        }
    })
});

server.listen(PORT,console.log(`Server Listening to PORT ${PORT}`))
