const Joi = require('joi');
const mysql = require('mysql');

const { ERROR_MSG, MysqlError } = require('./error');

class Utils {
  static async checkType(schema, data) {
    try {
      await schema.validateAsync(data);
    } catch (error) {
      throw new MysqlError(ERROR_MSG.param_type_error);
    }
  }

  /**
   *
   *
   * @param {object} equal_condition -
   * @returns {string} - sql
   */
  static packageEqualCondition(equal_condition) {
    Utils.checkType(Joi.object(), equal_condition);

    let sql = '';
    Object.entries(equal_condition).forEach(([key, value]) => {
      const type = typeof (value);
      if (type === 'string' || type === 'number') {
        sql += `\`${key}\` = ${mysql.escape(value)} and `;
      } else {
        throw new MysqlError(ERROR_MSG.mysql_condition_error);
      }
    });

    return sql.substring(0, sql.length - 5);
  }

  /**
   *
   *
   * @param {object} like_condition -
   * @returns {string} - sql
   */
  static packageLikeCondition(like_condition) {
    Utils.checkType(Joi.object(), like_condition);

    let sql = '';

    Object.entries(like_condition).forEach(([key, value]) => {
      if (typeof (value) !== 'string') {
        throw new MysqlError(ERROR_MSG.mysql_condition_error);
      }

      const temp_sub_sql = `%${value.replace(/\\/g, '\\\\')}%`;
      sql += `\`${key}\` like ${mysql.escape(temp_sub_sql)} and `;
    });

    return sql.substring(0, sql.length - 5);
  }

  static packageCondition(equal_condition = {}, like_condition = {}) {
    let sql = ` where ${Utils.packageEqualCondition(equal_condition)}`;

    const equal_length = Object.keys(equal_condition).length;
    const like_length = Object.keys(like_condition).length;
    if (equal_length && like_length) {
      sql += ' and '
    } else if (!(equal_length || like_length)) {
      return ' where 1=1';
    }

    sql += Utils.packageLikeCondition(like_condition);
    return sql;
  }

  /**
   *
   *
   * @param {string[]} [data_param_arr=[]] -
   * @returns {string} - sql
   */
  static packageDataParam(data_param_arr = []) {
    Utils.checkType(Joi.array(), data_param_arr);

    if (data_param_arr.length === 0) {
      return ' * ';
    }

    const sql = data_param_arr.join(',');
    return sql.substring(0, sql.length - 1);
  }

  static packageInsertData(condition) {
    let insert_key = '';
    let insert_value = '';
    Object.entries(condition).forEach(([key, value]) => {
      if (typeof (value) === 'string' || typeof (value) === 'number') {
        insert_key += `\`${key}\`,`;
        insert_value += `${mysql.escape(value)},`;
      } else {
        throw new MysqlError(ERROR_MSG.mysql_condition_error);
      }
    })
    insert_key = insert_key.substring(0, insert_key.length - 1);
    insert_value = insert_value.substring(0, insert_value.length - 1);
    return { insert_key, insert_value };
  }
}

module.exports = Utils;
