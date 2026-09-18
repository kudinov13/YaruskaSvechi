import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db.js'
import { signToken, authRequired } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  phone: z.string().optional(),
})

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body)
    const exists = await prisma.user.findUnique({ where: { email: data.email } })
    if (exists) return res.status(409).json({ error: 'Email уже зарегистрирован' })
    const hash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: { ...data, password: hash, role: 'USER' },
      select: { id: true, email: true, name: true, role: true, phone: true },
    })
    const token = signToken(user)
    res.json({ token, user })
  } catch (e) {
    next(e)
  }
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' })
    const ok = await bcrypt.compare(data.password, user.password)
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' })
    const safe = { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone }
    const token = signToken(safe)
    res.json({ token, user: safe })
  } catch (e) {
    next(e)
  }
})

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, phone: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ error: 'Не найден' })
    res.json({ user })
  } catch (e) {
    next(e)
  }
})

export default router
