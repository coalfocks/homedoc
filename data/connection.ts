import { Database, PostgresConnector } from '../deps.ts'
import { config } from '../deps.ts'

export default () => {
  const connector = new PostgresConnector({
    database: config().DATABASE,
    host: config().DB_HOST,
    username: config().DB_USERNAME,
    password: config().DB_PASSWORD,
    port: +config().DB_PORT,
  })

  return new Database(connector)
}
