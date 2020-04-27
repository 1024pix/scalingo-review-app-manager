const sinon = require('sinon');

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const nock = require('nock');
nock.disableNetConnect();

module.exports = {
  chai,
  expect,
  nock,
  sinon,
};
