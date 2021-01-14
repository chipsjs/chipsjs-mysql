const config = require('./config.json')
const Mysql = require('../index');

let instance;

const createInstance = () => {
  if (!instance) {
    instance = new Mysql({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
  }

  return instance;
};

const Table = {
  select: 'select',
  insert: 'insert',
}

module.exports.testTable = Table;
module.exports.insertSetup = async () => {
  const client = createInstance();
  await client.dropTable(Table.insert);
  await client.createTable(Table.insert, {
    c1: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',
    c2: 'varchar(100)',
    c3: 'INT NOT NULL',
  }, {
    comment: 'test',
  });
  return client;
};

module.exports.selectSetup = async () => {
  const client = createInstance();
  await client.createTable(Table.select, {
    c1: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',
    c2: 'varchar(100)',
  }, {
    comment: 'test',
  });
  return client;
};
