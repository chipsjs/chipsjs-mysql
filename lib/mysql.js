const mysql = require('mysql');
const Joi = require('joi');

const Utils = require('./utils');

class Mysql {
  constructor({
    host = '127.0.0.1', port = 3306, user = 'root', password = '', charset = 'utf8', database = 'test', date_string = 'true', connection_limit_num = 10,
  }, user_log_module = console) {
    this._host = host;
    this._port = port;
    this._user = user;
    this._password = password;
    this._charset = charset;
    this._database = database;
    this._date_string = date_string;
    // Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings
    // rather than inflated into JavaScript Date objects.
    // Can be true/false or an array of type names to keep as strings. (Default: false)
    this._connection_limit_num = connection_limit_num;

    if (typeof user_log_module === 'object' && typeof user_log_module.info === 'function' && typeof user_log_module.debug === 'function' && typeof user_log_module.error === 'function') {
      this._log = user_log_module;
    } else {
      this._log.error('this log module introduced has no info/debug/error function');
    }

    this._init();
  }

  static generateSql({ table, equal_condition = {}, like_condition = {} }, data_param_arr) {
    Utils.checkType(Joi.string(), table);

    const sql = `select ${Utils.packageDataParam(data_param_arr)} from \`${table}\` ${Utils.packageCondition(equal_condition, like_condition)}`;
    return sql;
  }

  static generateCountSql({ table, equal_condition = {}, like_condition = {} }) {
    Utils.checkType(Joi.string(), table);

    const sql = `select count(*) from \`${table}\` ${Utils.packageCondition(equal_condition, like_condition)} `;
    return sql;
  }

  _init() {
    this._pool = mysql.createPool({
      port: this._port,
      host: this._host,
      user: this._user,
      password: this._password,
      charset: this._charset,
      database: this._database,
      dateStrings: this._date_string,
      connectionLimit: this._connection_limit_num,
    });

    this._log.info('mysql: connect mysql...');
    this._pool.on('connection', (connection) => {
      this._log.info('mysql: connect mysql success!!!');
      connection.query('SET SESSION auto_increment_increment=1')
    });
    this._pool.on('error', (err) => {
      this._log.error(`mysql: ${err}`);
    });
  }

  async _query({ sql, values = [] }) {
    Utils.checkType(Joi.string(), sql);
    Utils.checkType(Joi.array().items(Joi.string()), values);

    this._log.debug(`sql is ${sql}, values is ${values}`);

    return new Promise((resolve, reject) => {
      this._pool.getConnection(async (err1, connection) => {
        if (err1) {
          return reject(err1);
        }

        connection.query({
          sql,
          values,
          // timeout: 40000
        }, (err2, rows) => {
          if (err2) {
            return reject(err2);
          }

          connection.release();
          return resolve(rows);
        })
      })
    })
  }

  async createTable(table, schema, options) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object().min(1), schema);
    Utils.checkType(Joi.object().keys({
      engine: Joi.string().optional(),
      comment: Joi.string().optional(),
    }), options);

    let schema_str = '';
    Object.entries(schema).forEach(([key, value]) => {
      schema_str = `${schema_str} \`${key}\` ${value},`
    });
    schema_str = schema_str.substring(0, schema_str.length - 1);

    const { engine = 'InnoDB', comment = '' } = options;
    const sql = `create table \`${table}\` (${schema_str}) engine=${engine} comment='${comment}'`;
    const result = await this._query({ sql });
    return result;
  }

  async dropTable(table) {
    Utils.checkType(Joi.string(), table);

    const sql = `drop table if exists \`${table}\``;
    const result = await this._query({ sql });
    return result;
  }

  async _returnRowsCount(sql, values) {
    const rows = await this._query({ sql, values });
    return rows[0]['count(*)'];
  }

  async commonExcute(sql, values) {
    const rows = await this._query({ sql, values });
    return rows;
  }

  async getCount({ table, equal_condition = {}, like_condition = {} }) {
    Utils.checkType(Joi.string(), table);

    const sql = Mysql.generateCountSql({ table, equal_condition, like_condition });
    const count = await this._returnRowsCount(sql);
    return count;
  }

  async getCountWithSql(sql) {
    this._log.debug(`Mysql.awaitGetCountWithSql:sql_str is ${sql}`);

    const count = await this._returnRowsCount(sql);
    return count;
  }

  async selectDB(table, {
    equal_condition,
    like_condition,
    data_param_arr,
    desc_param_str,
    page,
  }) {
    Utils.checkType(Joi.string(), table);

    let sql = `select ${Utils.packageDataParam(data_param_arr)} from \`${table}\` ${Utils.packageCondition(equal_condition, like_condition)}`;

    if (typeof (desc_param_str) === 'string' && desc_param_str.length !== 0) {
      sql += ` order by ${desc_param_str} desc`;
    }
    if (typeof page === 'object' && typeof page.start_index === 'number' && typeof page.page_size === 'number') {
      sql += ` limit ${page.start_index}, ${page.page_size}`;
    }

    const rows = await this._query({ sql });
    return rows;
  }

  /**
   *
   *
   * @param {string} table - table name
   * @param {{string, string}} options - {equal_condition, set}
   * @returns  {object} - {affectedRows, changedRows}
   * changedRows does not count updated rows whose values were not changed.
   * @memberof Mysql
   */
  async updateDB(table, options) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object({
      equal_condition: Joi.object().min(1),
      set: Joi.object().min(1),
    }))

    const { equal_condition, set } = options;

    let sql = `UPDATE \`${table}\` SET `;
    Object.entries(set).forEach(([key, value]) => {
      sql = `${key}=${mysql.escape(value)},`;
    })
    sql = `${sql.substr(0, sql.length - 1)}`;

    sql += Utils.packageCondition({ equal_condition });

    const result = await this._query({ sql });
    return result;
  }

  async insertDB(table, insert_data, is_ignore) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object().min(1), insert_data);

    const { insert_key, insert_value } = Utils.packageInsertData(insert_data);

    let sql = '';
    if (typeof (is_ignore) === 'boolean' && is_ignore === true) {
      sql = `INSERT IGNORE INTO \`${table}\` (${insert_key}) VALUES (${insert_value})`;
    } else {
      sql = `INSERT INTO \`${table}\` (${insert_key}) VALUES (${insert_value})`;
    }

    const result = await this._query({ sql });
    return result;
  }

  async insertAndGetID(table, insert_data) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object().min(1), insert_data);

    const { insert_key, insert_value } = Utils.packageInsertData(insert_data);

    const sql = `INSERT INTO \`${table}\` (${insert_key}) VALUES (${insert_value})`;
    const result = await this._query({ sql });
    return result.insertId;
  }

  async insertOrUpdateByUniqueKey(table, primary_key, set) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object().min(1), primary_key);
    Utils.checkType(Joi.object().min(1), set);

    const { insert_key, insert_value } = Utils.packageInsertData(primary_key);
    const { insert_key: insert_key_2, insert_value: insert_value_2 } = Utils.packageInsertData(set);
    const update_sub_sql = Utils.packageEqualCondition(set);

    const sql = `INSERT INTO \`${table}\` ${insert_key}, ${insert_key_2} VALUES ${insert_value}, ${insert_value_2} ON DUPLICATE KEY UPDATE ${update_sub_sql}`;
    const result = await this._query({ sql });
    return result;
  }

  async deleteDB(table, equal_condition) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object().min(1), equal_condition);

    const sql = `DELETE FROM \`${table}\` where ${Utils.packageEqualCondition(equal_condition)}`;
    const result = await this._query({ sql });
    return result;
  }

  async replaceDB(table, condition) {
    Utils.checkType(Joi.string(), table);
    Utils.checkType(Joi.object().min(1), condition);

    const { insert_key, insert_value } = Utils.packageInsertData(condition);

    const sql = `REPLACE INTO \`${table}\` (${insert_key}) VALUES (${insert_value})`;
    const result = await this._query({ sql });
    return result;
  }
}

module.exports = Mysql;
