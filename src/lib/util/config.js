import {Storage} from './storage.js';

/**
 * Class used to access configuration settings.
 */
export class Config {
  /**
   * @returns {Object} Dictionary of default values for all valid config names.
   * By convention, all config names are lowercase and hythenated.
   */
  static get _DEFAULTS() {
    return {
      'debug': false, // Enable debug mode
      'isFirstRun': true, // Is this the first time the extension has run
      'updateVersion': 0, // Used to determine if update tasks are required
    };
  }

  /**
   * Config constructor.
   */
  constructor() {
    this._data = {};
  }

  // @TODO: we don't really need this
  /**
   * Loads the configuration settings from storage and gets the specified
   * config setting. If the setting doesn't exist in storage, a sensible
   * default value is returned. Throws if the setting name is unrecognised.
   *
   * @param {string} name - Name of the config setting.
   *
   * @returns {Promise} A promise that fulfils with the requested config
   * setting.
   */
  static async loadSingleSetting(name) {
    const storageData = await Storage.load('config') || {};
    return Config._getWithDefault(storageData, name);
  }

  /**
   * Load the configuration settings from storage.
   *
   * @returns {Promise} A Promise that fulfils with this object (for chaining),
   * or is rejected if the storage operation fails.
   */
  async load() {
    this._data = await Storage.load('config') || {};
    return this;
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
    return Config._getWithDefault(this._data, name);
  }


  /**
   * Used by Config.get and Config.loadSingleSetting to return a default value
   * if the specified setting was not loaded from Storage. Throws if the
   * setting name is unrecognised.
   *
   * @param {type} storageData - Config data from storage.
   * @param {type} name - Name of the config setting.
   *
   * @returns {Object} The requested config setting.
   */
  static _getWithDefault(storageData, name) {
    if (!Config._DEFAULTS.hasOwnProperty(name)) {
      throw new InvalidConfigNameError(name);
    }

    if (storageData.hasOwnProperty(name)) {
      return storageData[name];
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
export function InvalidConfigNameError(configName) {
  this.name = 'InvalidConfigNameError';
  this.message = 'Invalid config setting: ' + configName;
  this.stack = (new Error()).stack;
}
InvalidConfigNameError.prototype = Object.create(Error.prototype);
InvalidConfigNameError.prototype.constructor = InvalidConfigNameError;
