import sinon from 'sinon';

import { expect, use as chaiUse } from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';

chaiUse(sinonChai);
chaiUse(chaiAsPromised);

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
  expect,
  nock,
  sinon,
  catchErr,
};
