import { createConnection, Connection } from 'promise-mysql';
import { ConnectionStringParser } from 'connection-string-parser';

const parseConnectionString = (dialect: string, connectionUri: string) => {
  const connectionParser = new ConnectionStringParser({
    scheme: dialect || 'mysql',
    hosts: []
  });
  const connectionStrParams = connectionParser.parse(connectionUri);

  return {
    host: connectionStrParams.hosts[0].host,
    port: connectionStrParams.hosts[0].port || 3306,
    database: connectionStrParams.endpoint,
    user: connectionStrParams.username,
    password: connectionStrParams.password
  };
};

export const getConnection = (connectionUri: string): Promise<Connection> => {
  return createConnection(parseConnectionString('mysql', connectionUri));
};

export const query = async (connection: Connection, queryString: string) => {
  return connection.query(queryString);
};

export const bulkInsert = (
  connection: Connection,
  table: string,
  keys: string[],
  records: Array<string | number>[]
) => {
  const query = 'INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES ?';

  return connection.query(query, [records]);
};
