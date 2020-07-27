const express = require('express');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const app = express();

app.use(express.json());
app.use(cors());

const database = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'postgres'
  }
});

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

app.post('/signin', (req, res) => {
	console.log(req.body);
	database.select('email', 'secret').from('login')
		.where('email', '=', req.body.email)
		.then(data => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].secret);
			
			console.log(isValid);
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

app.listen(3001, console.log('server1 is running'));




























