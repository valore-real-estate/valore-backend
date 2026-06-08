const Property = require('../models/Property')
const cloudinary = require('../config/cloudinary')

// GET ALL
const getProperties = async (req, res) => {
  try {
    const filter = {}
    if (req.query.type) filter.type = req.query.type
    const properties = await Property.find(filter).sort({ createdAt: -1 })
    res.json(properties)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET ONE
const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
    if (!property) return res.status(404).json({ message: 'Not found' })
    res.json(property)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// CREATE
const createProperty = async (req, res) => {
  try {
    const data = { ...req.body }

    if (!req.files?.mainPhoto?.[0]) {
      return res.status(400).json({ message: 'Main photo is required' })
    }

    data.mainPhoto = req.files.mainPhoto[0].path

    if (req.files?.photos) {
      data.photos = req.files.photos.map(f => f.path)
    }

    const property = new Property(data)
    await property.save()
    res.status(201).json(property)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// UPDATE
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
    if (!property) return res.status(404).json({ message: 'Not found' })

    const data = { ...req.body }

    if (req.files?.mainPhoto?.[0]) {
      // წაშალე ძველი mainPhoto cloudinary-დან
      const publicId = property.mainPhoto.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`valore/${publicId}`)
      data.mainPhoto = req.files.mainPhoto[0].path
    }

    if (req.files?.photos) {
      data.photos = [
        ...property.photos,
        ...req.files.photos.map(f => f.path),
      ]
    }

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    )
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
    if (!property) return res.status(404).json({ message: 'Not found' })

    // წაშალე ყველა ფოტო cloudinary-დან
    const allPhotos = [property.mainPhoto, ...property.photos]
    for (const url of allPhotos) {
      const publicId = url.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`valore/${publicId}`)
    }

    await property.deleteOne()
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE ONE PHOTO
const deletePhoto = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
    if (!property) return res.status(404).json({ message: 'Not found' })

    const { url } = req.body
    const publicId = url.split('/').pop().split('.')[0]
    await cloudinary.uploader.destroy(`valore/${publicId}`)

    property.photos = property.photos.filter(p => p !== url)
    await property.save()

    res.json(property)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  deletePhoto,
}