const basicAuth = (req, res, next) => {
  const { username, password } = req.body

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return next()
  }

  return res.status(401).json({ message: 'Unauthorized' })
}

module.exports = basicAuth