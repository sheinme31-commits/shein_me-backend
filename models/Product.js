const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Bébé', 'Enfants', 'Femme', 'Homme', 'Lingerie', 'Accessoires'],
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    images: [{ type: String }],
    sizes: [
      {
        size: { type: String, required: true },
        stock: { type: Number, required: true, min: 0, default: 0 },
      },
    ],
    tags: [{
      type: String,
      enum: ['Look bébé printemps', 'Look Femme Casual', 'Idées de cadeaux']
    }],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)