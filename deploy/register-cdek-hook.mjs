import 'dotenv/config'
import { ensureCdekStatusWebhook } from './src/services/cdek.js'

await ensureCdekStatusWebhook()
console.log('CDEK status webhook configured')
