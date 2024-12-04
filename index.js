const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose = require('mongoose')
const { Schema } = mongoose;
mongoose.connect(process.env.DB_URL);


const userSchema = new Schema({
  username: String,
})

const User = mongoose.model('User', userSchema)


const exerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.use(cors())
app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }));

app.post('/api/users', async (req, res) => {
  const userObject = new User({username: req.body.username})
  try {
    const user = await userObject.save()
    res.json(user)
  } catch (error) {
    res.json({error: error.message})
  } 
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const {description, duration, date} = req.body
  const id = req.params._id 
  try {
    const user = await User.findById(id)
    if(!user){
      res.send('could not find user');
    } else {
      const exerciseObject = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      })
      const exercise = await exerciseObject.save()
      res.json({
        _id: id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString() 
      })
    }
  } catch (error) {
    res.json({error: error.message})
  }
})

app.get('/api/users/', async (req, res) => {
  const users = await User.find({}).select('_id username')
  if (users) {
    res.json(users)
  } else {
    res.send("no users found")
  } 
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} = req.query
  const id = req.params._id

  const user = await User.findById(id)
  if (!user) {
    res.send('could not find user')
  } else {
    let dateObject = {}
    if (from) {
      dateObject.$gte = new Date(from);
    }
    
    if (to) {
      dateObject.$lte = new Date(to);
    }

    let filter = {user_id: id}
    
    if (from || to) {
      filter.date = dateObject
    }

    const exercises = await Exercise.find(filter).limit(parseInt(limit) ?? 500)
    const log =  exercises.map(e => ({
      description: e.description, 
      duration: e.duration,
      date: e.date ? e.date.toDateString() : 'invalid'  
    }))

    res.json({
      _id: id,
      username: user.username,
      count: exercises.length,
      _id: user.id,
      log
    })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
