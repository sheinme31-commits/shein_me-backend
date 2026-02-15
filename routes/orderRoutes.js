const express = require('express')
const router = express.Router()
const Order = require('../models/Order')
const Product = require('../models/Product')
const { authenticateAdmin } = require('../middleware/auth')

// POST /api/orders — Créer une commande ET décrémenter le stock immédiatement
router.post('/', async (req, res) => {
  try {
    const { customerInfo, items, total } = req.body
    if (!customerInfo || !items || !total) {
      return res.status(400).json({ message: 'Données incomplètes' })
    }

    // Vérifier le stock disponible avant de créer la commande
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product) {
        return res.status(404).json({ message: `Produit introuvable : ${item.name}` })
      }
      const sizeData = product.sizes.find((s) => s.size == item.size)
      if (!sizeData || sizeData.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${item.name} en taille ${item.size}`
        })
      }
    }

    // Décrémenter le stock
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product, 'sizes.size': item.size },
        { $inc: { 'sizes.$.stock': -item.quantity } }
      )
    }

    // Créer la commande
    const order = new Order({ customerInfo, items, total, status: 'en attente' })
    await order.save()
    res.status(201).json(order)

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/orders
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'name brand images')
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// GET /api/orders/:id
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name brand images')
    if (!order) return res.status(404).json({ message: 'Commande introuvable' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

// PUT /api/orders/:id — Mise à jour statut + remise en stock si annulé
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['en attente', 'confirmé', 'en livraison', 'livré', 'retour', 'annulé']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Commande introuvable' })

    const oldStatus = order.status

    // Remettre le stock si on annule
    // (uniquement si la commande n'était pas déjà annulée)
    if (status === 'annulé' && oldStatus !== 'annulé') {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'sizes.size': item.size },
          { $inc: { 'sizes.$.stock': item.quantity } }
        )
      }
    }

    order.status = status
    await order.save()
    res.json(order)

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

module.exports = router