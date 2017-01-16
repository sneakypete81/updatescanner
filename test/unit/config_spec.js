import {Config, InvalidConfigNameError} from 'util/config';
import {Storage} from 'util/storage';

describe('Config', function() {
  describe('load', function() {
    it('loads a config setting from storage', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({debug: true}));
      spyOn(Storage, 'addListener');

      const config = new Config();
      config.load().then(() => {
        expect(Storage.load).toHaveBeenCalledWith('config');
        expect(Storage.addListener).toHaveBeenCalled();
        expect(config.get('debug')).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('loads a config setting from storage with chained construction',
        function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({debug: true}));
      spyOn(Storage, 'addListener');

      new Config().load().then((config) => {
        expect(Storage.load).toHaveBeenCalledWith('config');
        expect(Storage.addListener).toHaveBeenCalled();
        expect(config.get('debug')).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('only adds a Storage listener the first time load is called',
        function(done) {
      spyOn(Storage, 'load').and.returnValue(Promise.resolve({debug: true}));
      spyOn(Storage, 'addListener');

      const config = new Config();
      config.load().then(
        config.load().then(() => {
          expect(Storage.load).toHaveBeenCalledTimes(2);
          expect(Storage.addListener).toHaveBeenCalledTimes(1);
          expect(config.get('debug')).toEqual(true);
          done();
      })).catch((error) => done.fail(error));
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

  describe('_storageChangeHandler', function() {
    it('updates config data when Storage config data is updated', function() {
      const config = new Config();
      const changes = {config: {newValue: {debug: true}}};

      config._storageChangeHandler(changes);

      expect(config.get('debug')).toEqual(true);
    });

    it('does nothing if Storage config data is unchanged', function() {
      const config = new Config();
      config.set('debug', 42);
      const changes = {anotherChange: {newValue: {debug: true}}};

      config._storageChangeHandler(changes);

      expect(config.get('debug')).toEqual(42);
    });

    it('clears config data if Storage config data is deleted', function() {
      const config = new Config();
      config.set('debug', 42);
      const changes = {config: {}};

      config._storageChangeHandler(changes);

      expect(config.get('debug')).toEqual(false);
    });
  });

  describe('loadSingleSetting', function() {
    it('loads a config setting from storage', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({debug: true}));

      Config.loadSingleSetting('debug').then((debug) => {
        expect(Storage.load).toHaveBeenCalledWith('config');
        expect(debug).toEqual(true);
        done();
      }).catch((error) => done.fail(error));
    });

    it('returns the default if the setting is not in storage', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({}));

      Config.loadSingleSetting('debug').then((debug) => {
        expect(Storage.load).toHaveBeenCalledWith('config');
        // Default for the debug setting is false.
        expect(debug).toEqual(false);
        done();
      }).catch((error) => done.fail(error));
    });

    it('throws if the setting name is invalid', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve({}));

      Config.loadSingleSetting('invalid-setting').then(() => {
        done.fail('Expected loadSingleSetting to throw');
      }).catch((error) => {
        expect(error).toMatch('InvalidConfigNameError');
        done();
      });
    });
  });
});
