const mongoose = require('mongoose')

const bilingualString = (required = false) => ({
  geo: { type: String, required },
  eng: { type: String, required },
})

const PropertySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['apartment', 'house', 'commercial', 'land'],
    required: true,
  },

  // ტექსტური ველები — ქართული + ინგლისური
  address: {
    geo: { type: String, required: true },
    eng: { type: String, required: true },
  },
  description: bilingualString(false),
  title: bilingualString(false),
  district: bilingualString(false),
  city: bilingualString(false),

  // რიცხვითი ველები — ენა არ სჭირდება
  price: { type: Number, required: true },
  area: { type: Number, required: true },

  // ბინა / სახლი / კომერციული
  rooms: { type: Number },
  bedrooms: { type: Number },

  // ბინა
  floor: { type: Number },
  totalFloors: { type: Number },

  // სახლი / კომერციული
  floors: { type: Number },

  // enum ველები — ბექენდზე ინახება, ფრონტი თარგმნის
  buildingAge: {
    type: String,
    enum: ['new', 'old', null],
    default: null,
  },
  renovation: {
    type: String,
    enum: ['new', 'old', null],
    default: null,
  },
  condition: {
    type: String,
    enum: ['black', 'white', 'green', null],
    default: null,
  },

  // ფოტოები
  mainPhoto: { type: String, required: true },
  photos: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
})

// კვ/მ² ფასი ავტომატური
PropertySchema.virtual('pricePerSqm').get(function () {
  if (this.area && this.price) return Math.round(this.price / this.area)
  return null
})

PropertySchema.set('toJSON', { virtuals: true })
PropertySchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Property', PropertySchema)