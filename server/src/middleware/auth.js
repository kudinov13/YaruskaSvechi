import jwt from 'jsonwebtoken'

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' })
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}

export function adminRequired(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Только для администратора' })
  }
  next()
}
