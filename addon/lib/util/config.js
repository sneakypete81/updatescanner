/* exported Config */

/**
 * Class used to access configuration settings.
 */
class Config {

  /**
   * @returns {Object} Dictionary of default values for all valid config names.
   * By convention, all config names are lowercase and hythenated.
   */
  static get _DEFAULTS() {
    return {
      'debug': false, // Enable debug mode
    };
  }

  /**
   * Config constructor.
   */
  constructor() {
    this._data = {};
  }

  /**
   * Load the configuration settings from storage.
   *
   * @returns {Promise} A Promise that fulfils with this object (for chaining),
   * or is rejected if the storage operation fails.
   */
  load() {
    return Storage.load('config').then((storageData) => {
      this._data = storageData;
      return this;
    });
  }

  /**
   * Save the configuration settings to storage.
   *
   * @returns {Promise} An empty Promise that fulfils when the save is complete,
   * or is rejected if the storage operation fails.
   */
  save() {
    return Storage.save('config', this._data);
  }

  /**
   * Returns the specified config setting. If the setting was not loaded from
   * storage, a sensible default value is returned. Throws if the setting name
   * is unrecognised.
   *
   * @param {string} name - Name of the config setting.
   *
   * @returns {Object} The requested config setting.
   */
  get(name) {
    if (!Config._DEFAULTS.hasOwnProperty(name)) {
      throw new InvalidConfigNameError(name);
    }

    if (this._data.hasOwnProperty(name)) {
      return this._data[name];
    } else {
      return Config._DEFAULTS[name];
    }
  }

  /**
   * Sets the specified config setting. Throws if the setting name is
   * unrecognised. You will need to call save() to write the updated config to
   * storage.
   *
   * @param {string} name - Name of the config setting.
   * @param {Object} value - New value of the config setting.
   */
  set(name, value) {
    if (!Config._DEFAULTS.hasOwnProperty(name)) {
      throw new InvalidConfigNameError(name);
    }

    this._data[name] = value;
  }
}

/**
 * Thrown if a method is passed an invalid configuration setting name.
 *
 * @param {string} configName - Name of the config setting.
 */
function InvalidConfigNameError(configName) {
  this.name = 'InvalidConfigNameError';
  this.message = 'Invalid config setting: ' + configName;
  this.stack = (new Error()).stack;
}
InvalidConfigNameError.prototype = Object.create(Error.prototype);
InvalidConfigNameError.prototype.constructor = InvalidConfigNameError;
