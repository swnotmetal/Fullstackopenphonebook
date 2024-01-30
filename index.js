require('dotenv').config()
const express = require('express');
const morgan = require('morgan');
const app = express();
const cors =require('cors')
const Person = require('./models/person')


app.use(morgan('tiny'))
app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

morgan.token('person', (req, res) => {
  const body = req.body;
  return JSON.stringify({ name: body.name, number: body.number });
});

const morganForPersons = morgan(':method :url :status :res[content-length] - :response-time ms - :person');


/*const generateID = () => {
  const minID = 5;
  const maxID = 100;
  return Math.floor(Math.random() * (maxID - minID + 1)) + minID;
}*/

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => response.json(persons))
    .catch(next); 
})
// note to self: each route seems perform once independently, do not try to merge them.
app.get('/api/persons/:id', (request, response, next) => {

	Person.findById(request.params.id)
		  .then(person => {
			      if(person){
				    response.json(person)
			    }else{
				    response.status(404).end()
			    }
		    })
		  .catch(error => next(error))
})
//discord server suggested countDocuments()
app.get('/info', (request, response, next) => {
  Person.countDocuments({})
    .then(numOfPeople => {
      const date = new Date();
      response.send(`
        <p>Phonebook has info for ${numOfPeople} people</p>
        <br />
        <p>${date}</p>
      `)
    })
    .catch(error => next(error));
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', morganForPersons, (request, response, next) => {
  const body = request.body

  if (body.name === undefined || body.number === undefined) {
    return response.status(400).json({
      error: 'A name or a number is missing!',
    })
  }

  Person.findOne({ name: body.name }).then(existingPerson => {
    if (existingPerson) {
      return response.status(400).json({
        error: 'The name already exists in the phonebook!',
      })
    }

    const person = new Person({
      name: body.name,
      number: body.number,
    })

    person.save().then(savedContact => {
      response.json(savedContact);
    }).catch(error => next(error));  
  }).catch(error => next(error));  
})

app.put('/api/persons/:id', morganForPersons, (request, response, next) => {
  const { id } = request.params;
  const { name, number } = request.body;

  Person.findByIdAndUpdate(id, { name, number }, { new: true })
    .then(updatedPerson => {
      if (!updatedPerson) {
        return response.status(404).json({ error: 'Person not found in Phonebook' });
      }
      response.json(updatedPerson);
    })
    .catch(error => next(error));
})


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'Unknown endpoint' });
};

app.use(unknownEndpoint)


const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if(error.name === 'CastError') {
    return res.status(400).send({error: 'malformatted id'})
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({error: error.message})
  }
  next(error)
}

app.use(errorHandler)
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`)
})
