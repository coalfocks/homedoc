//import { Database, PostgresConnector } from 'denodb'
import { Database, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts'
import { config } from 'config'

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
