/**
 * define common mysql's opreate for common component
 *
 * @author chips
 * @date 2018/11/16
 */
'use strict';
const mysql = require('mysql');

//是否加上命名空间更合适一些？
const ERROR_MSG = {
    mysql_condition_error: "mysql condition error",
    mysql_no_table: "mysql不存在table",
    mysql_filter_problem: "mysql_filter_problem",
    mysql_param_undefined: "mysql_param_undefined",
};

class MysqlError extends TypeError {
    constructor (message) {
        super(message);
        this.type = "Mysql_Error";
    }
}

class Mysql {
    constructor() {
    }

    static getInstance() {
        if(!this.instance) {
            this.instance = new Mysql();
        }

        return this.instance;
    }

    async _init() {
        this._pool = mysql.createPool({
            port: this._port,
            host: this._host,
            user: this._user,
            password: this._password,
            charset: this._charset,
            database: this._database,
            dateStrings: this._date_string,
            connectionLimit: this._connection_limit_num
        });

        this._log.info("mysql: connect mysql...");
        this._pool.on('connection', function (connection) {
            this._log.info("mysql: connect mysql success!!!");
            connection.query('SET SESSION auto_increment_increment=1')
        }.bind(this));
        this._pool.on('error', function (err) {
            this._log.error("mysql: " + err);
        }.bind(this));
    }

    async _typeCheck(obj) {
        if(typeof obj !== "object" || typeof obj.table !== "string" || typeof obj.equal_condition !== "object" || typeof obj.like_condition !== "object") {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }
    }

    async init({host = "127.0.0.1", port = 3306, user = "root", password = "", charset = "utf8", database = "test", date_string = "true", connection_limit_num = 10}, user_log_module = console) {
        this._host = host;
        this._port = port;
        this._user = user;
        this._password = password;
        this._charset = charset;
        this._database = database;
        this._date_string = date_string; //Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather than inflated into JavaScript Date objects. Can be true/false or an array of type names to keep as strings. (Default: false)
        this._connection_limit_num = connection_limit_num;

        if(typeof user_log_module === "object" && typeof user_log_module.info === "function" && typeof user_log_module.debug === "function" && typeof user_log_module.error === "function") {
            this._log = user_log_module;
        } else {
            this._log.error("this log module introduced has no info/debug/error function");
        }

        await this._init();
    };

    static escape(sql){
        return mysql.escape(sql);
    };
    async generateSql({table, equal_condition = {}, like_condition = {}}, data_param_arr) {
        this._typeCheck({table, equal_condition, like_condition});

        let sql = "select ";
        if(Array.isArray(data_param_arr) === true) {
            for(let i in data_param_arr)
            {
                sql += data_param_arr[i] + ", "
            }
            sql = sql.substr(0, sql.length - 2);
        } else {
            sql += "* "
        }
        sql += " from " + table;

        if( (Object.keys(equal_condition).length === 0) && (Object.keys(like_condition).length === 0))
        {
            return sql;
        }

        sql += " where ";

        for(let i in equal_condition)
        {
            let type = typeof (equal_condition[i]);
            if (type === "string" || type === "number")
            {
                sql += i + " = " + mysql.escape(equal_condition[i]) + " and ";
            } else{
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }

        for(let i in like_condition)
        {
            if (typeof (like_condition[i]) !== "string")
            {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }

            let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
            sql += i + " like " + mysql.escape(temp_sub_sql) + " and "; //sql
        }

        sql = sql.substr(0, sql.length - 5);

        return sql;
    };
    async generateCountSql({table, equal_condition = {}, like_condition = {}}) {
        this._typeCheck({table, equal_condition, like_condition});

        let sql = "select count(*) from " + table + " where ";

        if((Object.keys(equal_condition).length === 0) && (Object.keys(like_condition).length === 0))
        {
            sql += " 1=1";
        } else
        {
            for(let i in equal_condition)
            {
                let type = typeof (equal_condition[i]);
                if (type === "string" || type === "number")
                {
                    sql += i + " = " + mysql.escape(equal_condition[i]) + " and ";
                } else{
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }

                let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
                sql += i + " like " + mysql.escape(temp_sub_sql) + " and "; //sql
            }

            sql = sql.substr(0, sql.length - 5);
        }


        return sql;
    };

    //values不为空时有where;
    async commonExcute(sql_str, values = []) {
        this._log.debug("Mysql.commonExcute:sql is " + sql_str + ", values is " + values);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    let content = {
                        sql: sql_str
                    };
                    if(Array.isArray(values) && values.length !== 0) content.values = values;

                    connection.query(content,  ( err, rows) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve( rows )
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        });
    }
    async getCount({table, equal_condition = {}, like_condition = {}}) {
        this._typeCheck({table, equal_condition, like_condition});

        let sql = "select count(*) from " + table + " where ";

        if((Object.keys(equal_condition).length === 0) && (Object.keys(like_condition).length === 0))
        {
            sql += " 1=1";
        } else
        {
            for(let i in equal_condition)
            {
                let type = typeof (equal_condition[i]);
                if (type === "string" || type === "number")
                {
                    sql += i + " = " + mysql.escape(equal_condition[i]) + " and ";
                } else{
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }

                let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
                sql += i + " like " + mysql.escape(temp_sub_sql) + " and ";
            }

            sql = sql.substr(0, sql.length - 5);
        }

        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err, rows) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve( rows[0]["count(*)"] )
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    };
    async getCountWithSql(sql_str) {
        this._log.debug("Mysql.awaitGetCountWithSql:sql_str is " + sql_str);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql_str,  ( err, rows) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve( rows[0]["count(*)"] )
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        });
    };

    //need to optimize
    async selectDB(table, equal_condition, like_condition, data_param_arr, desc_param_str, page_obj) { //pid
        if(typeof (table) !== "string")
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let sql = "select ";
        if(typeof(data_param_arr) !== "object" || Object.keys(data_param_arr).length === 0)
        {
            sql += "* "
        } else
        {
            for(let i in data_param_arr)
            {
                sql += data_param_arr[i] + ", "
            }
            sql = sql.substr(0, sql.length - 2);
        }

        sql += " from " + table + " where ";

        if( (typeof(equal_condition) !== "object" || Object.keys(equal_condition).length === 0) && (typeof(like_condition) !== "object"  || Object.keys(like_condition).length === 0))
        {
            sql += " 1=1";
        } else
        {
            for(let i in equal_condition)
            {
                let type = typeof (equal_condition[i]);
                if (type === "string" || type === "number")
                {
                    sql += i + " = " + mysql.escape(equal_condition[i]) + " and ";
                } else{
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }

                let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
                sql += i + " like " + mysql.escape(temp_sub_sql) + " and ";
            }

            sql = sql.substr(0, sql.length - 5);
        }

        if(typeof(desc_param_str) === "string" && desc_param_str.length !== 0)
        {
            sql += " order by " + desc_param_str + " desc";
        }
        if(typeof page_obj === "object" && typeof page_obj.start_index === "number" && typeof page_obj.page_size === "number") {
            sql += " limit " + page_obj.start_index + ", " + page_obj.page_size;
        }

        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err, rows) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve( rows )
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        });
    };
    async updateDB(table, condition , set) {
        if(typeof (table) !== "string" || typeof(condition) !== "object" || typeof(set) !== "object" || Object.keys(set).length === 0)//如果condtion的长度为0则where 1 = 1
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let sql = "UPDATE " + table + " SET ";
        for (let i in set) {
            sql = sql + i + "=" + mysql.escape(set[i]) + ",";
        }
        sql = sql.substr(0, sql.length - 1) + " where ";

        if(Object.keys(condition).length === 0) {
            sql += "1=1";
        } else {
            for (let i in condition) {
                let type = typeof(condition[i]);
                if(type === "string" || type === "number") {
                    sql += i + "=" + mysql.escape(condition[i]) + " and ";
                } else {
                    throw new MysqlError(ERROR_MSG.mysql_condition_error);
                }
            }
            sql = sql.substr(0, sql.length - 5);
        }

        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err, rows ) => {

                        if ( err ) {
                            reject( err )
                        } else {
                            resolve(rows);
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    };
    async insertDB(table, data_object, is_ignore) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        if(typeof(data_object) !== "object" || Object.keys(data_object).length === 0)
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let key = "";
        let value = "";
        for (let i in data_object)
        {
            let type = typeof (data_object[i]);
            if(type === "string" || type === "number")
            {
                key += "`" + i + "`,";
                value +=  mysql.escape(data_object[i]) + ",";
            } else {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }

        key = key.substr(0, key.length - 1);
        value = value.substr(0, value.length - 1);

        let sql = "";
        if(typeof (is_ignore) === "boolean" && is_ignore === true) {
            sql = "INSERT IGNORE INTO " + table + " (" + key + ") VALUES (" + value + ")";
        } else {
            sql = "INSERT INTO " + table + " (" + key + ") VALUES (" + value + ")";
        }

        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err ) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve();
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    };
    async insertAndGetID(table, data_object) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        if(typeof(data_object) !== "object" || Object.keys(data_object).length === 0)
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let key = "";
        let value = "";
        for (let i in data_object)
        {
            let type = typeof (data_object[i]);
            if(type === "string" || type === "number")
            {
                key += "`" + i + "`,";
                value +=  mysql.escape(data_object[i]) + ",";
            } else {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }

        key = key.substr(0, key.length - 1);
        value = value.substr(0, value.length - 1);

        let sql = "INSERT INTO " + table + " (" + key + ") VALUES (" + value + ")";
        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  (err, result) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve(result.insertId);
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    };
    async insertOrUpdateByUniqueKey(table, primary_key, set) {
        if(typeof table !== "string" || typeof primary_key !== "object" || typeof set !== "object")
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        if(Object.keys(primary_key).length === 0 || Object.keys(set).length === 0)
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let sql = "INSERT INTO " + table + " ";

        let key = "(";
        let value = "(";
        let update = "";
        for(let i in primary_key) {
            let type = typeof(primary_key[i]);
            if(type === "number" || type === "string") {
                key += "`" + i + "`,";
                value += mysql.escape(primary_key[i]) + ",";
            } else {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }

        for(let i in set) {
            let type = typeof(set[i]);

            if(type === "number" || type === "string") {
                key +=  i + ',';
                value += mysql.escape(set[i]) + ",";
                update += i + "=" + mysql.escape(set[i]) + " AND ";
            } else {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }


        key = key.substr(0, key.length -1) + ")";//del the last ','
        value = value.substr(0, value.length -1) + ")";//del the last ','
        update = update.substr(0, update.length - 5);//del the last '' and'

        sql = sql + key + " VALUES " + value + " ON DUPLICATE KEY UPDATE " + update;
        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err ) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve();
                        }
                        connection.release()
                    })
                }
            })
        })
    };
    async deleteDB(table, condition) {
        if(typeof (table) !== "string" || typeof (condition) !== "object" || Object.keys(condition).length === 0)
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let sql = "DELETE FROM " + table + " where ";

        for (let i in condition) {
            if(typeof (condition[i]) === "string" || typeof (condition[i]) === "number") {
                sql = sql + i + "=" + mysql.escape(condition[i]) + " and ";
            } else {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }
        sql = sql.substr(0, sql.length - 5);

        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err ) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve();
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    };
    async replaceDB(table, condition) {
        if(typeof table !== "string" || typeof condition !== "object" || Object.keys(condition).length === 0)
        {
            throw new MysqlError(ERROR_MSG.mysql_condition_error);
        }

        let key = "(";
        let value = "(";
        for(let i in condition) {
            if(typeof(condition[i]) === "string" || typeof(condition[i]) === "number") {
                key +=  i + ',';
                value += mysql.escape(condition[i]) + ",";
            } else {
                throw new MysqlError(ERROR_MSG.mysql_condition_error);
            }
        }

        key = key.substr(0, key.length -1) + ")";//del the last ','
        value = value.substr(0, value.length -1) + ")";//del the last ','

        let sql = "REPLACE INTO " + table + " " + key + " VALUES " + value;
        this._log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this._pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql,  ( err ) => {
                        if ( err ) {
                            reject( err )
                        } else {
                            resolve();
                        }
                        connection.release()
                    })
                }
            })
        })
    };
}


module.exports = Mysql;