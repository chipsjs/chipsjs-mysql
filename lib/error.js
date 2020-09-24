const ERROR_MSG = {
  mysql_condition_error: 'mysql condition error',
  mysql_no_table: 'mysql no exist table',
  mysql_filter_problem: 'mysql_filter_problem',
  mysql_param_undefined: 'mysql_param_undefined',
  param_type_error: 'mysql_param_type_error',
};

class MysqlError extends Error {
  constructor(message) {
    super(message);
    this.type = 'Mysql_Error';
  }
}

module.exports = { MysqlError, ERROR_MSG };
