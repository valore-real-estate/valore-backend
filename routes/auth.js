const express = require('express')
const router = express.Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true, token: 'valore_authenticated' })
  }

  return res.status(401).json({ message: 'Invalid credentials' })
})

module.exports = router