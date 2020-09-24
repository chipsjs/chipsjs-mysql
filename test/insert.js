const { assert } = require('chai');

const { insertSetUp, table } = require('./setup');

describe('insert', () => {
  let client;

  before('set up env', async () => {
    client = await insertSetUp();
  });

  after('clean env', async () => {
    await client.dropTable(table.insert);
  });

  describe('insertDB normal', () => {
    let result1;
    let result2;

    before('execute', async () => {
      result1 = await client.insertDB(table.insert, {
        c2: 'test',
        c3: 1,
      });

      result2 = await client.selectDB(table.insert, {
        c3: 1,
      })
    })

    it('should have right operation in db', () => {
      assert.nestedPropertyVal(result1, 'affectedRows', 1);
      assert.nestedPropertyVal(result2, '0.c1', result1.insertId);
      assert.nestedPropertyVal(result2, '0.c2', 'test');
      assert.nestedPropertyVal(result2, '0.c3', 1);
    });

    describe('insertDB ignore', () => {
      let result3;
      let result4;

      before('execute', async () => {
        result3 = await client.insertDB(table.insert, {
          c1: 1,
          c2: 'test',
          c3: 1,
        }, true);

        result4 = await client.selectDB(table.insert, {
          c3: 1,
        })
      });

      it('should have right result3 in db', () => {
        assert.nestedPropertyVal(result3, 'affectedRows', 0);
      });

      it('should have right result4 in db', () => {
        assert.nestedPropertyVal(result4, '0.c1', result1.insertId);
        assert.nestedPropertyVal(result4, '0.c2', 'test');
        assert.nestedPropertyVal(result4, '0.c3', 1);
      });
    });
  });

  // escape or sql注入
});
