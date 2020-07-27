const express = require('express');
const cors = require('cors');
const Clarifai = require('clarifai');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const app = express();

const database = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'postgres'
  }
});

const capp = new Clarifai.App({
 apiKey: '046f507ba4d34ef8bbf12da92831c088'
});



app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.json('what should I do?');
})

app.post('/register', (req, res) => {

  const {name, email, password} = req.body;
  const hash = bcrypt.hashSync(password);

  database.transaction(trx => {
    trx.insert({
      secret: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
        .returning('*')
        .insert({
          email: loginEmail[0],
          name: name
        })
        .then(user => {
          res.json(user[0]);
        })

    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
})



app.put('/image', (req, res) => {
  const url = req.body.imageUrl;

  capp.models
  .predict(
    Clarifai.FACE_DETECT_MODEL, 
    url)
  .then(data => {
    res.json(data.outputs[0].data.regions[0].region_info.bounding_box)
  })
  .catch(err => console.log)
})

app.post('/signin', (req, res) => {
  database.select('email', 'secret').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].secret);
      
      if (isValid) {
        return database.select('*').from('users')
          .where('email', '=', req.body.email)
          .then(user => {
            res.json(user[0]);
          })
          .catch(err => console.log)
      } else {
        res.json('WRONG EMAIL OR PASSWORD');
      }
    })
    .catch(err => console.log);
})


app.listen(3002);