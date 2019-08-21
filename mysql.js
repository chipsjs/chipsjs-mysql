/**
 * define common mysql's opreate for common component
 *
 * @author chips
 * @date 2018/11/16
 */
'use strict';
const mysql = require('mysql');

class MysqlError extends TypeError {
    constructor (message) {
        super(message);
        this.type = "Chipsjs_Mysql_Error";
    }
}

MysqlError.err_msg = {
    mysql_condition_error: "查询条件出错",
    mysql_no_table: "mysql不存在table",
    mysql_filter_problem: "mysql_filter_problem",
    mysql_param_undefined: "mysql_param_undefined",
};

class Mysql {
    constructor() {
        this.pool = null;
        this.Log = {
            info: function(msg){
                console.log(msg);
            },
            error: function(msg) {
                console.error(msg);
            },
            debug: function (msg) {
                console.debug(msg);
            }
        };
    }

    async init(host, user, password, charset, database, data_string, user_log_module) {
        this.pool = mysql.createPool({
            host: host,
            user: user,
            password: password,
            charset: charset,
            database: database,
            dateStrings: data_string
        });

        if(typeof user_log_module === "object" && typeof user_log_module.info === "function" && typeof user_log_module.debug === "function" && typeof user_log_module.error === "function") {
            this.Log = user_log_module;
        }

        this.Log.info("mysql: 连接mysql中...");
        this.pool.on('connection', function (connection) {
            this.Log.info("mysql: 新建mysql连接成功并加入连接池");
            connection.query('SET SESSION auto_increment_increment=1')
        });
        this.pool.on('error', function (err) {
            this.Log.error("mysql: " + err);
        });
    };

    static escape(sql){
        return mysql.escape(sql);
    };

    generateSql(table, equal_condition, like_condition, data_param_arr) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }

                let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
                sql += i + " like " + mysql.escape(temp_sub_sql) + " and "; //sql
            }

            sql = sql.substr(0, sql.length - 5);
        }


        return sql;
    };
    generateCountSql(table, equal_condition, like_condition) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        let sql = "select count(*) from " + table + " where ";

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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }

                let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
                sql += i + " like " + mysql.escape(temp_sub_sql) + " and "; //sql
            }

            sql = sql.substr(0, sql.length - 5);
        }


        return sql;
    };

    //async await
    awaitCommonWithParam(sql_str, values) {
        this.Log.debug("Mysql.commonWithParam:sqlString is " + sql_str + "; values are " + values);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql_str, values,  ( err, rows) => {
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
    awaitCommonWithoutParam(sql_str) {
        this.Log.debug("Mysql.awaitCommonWithoutParam:sqlString is " + sql_str);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
                if (err) {
                    reject( err )
                } else {
                    connection.query(sql_str,  ( err, rows) => {
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
    awaitGetCount(table, equal_condition, like_condition) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_param_undefined);
        }

        let sql = "select count(*) from " + table + " where ";

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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }

                let temp_sub_sql = "%" + like_condition[i].replace(/\\/g, "\\\\") + "%";
                sql += i + " like " + mysql.escape(temp_sub_sql) + " and ";
            }

            sql = sql.substr(0, sql.length - 5);
        }

        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitGetCountWithSql(sql_str) {
        this.debug("Mysql.awaitGetCountWithSql:sql_str is " + sql_str);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitSelectDB(table, equal_condition, like_condition, data_param_arr, desc_param_str, page_obj) { //pid
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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

        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitUpdateDB(table, condition , set) {
        if(typeof (table) !== "string" || typeof(condition) !== "object" || typeof(set) !== "object" || Object.keys(set).length === 0)//如果condtion的长度为0则where 1 = 1
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }
            sql = sql.substr(0, sql.length - 5);
        }

        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitInsertDB(table, data_object, is_ignore) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        if(typeof(data_object) !== "object" || Object.keys(data_object).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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

        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitInsertAndGetID(table, data_object) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        if(typeof(data_object) !== "object" || Object.keys(data_object).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }

        key = key.substr(0, key.length - 1);
        value = value.substr(0, value.length - 1);

        let sql = "INSERT INTO " + table + " (" + key + ") VALUES (" + value + ")";
        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitInsertOrUpdateByUniqueKey(table, primary_key, set) {
        if(typeof table !== "string" || typeof primary_key !== "object" || typeof set !== "object")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        if(Object.keys(primary_key).length === 0 || Object.keys(set).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }

        for(let i in set) {
            let type = typeof(set[i]);

            if(type === "number" || type === "string") {
                key +=  i + ',';
                value += mysql.escape(set[i]) + ",";
                update += i + "=" + mysql.escape(set[i]) + " AND ";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }


        key = key.substr(0, key.length -1) + ")";//del the last ','
        value = value.substr(0, value.length -1) + ")";//del the last ','
        update = update.substr(0, update.length - 5);//del the last '' and'

        sql = sql + key + " VALUES " + value + " ON DUPLICATE KEY UPDATE " + update;
        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitDeleteDB(table, condition) {
        if(typeof (table) !== "string" || typeof (condition) !== "object" || Object.keys(condition).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        let sql = "DELETE FROM " + table + " where ";

        for (let i in condition) {
            if(typeof (condition[i]) === "string" || typeof (condition[i]) === "number") {
                sql = sql + i + "=" + mysql.escape(condition[i]) + " and ";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }
        sql = sql.substr(0, sql.length - 5);

        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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
    awaitReplaceDB(table, condition) {
        if(typeof table !== "string" || typeof condition !== "object" || Object.keys(condition).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        let key = "(";
        let value = "(";
        for(let i in condition) {
            if(typeof(condition[i]) === "string" || typeof(condition[i]) === "number") {
                key +=  i + ',';
                value += mysql.escape(condition[i]) + ",";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }

        key = key.substr(0, key.length -1) + ")";//del the last ','
        value = value.substr(0, value.length -1) + ")";//del the last ','

        let sql = "REPLACE INTO " + table + " " + key + " VALUES " + value;
        this.Log.debug(sql);

        return new Promise(( resolve, reject ) => {
            this.pool.getConnection(function(err, connection) {
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

    //common
    commonWithParam(sql_str, values, callback) {
        this.Log.debug("Mysql.commonWithParam:sqlString is " + sql_str, "; values are ", values);
        this.pool.getConnection(function (err, connection) {
            connection.query(sql_str, values, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
    commonWithoutParam(sql_str, callback) {
        this.Log.debug("Mysql.commonWithoutParam:sqlString is " + sql_str);
        this.pool.getConnection(function (err, connection) {
            connection.query(sql_str, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
    selectDB(table, equal_condition, like_condition, data_param_arr, desc_param_str, callback) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }

            for(let i in like_condition)
            {
                if (typeof (like_condition[i]) !== "string")
                {
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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

        this.Log.debug(sql);

        this.pool.getConnection(function (err, connection) {
            connection.query(sql, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
    updateDB(table, condition, set, callback) {
        if(typeof (table) !== "string" || typeof(condition) !== "object" || typeof(set) !== "object" || Object.keys(set).length === 0)//如果condtion的长度为0则where 1 = 1
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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
                    throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
                }
            }
            sql = sql.substr(0, sql.length - 5);
        }

        this.Log.debug(sql);

        this.pool.getConnection(function (err, connection) {
            connection.query(sql, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
    insertDB(table, data_object, is_ignore, callback) {
        if(typeof (table) !== "string")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        if(typeof(data_object) !== "object" || Object.keys(data_object).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        let key = "";
        let value = "";
        for (let i in data_object)
        {
            let type = typeof (data_object[i]);
            if(type === "string" || type === "number")
            {
                key += i + ",";
                value +=  mysql.escape(data_object[i]) + ",";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
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

        this.Log.debug(sql);

        this.pool.getConnection(function (err, connection) {
            connection.query(sql, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
    InsertOrUpdateByUniqueKey(table, primary_key, set, callback) {
        if(typeof table !== "string" || typeof primary_key !== "object" || typeof set !== "object")
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        if(Object.keys(primary_key).length === 0 || Object.keys(set).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        let sql = "INSERT INTO " + table + " ";

        let key = "(";
        let value = "(";
        let update = "";
        for(let i in primary_key) {
            let type = typeof(primary_key[i]);
            if(type === "number" || type === "string") {
                key +=  i + ',';
                value += mysql.escape(primary_key[i]) + ",";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }

        for(let i in set) {
            let type = typeof(set[i]);

            if(type === "number" || type === "string") {
                key +=  i + ',';
                value += mysql.escape(set[i]) + ",";
                update += i + "=" + mysql.escape(set[i]) + ",";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }


        key = key.substr(0, key.length -1) + ")";//del the last ','
        value = value.substr(0, value.length -1) + ")";//del the last ','
        update = update.substr(0, update.length - 1);//del the last ','

        sql = sql + key + " VALUES " + value + " ON DUPLICATE KEY UPDATE " + update;
        this.Log.debug(sql);

        this.pool.getConnection(function (err, connection) {
            connection.query(sql, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
    deleteDB(table, condition, callback) {
        if(typeof (table) !== "string"  || typeof (condition) !== "object" || Object.keys(condition).length === 0)
        {
            throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
        }

        let sql = "DELETE FROM " + table + " where ";

        for (let i in condition) {
            if(typeof (condition[i]) === "string" || typeof (condition[i]) === "number") {
                sql = sql + i + "=" + mysql.escape(condition[i]) + " and ";
            } else {
                throw new MysqlError(MysqlError.err_msg.mysql_condition_error);
            }
        }
        sql = sql.substr(0, sql.length - 5);

        this.Log.debug(sql);

        this.pool.getConnection(function (err, connection) {
            connection.query(sql, function (err, result) {
                connection.release();
                if(err) {
                    Log.error(err.message);
                }
                if(typeof callback === "function") {
                    callback(err, result);
                }
            });
        });
    };
};





module.exports = Mysql;