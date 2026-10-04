// Тестовая отправка уведомления в Telegram из серверного окружения.
// Запуск на сервере: cd /opt/yaruska-api && node /tmp/test-telegram.mjs
import dotenv from 'dotenv'
import { sendTelegramMessage } from './src/services/telegram.js'

dotenv.config()

for (const key of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID', 'TELEGRAM_PROXY']) {
  const v = process.env[key]
  console.log(key, v && v.trim() ? `SET (${v.trim().length} chars)` : 'EMPTY/MISSING')
}

if (!process.env.SEND_TEST) {
  console.log('Dry-run only. Run with SEND_TEST=1 to actually send.')
  process.exit(0)
}

await sendTelegramMessage('Тест: уведомления о заказах yaruska.ru работают ✓')
console.log('Test message sent')
