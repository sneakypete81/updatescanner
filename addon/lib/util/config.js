/* exported Config */

/**
 * Static functions to access configuration settings.
 */
class Config {

  /**
   * @returns {Object} Dictionary of default values for all valid config names.
   * By convention, all config names are lowercase and hythenated.
   */
  static get _DEFAULT() {
    return {
      'debug': false, // Enable debug mode
    };
  }

  /**
   * Load a configuration setting, returning a sensible default if the setting
   * doesn't exist.
   *
   * @param {string} name - Name of the configuration setting to load.
   *
   * @returns {Promise} A Promise that fulfils with the setting value, or is
   * rejected if the name is invalid or the storage operation fails.
   */
  static load(name) {
    const default_ = Config._DEFAULT[name];
    if (default_ === undefined) {
      return Promise.reject('Invalid config name: ' + name);
    }

    return Storage.load('config-' + name).then((value) => {
      if (value === undefined) {
        return default_;
      } else {
        return value;
      }
    });
  }

  /**
   * Save a configuration setting.
   *
   * @param {string} name - Name of the configuration setting to save.
   * @param {string} value - Setting value to save.
   *
   * @returns {Promise} An empty Promise that fulfils when the save is complete,
   * or is rejected if the name is invalid or the storage operation fails.
   */
  static save(name, value) {
    if (Config._DEFAULT[name] === undefined) {
      return Promise.reject('Invalid config name: ' + name);
    }

    return Storage.save('config-' + name, value);
  }
}
