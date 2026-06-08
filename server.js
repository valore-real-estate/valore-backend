const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors({
  origin: '*'
}))
app.use(express.json())

app.use('/api/properties', require('./routes/properties'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))