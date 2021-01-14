const { assert } = require('chai');

const { insertSetup, testTable } = require('./setup');

describe('insert', () => {
  let client;

  before('set up env', async () => {
    client = await insertSetup();
  });

  after('clean env', async () => {
    await client.dropTable(testTable.insert);
  });

  describe('insertDB normal', () => {
    let result1;
    let result2;

    before('execute', async () => {
      result1 = await client.insertDB(testTable.insert, {
        c2: 'test',
        c3: 1,
      });

      result2 = await client.selectDB(testTable.insert, {
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
        result3 = await client.insertDB(testTable.insert, {
          c1: 1,
          c2: 'test',
          c3: 1,
        }, true);

        result4 = await client.selectDB(testTable.insert, {
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

  describe('insertDB and get insert id', () => {
    it('should have right id', async () => {
      const id = await client.insertAndGetID(testTable.insert, {
        c2: 'test',
        c3: 1,
      });
      assert.isNumber(id);
    });
  });
});
