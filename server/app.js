
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const diff = require('./diff')
const getUser = require('./getUser')

const app = express()

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let data = [{ children: [{ text: '' }] }]

// 等待队列
const pendingDiffQueue = []

let lock = false

app.post('/login', (req, res) => {
  const {name, id} = getUser()
  res.send({id, name})
})

app.get('/getData', (req, res) => {
  res.send(data)
})

app.post('/sendData', (req, res) => {
  const {body} = req
  if (!body) {
    return res.send({ success: false })
  }
  pendingDiffQueue.push(body)
  if (!lock) {
    lock = true
    while(pendingDiffQueue.length > 0) {
      data = diff(data, pendingDiffQueue.shift())
    }
    res.send({ success: true, data })
    lock = false
  }
  
})

app.listen(8080, () => console.log('http://localhost:8080/'))