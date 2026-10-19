import { runAdmin } from './admin'
runAdmin(process.argv.slice(2)).catch(() => {
  console.error('Personal Sync admin command refused; check confirmation, private configuration and state revision.')
  process.exitCode = 1
})
