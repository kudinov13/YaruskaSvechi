import dotenv from 'dotenv'
import { ProxyAgent } from 'undici'
dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN
const proxy = process.env.TELEGRAM_PROXY
const dispatcher = proxy ? new ProxyAgent(proxy) : undefined

const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`, { dispatcher })).json()
console.log('bot:', me.result?.username, me.result?.id)

const upd = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { dispatcher })).json()
const seen = new Map()
for (const u of upd.result || []) {
  const chat = u.message?.chat || u.my_chat_member?.chat
  if (chat) seen.set(chat.id, { type: chat.type, username: chat.username, first: chat.first_name, title: chat.title })
}
for (const [id, info] of seen) console.log('chat:', id, JSON.stringify(info))
