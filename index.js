const express = require('express');
const morgan = require('morgan');
const app = express();
const cors =require('cors')

app.use(morgan('tiny'))
app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

morgan.token('person', (req, res) => {
  const body = req.body;
  return JSON.stringify({ name: body.name, number: body.number });
});



const morganForPersons = morgan(':method :url :status :res[content-length] - :response-time ms - :person');

let persons = [
  { 
    "id": 1,
    "name": "Arto Hellas", 
    "number": "040-123456"
  },
  { 
    "id": 2,
    "name": "Ada Lovelace", 
    "number": "39-44-5323523"
  },
  { 
    "id": 3,
    "name": "Dan Abramov", 
    "number": "12-43-234345"
  },
  { 
    "id": 4,
    "name": "Mary Poppendieck", 
    "number": "39-23-6423122"
  }
]

const generateID = () => {
  const minID = 5;
  const maxID = 100;
  return Math.floor(Math.random() * (maxID - minID + 1)) + minID;
}

app.get('/api/persons', (request, response) => {
  response.json(persons);
})

app.post('/api/persons', morganForPersons, (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'A name or a number is missing!',
    });
  }

  const person = {
    id: generateID(),
    name: body.name,
    number: body.number,
  };

  const checkName = persons.find((p) => p.name.toLowerCase() === person.name.toLowerCase());

  if (checkName) {
    return response.status(400).json({
      error: 'The name already exists in the phonebook!',
    });
  }

  persons = persons.concat(person);
  response.json(person);
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`)
})
