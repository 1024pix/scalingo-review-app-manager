import sinon from 'sinon';

import chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';

chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

nock.disableNetConnect();

function catchErr(promiseFn, ctx) {
  return async (...args) => {
    try {
      await promiseFn.call(ctx, ...args);
      return 'should have thrown an error';
    } catch (err) {
      return err;
    }
  };
}

export {
  chai,
  expect,
  nock,
  sinon,
  catchErr,
};
