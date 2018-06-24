// tslint:disable only-arrow-functions
// tslint:disable no-unused-expression
import { expect } from 'chai';
import path from 'path';
import * as sinon from 'sinon';
import { Integrity } from '../../src/app/integrity';
import * as utils from '../../src/common/utils';
import { IntegrityOptions } from '../../src/interfaces/integrityOptions';

describe('IntegrityChecker: function \'check\' tests', function () {

  context('expects', function () {

    let anotherFileToHashFilename: string;
    let fileToHashFilename: string;
    let integrityTestFilename: string;
    let directoryDirPath: string;
    let fixturesDirPath: string;
    let anotherFileToHashFilePath: string;
    let fileToHashFilePath: string;
    let integrityTestFilePath: string;

    before(function () {
      anotherFileToHashFilename = 'anotherFileToHash.txt';
      fileToHashFilename = 'fileToHash.txt';
      integrityTestFilename = '.integrity.json';
    });

    let options: IntegrityOptions;
    let sandbox: sinon.SinonSandbox;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      fixturesDirPath = path.resolve(__dirname, '../../../test/fixtures');
      directoryDirPath = path.resolve(fixturesDirPath, 'directory');
      anotherFileToHashFilePath = path.resolve(directoryDirPath, anotherFileToHashFilename);
      fileToHashFilePath = path.resolve(fixturesDirPath, fileToHashFilename);
      integrityTestFilePath = path.resolve(fixturesDirPath, integrityTestFilename);
      options = {
        cryptoOptions: undefined,
        exclude: undefined,
        verbose: undefined,
      };
    });

    afterEach(function () {
      sandbox.restore();
    });

    context('to throw an Error when \'integrity\'', function () {

      it('is a file path and filename is invalid',
        async function () {
          // @ts-ignore
          const existsStub = sandbox.stub(Integrity, '_exists')
            .returns(true);
          // @ts-ignore
          const lstatStub = sandbox.stub(Integrity, '_lstat')
            .returns({ isDirectory: () => false, isFile: () => true });
          try {
            await Integrity.check(fileToHashFilePath, 'package.json');
          } catch (error) {
            expect(existsStub.called).to.be.true;
            expect(lstatStub.called).to.be.true;
            expect(error).to.be.an.instanceof(Error).and.match(/EINVNAME/);
          }
        });

      it('versions differ',
        async function () {
          const hashObj = '{"version":"2","hashes":{"fileToHash.txt":"7a3d5b475bd07ae9041fab2a133f40c4"}}';
          // @ts-ignore
          const validateStub = sandbox.stub(Integrity, '_validate').resolves();
          try {
            await Integrity.check(fileToHashFilePath, hashObj);
          } catch (error) {
            expect(error).to.be.an.instanceof(Error)
              .and.match(/EINVER/)
              .and.match(/Incompatible versions check/);
          }
        });

      it('schema is not valid',
        function () {
          const hashObj = '{"version":"1","fileToHash.txt":"7a3d5b475bd07ae9041fab2a133f40c4"}';
          Integrity.check(fileToHashFilePath, hashObj).catch(err => {
            expect(err).to.be.an.instanceof(Error).and.match(/EVALER/);
          });
        });

      it('path is other than a file or a directory',
        async function () {
          // @ts-ignore
          const lstatStub = sandbox.stub(Integrity, '_lstat')
            .returns({ isDirectory: () => false, isFile: () => false });
          try {
            await Integrity.check(fileToHashFilePath, integrityTestFilePath);
          } catch (error) {
            // expect(existsStub.called).to.be.true;
            expect(lstatStub.called).to.be.true;
            expect(error).to.be.an.instanceof(Error).and.match(/ENOSUP/);
          }
        });

    });

    context('to fail integrity check when', function () {

      context('integrity file content is', function () {

        it('empty',
          async function () {
            // @ts-ignore
            const readFileStub = sandbox.stub(Integrity, '_readFile')
              .returns('');
            try {
              await Integrity.check(fileToHashFilePath, integrityTestFilePath);
            } catch (error) {
              expect(readFileStub.called).to.be.true;
              expect(error).to.be.an.instanceof(Error);
            }
          });

        it('invalid',
          async function () {
            // @ts-ignore
            const readFileStub = sandbox.stub(Integrity, '_readFile')
              .returns('invalid integrity object');
            try {
              await Integrity.check(fileToHashFilePath, integrityTestFilePath);
            } catch (error) {
              expect(readFileStub.called).to.be.true;
              expect(error).to.be.an.instanceof(Error);
            }
          });

      });

      it('input path is an empty string',
        async function () {
          const sut = await Integrity.check('', integrityTestFilePath);
          expect(sut).to.be.a('boolean').and.to.be.false;
        });

      it('input path is other than a file path or a directory path',
        function () {
          // @ts-ignore
          Integrity.check({}, integrityTestFilePath).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(0, integrityTestFilePath).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(true, integrityTestFilePath).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(null, integrityTestFilePath).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(undefined, integrityTestFilePath).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(Symbol(), integrityTestFilePath).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
        });

      it('integrity JSON is empty',
        function () {
          Integrity.check(fileToHashFilePath, '{}').catch(err => {
            expect(err).to.be.an.instanceof(Error);
          });
        });

      it('integrity is an empty string',
        async function () {
          const sut = await Integrity.check(fileToHashFilePath, '');
          expect(sut).to.be.a('boolean').and.to.be.false;
        });

      it('integrity is other than a file path, a directory path, a JSON or a hash string',
        function () {
          // @ts-ignore
          Integrity.check(fileToHashFilePath, {}).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(fileToHashFilePath, 0).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(fileToHashFilePath, true).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(fileToHashFilePath, null).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(fileToHashFilePath, undefined).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
          // @ts-ignore
          Integrity.check(fileToHashFilePath, Symbol()).then(sut =>
            expect(sut).to.be.a('boolean').and.to.be.false);
        });

    });

    context('when the provided input path', function () {

      context('is a file', function () {

        context('and using root integrity file', function () {

          context('to pass integrity check', function () {

            it('provided a file path',
              async function () {
                const sut = await Integrity.check(fileToHashFilePath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('of a subdirectory input file path',
              async function () {
                const sut = await Integrity.check(anotherFileToHashFilePath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a directory path',
              async function () {
                const sut = await Integrity.check(fileToHashFilePath, fixturesDirPath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash object (JSON)',
              async function () {
                const hashObj = '{"version":"1","hashes":{"fileToHash.txt":"7a3d5b475bd07ae9041fab2a133f40c4"}}';
                const sut = await Integrity.check(fileToHashFilePath, hashObj);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash string',
              async function () {
                const hash = '7a3d5b475bd07ae9041fab2a133f40c4';
                const sut = await Integrity.check(fileToHashFilePath, hash);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

          });

        });

        context('and using the directory\'s integrity file', function () {

          let fixturesSubDirPath: string;

          beforeEach(function () {
            fixturesSubDirPath = path.join(fixturesDirPath, 'fixtures');
            fileToHashFilePath = path.resolve(fixturesSubDirPath, fileToHashFilename);
            integrityTestFilePath = path.resolve(fixturesSubDirPath, integrityTestFilename);
          });

          context('to pass integrity check', function () {

            it('provided a file path',
              async function () {
                const sut = await Integrity.check(fileToHashFilePath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('of a subdirectory input file path',
              async function () {
                const directorySubDirPath = path.join(fixturesSubDirPath, 'directory');
                anotherFileToHashFilePath = path.resolve(directorySubDirPath, anotherFileToHashFilename);
                integrityTestFilePath = path.resolve(directorySubDirPath, integrityTestFilename);
                const sut = await Integrity.check(anotherFileToHashFilePath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a directory path',
              async function () {
                const sut = await Integrity.check(fileToHashFilePath, fixturesSubDirPath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash object (JSON)',
              async function () {
                const hashObj = '{"version":"1","hashes":{"fileToHash.txt":"9fd7c786e27af1eac638d0747a9ed79f"}}';
                const sut = await Integrity.check(fileToHashFilePath, hashObj);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash string',
              async function () {
                const hash = '9fd7c786e27af1eac638d0747a9ed79f';
                const sut = await Integrity.check(fileToHashFilePath, hash);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

          });

        });

        context('and using the parent directory integrity file', function () {

          let fixturesSubDirPath: string;

          beforeEach(function () {
            fixturesSubDirPath = path.join(fixturesDirPath, 'fixtures');
            fileToHashFilePath = path.resolve(fixturesSubDirPath, fileToHashFilename);
          });

          context('to pass integrity check', function () {

            it('provided a file path',
              async function () {
                const sut = await Integrity.check(fileToHashFilePath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('of a subdirectory input file path',
              async function () {
                const directorySubDirPath = path.join(fixturesSubDirPath, 'directory');
                anotherFileToHashFilePath = path.resolve(directorySubDirPath, anotherFileToHashFilename);
                integrityTestFilePath = path.resolve(fixturesSubDirPath, integrityTestFilename);
                const sut = await Integrity.check(anotherFileToHashFilePath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a directory path',
              async function () {
                const sut = await Integrity.check(fileToHashFilePath, fixturesDirPath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash object (JSON)',
              async function () {
                const hashObj = '{"version":"1","hashes":{"fileToHash.txt":"9fd7c786e27af1eac638d0747a9ed79f"}}';
                const sut = await Integrity.check(fileToHashFilePath, hashObj);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash string',
              async function () {
                const hash = '9fd7c786e27af1eac638d0747a9ed79f';
                const sut = await Integrity.check(fileToHashFilePath, hash);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

          });

        });

      });

      context('is a directory', function () {

        context('to pass integrity check', function () {

          it('provided a non-verbosely directory hash',
            async function () {
              options.verbose = false;
              // @ts-ignore
              const readFileStub = sandbox.stub(Integrity, '_readFile')
                .returns('{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}');
              const sut = await Integrity.check(fixturesDirPath, integrityTestFilePath, options);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('of a subdirectory input directory path, provided a semi-verbosely directory hash',
            async function () {
              // This is a scenario that can not happen when using the 'create' function,
              // because hash creation is either verbosely or non-verbosely on all nodes.
              // We cover this scenario, in case the user provides a self-created integrity file.

              options.verbose = false;
              const hash = '{"version":"1","hashes":{"fixtures":{' +
                '"contents":{"directory":"b5d58874a8e6c2b2d6a1f179b4ee7d0f"},' +
                '"hash":"03a3d76b2c52d62ce63502b85100575f"}}}';
              // @ts-ignore
              const readFileStub = sandbox.stub(Integrity, '_readFile')
                .returns(hash);
              const sut = await Integrity.check(directoryDirPath, integrityTestFilePath, options);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

        });

        context('to fail integrity check of a subdirectory input directory path', function () {

          it('provided a semi-verbosely directory hash and subdirectory hash is empty',
            async function () {
              // This is a scenario that can not happen when using the 'create' function,
              // because hash creation is either verbosely or non-verbosely on all nodes.
              // We cover this scenario, in case the user provides a self-created integrity file.

              options.verbose = false;
              const hash = '{"version":"1","hashes":{"fixtures":{' +
                '"contents":{"directory":""},' +
                '"hash":"03a3d76b2c52d62ce63502b85100575f"}}}';
              // @ts-ignore
              const readFileStub = sandbox.stub(Integrity, '_readFile')
                .returns(hash);
              const sut = await Integrity.check(directoryDirPath, integrityTestFilePath, options);
              expect(sut).to.be.a('boolean').and.to.be.false;
            });

          context('using a parent directory integrity file, ' +
            'provided a non-verbosely directory hash', function () {

              it('that is valid',
                async function () {
                  options.verbose = false;
                  const hash = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                  // @ts-ignore
                  const readFileStub = sandbox.stub(Integrity, '_readFile')
                    .returns(hash);
                  const sut = await Integrity.check(directoryDirPath, integrityTestFilePath, options);
                  expect(sut).to.be.a('boolean').and.to.be.false;
                });

              it('that is invalid',
                async function () {
                  options.verbose = false;
                  const hash = '{"version":"1","hashes":{"fixtures":"b5d58874a8e6c2b2d6a1f179b4ee7d0f"}}';
                  // @ts-ignore
                  const readFileStub = sandbox.stub(Integrity, '_readFile')
                    .returns(hash);
                  const sut = await Integrity.check(directoryDirPath, integrityTestFilePath, options);
                  expect(sut).to.be.a('boolean').and.to.be.false;
                });

            });

        });

        context('and using root integrity file', function () {

          context('to pass integrity check', function () {

            it('provided a file path',
              async function () {
                const sut = await Integrity.check(fixturesDirPath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('of a subdirectory input directory path',
              async function () {
                const sut = await Integrity.check(directoryDirPath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a directory path',
              async function () {
                const sut = await Integrity.check(fixturesDirPath, fixturesDirPath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a non-verbosely hash object (JSON)',
              async function () {
                options.verbose = false;
                const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                const sut = await Integrity.check(fixturesDirPath, hashObj, options);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash string',
              async function () {
                options.verbose = false;
                const hash = '03a3d76b2c52d62ce63502b85100575f';
                const sut = await Integrity.check(fixturesDirPath, hash, options);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

          });

          context('to fail integrity check', function () {

            it('provided a non-verbosely hash object (JSON), against a verbosely created hash',
              async function () {
                const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                const sut = await Integrity.check(fixturesDirPath, hashObj, options);
                expect(sut).to.be.a('boolean').and.to.be.false;
              });

            it('provided a hash string against a verbosely created hash',
              async function () {
                const hash = '03a3d76b2c52d62ce63502b85100575f';
                const sut = await Integrity.check(fixturesDirPath, hash, options);
                expect(sut).to.be.a('boolean').and.to.be.false;
              });

          });

        });

        context('and using the directory\'s integrity file', function () {

          let fixturesSubDirPath: string;

          beforeEach(function () {
            fixturesSubDirPath = path.join(fixturesDirPath, 'fixtures');
            integrityTestFilePath = path.resolve(fixturesSubDirPath, integrityTestFilename);
          });

          context('to pass integrity check', function () {

            it('provided a file path',
              async function () {
                const sut = await Integrity.check(fixturesSubDirPath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('of a subdirectory input file path',
              async function () {
                const directorySubDirPath = path.join(fixturesSubDirPath, 'directory');
                integrityTestFilePath = path.resolve(directorySubDirPath, integrityTestFilename);
                const sut = await Integrity.check(directorySubDirPath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a directory path',
              async function () {
                const sut = await Integrity.check(fixturesSubDirPath, fixturesSubDirPath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a non-verbosely hash object (JSON)',
              async function () {
                options.verbose = false;
                const hashObj = '{"version":"1","hashes":{"fixtures":"7b418ed4e1f2ff6cd215c4a2add335ef"}}';
                const sut = await Integrity.check(fixturesSubDirPath, hashObj, options);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash string',
              async function () {
                options.verbose = false;
                const hash = '7b418ed4e1f2ff6cd215c4a2add335ef';
                const sut = await Integrity.check(fixturesSubDirPath, hash, options);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

          });

          context('to fail integrity check', function () {

            it('provided a non-verbosely hash object (JSON), against a verbosely created hash',
              async function () {
                const hashObj = '{"version":"1","hashes":{"fixtures":"074e46454b567069ab80df4302605df2"}}';
                const sut = await Integrity.check(fixturesSubDirPath, hashObj, options);
                expect(sut).to.be.a('boolean').and.to.be.false;
              });

            it('provided a hash string against a verbosely created hash',
              async function () {
                const hash = '074e46454b567069ab80df4302605df2';
                const sut = await Integrity.check(fixturesSubDirPath, hash, options);
                expect(sut).to.be.a('boolean').and.to.be.false;
              });

          });

        });

        context('and using the parent directory integrity file', function () {

          let fixturesSubDirPath: string;

          beforeEach(function () {
            fixturesSubDirPath = path.join(fixturesDirPath, 'fixtures');
          });

          context('to pass integrity check', function () {

            it('provided a file path',
              async function () {
                const sut = await Integrity.check(fixturesSubDirPath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('of a subdirectory input file path',
              async function () {
                const directorySubDirPath = path.join(fixturesSubDirPath, 'directory');
                integrityTestFilePath = path.resolve(fixturesSubDirPath, integrityTestFilename);
                const sut = await Integrity.check(directorySubDirPath, integrityTestFilePath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a directory path',
              async function () {
                const sut = await Integrity.check(fixturesSubDirPath, fixturesDirPath);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a non-verbosely hash object (JSON)',
              async function () {
                options.verbose = false;
                const hashObj = '{"version":"1","hashes":{"fixtures":"7b418ed4e1f2ff6cd215c4a2add335ef"}}';
                const sut = await Integrity.check(fixturesSubDirPath, hashObj, options);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

            it('provided a hash string',
              async function () {
                options.verbose = false;
                const hash = '7b418ed4e1f2ff6cd215c4a2add335ef';
                const sut = await Integrity.check(fixturesSubDirPath, hash, options);
                expect(sut).to.be.a('boolean').and.to.be.true;
              });

          });

          context('to fail integrity check', function () {

            it('provided a non-verbosely hash object (JSON), against a verbosely created hash',
              async function () {
                const hashObj = '{"version":"1","hashes":{"fixtures":"074e46454b567069ab80df4302605df2"}}';
                const sut = await Integrity.check(fixturesSubDirPath, hashObj, options);
                expect(sut).to.be.a('boolean').and.to.be.false;
              });

            it('provided a hash string against a verbosely created hash',
              async function () {
                const hash = '074e46454b567069ab80df4302605df2';
                const sut = await Integrity.check(fixturesSubDirPath, hash, options);
                expect(sut).to.be.a('boolean').and.to.be.false;
              });

          });

        });

      });

    });

    context('when detecting options', function () {

      it('to preserve \'exclude\' option',
        async function () {
          options.exclude = [fileToHashFilename];
          const sut = await Integrity.check(fixturesDirPath, integrityTestFilePath, options, true);
          expect(sut).to.be.a('boolean').and.to.be.false;
        });

      context('to fail detection when', function () {

        it('provided a file path, the integrity hash object can not be determined',
          async function () {
            options.cryptoOptions = { encoding: 'latin1' };
            const resolvedHashObj = await Integrity.create(fixturesDirPath, options);
            const parseStub = sandbox.stub(utils, 'parseJSON')
              .onFirstCall().returns(null)
              .returns(resolvedHashObj);
            const sut = await Integrity.check(fixturesDirPath, integrityTestFilePath, true);
            expect(parseStub.called).to.be.true;
            expect(sut).to.be.a('boolean').and.to.be.false;
          });

      });

      context('and the integrity hash object has', function () {

        context('not been created with the default algorithm', function () {

          context('to fail integrity check', function () {

            context('when the creation of the testing hash object', function () {

              it('throws an error',
                async function () {
                  const resolvedHashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                  const createStub = sandbox.stub(Integrity, 'create').throws()
                    .onCall(46).resolves(JSON.parse(resolvedHashObj));
                  const hashObj = '{"version":"1","hashes":{"fixtures":"\\fÇ8\\u0011ÌúIÄÎ(Lo]¹tÁ"}}';
                  const sut = await Integrity.check(fixturesDirPath, hashObj, true);
                  expect(createStub.called).to.be.true;
                  expect(sut).to.be.a('boolean').and.to.be.false;
                });

              it('returns nothing',
                async function () {
                  const resolvedHashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                  const createStub = sandbox.stub(Integrity, 'create').returns(undefined)
                    .onCall(46).resolves(JSON.parse(resolvedHashObj));
                  const hashObj = '{"version":"1","hashes":{"fixtures":"\\fÇ8\\u0011ÌúIÄÎ(Lo]¹tÁ"}}';
                  const sut = await Integrity.check(fixturesDirPath, hashObj, true);
                  expect(createStub.called).to.be.true;
                  expect(sut).to.be.a('boolean').and.to.be.false;
                });

            });

          });

        });

        context('been created with the default algorithm', function () {

          context('to pass integrity check', function () {

            context('when the creation of the testing hash object', function () {

              it('throws an error',
                async function () {
                  const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                  const createStub = sandbox.stub(Integrity, 'create').throws()
                    .onCall(46).resolves(JSON.parse(hashObj));
                  const sut = await Integrity.check(fixturesDirPath, hashObj, true);
                  expect(createStub.called).to.be.true;
                  expect(sut).to.be.a('boolean').and.to.be.true;
                });

              it('returns nothing',
                async function () {
                  const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
                  const createStub = sandbox.stub(Integrity, 'create').returns(undefined)
                    .onCall(46).resolves(JSON.parse(hashObj));
                  const sut = await Integrity.check(fixturesDirPath, hashObj, true);
                  expect(createStub.called).to.be.true;
                  expect(sut).to.be.a('boolean').and.to.be.true;
                });

            });

          });

        });

      });

      context('provided a hash object (JSON)', function () {

        context('it detects the usage of', function () {

          it('unknown encoding',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"\\u010A,F\\u0032«+{@/="}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.false;
            });

          it('unknown algorithm',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"12A468C211G95"}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.false;
            });

          it('unknown verbosity',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":[]}}';
              try {
                await Integrity.check(fixturesDirPath, hashObj, true);
              } catch (error) {
                expect(error).to.be.an.instanceof(Error).and.to.match(/EVALER/);
              }
            });

          it('non-verbose creation',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('verbose creation',
            async function () {
              const sut = await Integrity.check(fixturesDirPath, integrityTestFilePath, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'md5\' algorithm',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'sha1\' algorithm',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"0c88c73811cc9efa49c4ce289e4c6f5db99c74c1"}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'hex\' encryption',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"03a3d76b2c52d62ce63502b85100575f"}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'base64\' encryption',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"DIjHOBHMnvpJxM4onkxvXbmcdME="}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'latin1\' encryption',
            async function () {
              const hashObj = '{"version":"1","hashes":{"fixtures":"\\fÇ8\\u0011ÌúIÄÎ(Lo]¹tÁ"}}';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

        });

      });

      context('provided a hash string', function () {

        context('it detects the usage of', function () {

          it('unknown encoding',
            async function () {
              const hash = '\u010A,F\u0032«+{@/=';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.false;
            });

          it('unknown algorithm',
            async function () {
              const hash = '12A468C211G95';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.false;
            });

          it('non-verbose hash',
            async function () {
              const hash = '03a3d76b2c52d62ce63502b85100575f';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('verbose hash',
            async function () {
              const sut = await Integrity.check(fixturesDirPath, integrityTestFilePath, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'md5\' algorithm',
            async function () {
              const hash = '03a3d76b2c52d62ce63502b85100575f';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'sha1\' algorithm',
            async function () {
              const hashObj = '0c88c73811cc9efa49c4ce289e4c6f5db99c74c1';
              const sut = await Integrity.check(fixturesDirPath, hashObj, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'hex\' encryption',
            async function () {
              const hash = '03a3d76b2c52d62ce63502b85100575f';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'base64\' encryption',
            async function () {
              const hash = 'DIjHOBHMnvpJxM4onkxvXbmcdME=';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

          it('\'latin1\' encryption',
            async function () {
              const hash = '\u0003£×k,RÖ,æ5\u0002¸Q\u0000W_';
              const sut = await Integrity.check(fixturesDirPath, hash, true);
              expect(sut).to.be.a('boolean').and.to.be.true;
            });

        });

      });

    });

  });

});
