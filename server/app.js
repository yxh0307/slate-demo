
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express()

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let data = [{ children: [{ text: '' }] }]

app.get('/getData', (req, res) => {
  res.send(data)
})

app.post('/sendData', (req, res) => {
  data = req.body
  res.send({ success: true })
})

app.listen(8080, () => console.log('http://localhost:8080/'))