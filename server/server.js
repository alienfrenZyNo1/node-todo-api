require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
	var todo = new Todo({
		text: req.body.text
	});

	todo.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});


app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({todos});
	}).catch((e) => {
		res.status(400).send(e);
	});
});

//GET /todos/2124235

//404 - send back an empty send

	//findById
		//success
			//if todo - send it back
			//if no todo - send back 404 with empty body
		//error
			//400 - and send empty body back

app.get('/todos/:id', (req, res) => {
	var id = req.params.id;
//validate id using isValid

if (!ObjectID.isValid(id)) {
	return res.status(404).send();
}

	Todo.findById(id).then((todo) => {
		if (!todo) {
			return res.status(404).send();
		}
			res.send({todo});
	}).catch((e) => {
		res.status(400).send();
	});
});

app.delete('/todos/:id', (req, res) => {
	// get the id
	var id = req.params.id;

	// validate the id -> not valid? Return a 404
	if (!ObjectID.isValid(id)) {
	return res.status(404).send();
}
	//Remove todo by id
		//success
			//if no doc, send 404
			//if doc, send doc back with a 200
	Todo.findByIdAndRemove(id).then((todo) => {
	if (!todo) {
			return res.status(404).send();
		}
			res.send({todo});
	}).catch((e) => {
		//error
		//400 with empty body
		res.status(400).send();
	});
});

app.patch('/todos/:id', (req, res) => {
	var id = req.params.id;
	//Choose what can be updated
	var body = _.pick(req.body, ['text', 'completed']);

	if (!ObjectID.isValid(id)) {
	return res.status(404).send();
	}

	if (_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	}else {
		body.completed = false;
		body.completedAt = null;
	}

	Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
		if(!todo) {
			return res.status(404).send();
		}

		res.send({todo});
	}).catch((e) => {
		res.status(400).send();
	});
});

// POST /users

app.post('/users', (req, res) => {
	var body = _.pick(req.body, ['email', 'password']);
	var user = new User(body);


	user.save().then(() => {
		return user.generateAuthToken();
	}).then((token) => {
		res.header('x-auth', token).send(user);
	}).catch((e) => {
		res.status(400).send(e);
	});
});


app.get('/users/me', authenticate, (req, res) => {
	res.send(req.user);
});

app.listen(port, () => {
	console.log(`Started up at port ${port}`);
});

module.exports = {app};