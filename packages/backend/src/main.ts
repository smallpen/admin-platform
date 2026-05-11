import 'dotenv/config'
import { buildApp } from './app.js'
import { config } from './config.js'

const start = async () => {
  const app = await buildApp()
  try {
    await app.listen({ port: config.BACKEND_PORT, host: config.BACKEND_HOST })
    console.log(`🚀 Backend running at http://${config.BACKEND_HOST}:${config.BACKEND_PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
