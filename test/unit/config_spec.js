/* global Config */

describe('Config', function() {
  describe('load', function() {
    it('loads a config setting from storage', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(true));

      Config.load('debug').then((result) => {
        expect(Storage.load).toHaveBeenCalledWith('config-debug');
        expect(result).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('returns a default if the setting is not in storage', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      Config.load('debug').then((result) => {
        expect(Storage.load).toHaveBeenCalledWith('config-debug');
        // Default for the debug setting is false
        expect(result).toEqual(false);
        done();
      }).catch((error) => done.fail(error));
    });

    it('throws if the setting name is invalid', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve());

      Config.load('invalid-name').then((result) => {
        done.fail('Promise was not rejected.');
      })
      .catch((error) => {
        expect(Storage.load).not.toHaveBeenCalled();
        expect(error).toEqual('Invalid config name: invalid-name');
        done();
      });
    });
  });

  describe('save', function() {
    it('saves a config setting to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      Config.save('debug', true).then(() => {
        expect(Storage.save).toHaveBeenCalledWith('config-debug', true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('throws if the setting name is invalid', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      Config.save('invalid-name').then(() => {
        done.fail('Promise was not rejected.');
      })
      .catch((error) => {
        expect(Storage.save).not.toHaveBeenCalled();
        expect(error).toEqual('Invalid config name: invalid-name');
        done();
      });
    });
  });
});
