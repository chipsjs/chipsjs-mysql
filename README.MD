# 项目介绍
- chipsjs-mysql is a promise-based Node.js ORM for MySQL.
- 一个未成熟的orm,可以通过传日志模块自定义log,默认使用console.log
- 请不要直接把param放入condition中，value避免了sql注入风险，但是需要自己保证key的安全性

# 安装步骤
- npm install chipsjs-mysql

# todo
- 单元测试
- 传对象到函数中,减少函数参数
- 魔法数字的处理，比如可以把 and 放到一个配置里，比如
      str = ' and '
      length = str.length
