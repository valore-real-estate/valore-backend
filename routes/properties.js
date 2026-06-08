const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  deletePhoto,
} = require('../controllers/propertyController')

const uploadFields = upload.fields([
  { name: 'mainPhoto', maxCount: 1 },
  { name: 'photos', maxCount: 20 },
])

router.get('/', getProperties)
router.get('/:id', getProperty)
router.post('/', uploadFields, createProperty)
router.put('/:id', uploadFields, updateProperty)
router.delete('/:id', deleteProperty)
router.delete('/:id/photo', deletePhoto)

module.exports = router