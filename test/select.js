const { selectSetUp } = require('./setup');
const config = require('./config.json')

describe('select', () => {
  let client;

  before('set up env', async () => {
    client = await selectSetUp();
  });

  describe('select * from', () => {
    let result;

    before('execute', async () => {
      result = await client.selectDB(config.table, {

      });
    })

    it('should generate correct sql', () => {

    });

    it('should get correct data from db', () => {

    });
  });

  describe('select keys from', () => {
    it('should generate correct sql', () => {

    });

    it('should get correct data from db', () => {

    });
  });
});
