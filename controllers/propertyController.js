const Property = require('../models/Property')
const cloudinary = require('../config/cloudinary')

const bilingualFields = ['title', 'address', 'description', 'district', 'city']

const parseFields = (data) => {
  for (const field of bilingualFields) {
    if (data[field] && typeof data[field] === 'string') {
      try { data[field] = JSON.parse(data[field]) } catch {}
    }
  }
  return data
}

// GET ALL — with filtering
const getProperties = async (req, res) => {
  try {
    const filter = {}
    const andClauses = [] // collect $or groups here, merge with $and at the end

    const {
      type,
      minPrice, maxPrice,
      minArea, maxArea,
      rooms, bedrooms,
      floor, minFloors, maxFloors,
      condition, renovation, buildingAge,
      isAgricultural,
      city, district,
      search,
    } = req.query

    // Enum / exact match
    if (type)        filter.type = type
    if (condition)   filter.condition = condition
    if (renovation)  filter.renovation = renovation
    if (buildingAge) filter.buildingAge = buildingAge
    if (rooms)       filter.rooms = Number(rooms)
    if (bedrooms)    filter.bedrooms = Number(bedrooms)
    if (floor)       filter.floor = Number(floor)

    // isAgricultural — only apply if explicitly 'true' or 'false'
    if (isAgricultural === 'true' || isAgricultural === 'false') {
      filter.isAgricultural = isAgricultural === 'true'
    }

    // Numeric ranges
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (minArea || maxArea) {
      filter.area = {}
      if (minArea) filter.area.$gte = Number(minArea)
      if (maxArea) filter.area.$lte = Number(maxArea)
    }
    if (minFloors || maxFloors) {
      filter.floors = {}
      if (minFloors) filter.floors.$gte = Number(minFloors)
      if (maxFloors) filter.floors.$lte = Number(maxFloors)
    }

    // Bilingual text fields — each becomes its own $or clause
    if (city) {
      andClauses.push({ $or: [
        { 'city.geo': { $regex: city, $options: 'i' } },
        { 'city.eng': { $regex: city, $options: 'i' } },
      ]})
    }
    if (district) {
      andClauses.push({ $or: [
        { 'district.geo': { $regex: district, $options: 'i' } },
        { 'district.eng': { $regex: district, $options: 'i' } },
      ]})
    }
    if (search) {
      const re = { $regex: search, $options: 'i' }
      andClauses.push({ $or: [
        { 'title.geo': re },    { 'title.eng': re },
        { 'address.geo': re },  { 'address.eng': re },
        { 'description.geo': re }, { 'description.eng': re },
      ]})
    }

    // Merge all $or groups — if more than one they must ALL match
    if (andClauses.length === 1) {
      filter.$or = andClauses[0].$or
    } else if (andClauses.length > 1) {
      filter.$and = andClauses
    }

    // Sorting
    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_asc:  { price:      1 },
      price_desc: { price:     -1 },
      area_asc:   { area:       1 },
      area_desc:  { area:      -1 },
    }
    const sort = sortMap[req.query.sort] ?? { createdAt: -1 }

    // Pagination
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(100, Number(req.query.limit) || 20)
    const skip  = (page - 1) * limit

    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sort).skip(skip).limit(limit),
      Property.countDocuments(filter),
    ])

    res.json({
      data: properties,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
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
    const data = parseFields({ ...req.body })

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

    const data = parseFields({ ...req.body })

    if (req.files?.mainPhoto?.[0]) {
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