const express = require('express')
const http = require('http')

const logs = require('./models/logs')
const socket = require('./models/socket')
const hearbeat = require('./models/heartbeat')
const mongodb = require('./models/database')

const app = express()

mongodb.connect('mongodb://localhost:27017/dokusho')

const server = http.createServer(app)

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html')
}).get('/scripts/controller.js', (req, res) => {
	res.sendFile(__dirname + '/public/scripts/controller.js')
})

socket.wait(server)

hearbeat.start(socket.io)

server.listen(3000)