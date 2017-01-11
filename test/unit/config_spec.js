/* global Config, InvalidConfigNameError */

describe('Config', function() {
  describe('load', function() {
    it('loads a config setting from storage', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({debug: true}));

      const config = new Config();
      config.load().then(() => {
        expect(Storage.load).toHaveBeenCalledWith('config');
        expect(config.get('debug')).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('loads a config setting from storage with chained construction',
        function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({debug: true}));

      new Config().load().then((config) => {
        expect(Storage.load).toHaveBeenCalledWith('config');
        expect(config.get('debug')).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a config setting to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      const config = new Config();
      config.set('debug', true);
      config.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith('config', {debug: true});
        done();
      }).catch((error) => done.fail(error));
    });

    it('doesn\'t save unmodified default settings', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());

      const config = new Config();
      config.save().then(() => {
        // Check that a default value is returned, but isn't saved to storage.
        expect(config.get('debug')).toEqual(false);
        expect(Storage.save).toHaveBeenCalledWith('config', {});
        done();
      }).catch((error) => done.fail(error));
    });
  });

  describe('get', function() {
    it('returns the default if the setting is not in storage', function() {
      const result = new Config().get('debug');

      // Default for the debug setting is false.
      expect(result).toEqual(false);
    });

    it('throws if the setting name is invalid', function() {
      expect(() => new Config().get('invalid-setting'))
        .toThrowError(InvalidConfigNameError);
    });
  });

  describe('set', function() {
    it('throws if the setting name is invalid', function() {
      expect(() => new Config().set('invalid-setting', 4))
        .toThrowError(InvalidConfigNameError);
    });
  });
});
