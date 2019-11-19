# 项目介绍
- chipsjs-mysql is a promise-based Node.js ORM for MySQL.
- 一个未成熟的orm,可以通过传日志模块自定义log,默认使用console.log
- 请不要直接把param放入condition中，需要自己保证key的安全性

# 安装步骤
- npm install chipsjs-mysql

# 需要深思的实践
## dateformat问题
- 例如数据库存的是dateformat格式,本来想http request 的body是 time_stamp = 2019-08-30 11:53:34；如果你输入 time_stamp = ‘2019-08-30 11:53:34’也会输出数据，原因是‘2019-08-30 11:53:34’在转换为dateformat格式中 转成了另一个时间而不是2019-08-30 11:53:34，是一个不安全的时间
- 目前想到的做法是业务层去校验是否是dateformat格式，即
```
    let a = new Date("2019-01-01 01:01:01");
    let b = new Date("'2019-01-01 01:01:01'");
```

# todo
- 单元测试
- 传对象到函数中,减少函数参数
- 魔法数字的处理，比如可以把 and 放到一个配置里，比如
      str = ' and '
      length = str.length
