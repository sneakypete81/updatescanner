export const localStorage = {
  async getItem(key) {
    const result = await browser.storage.local.get(key);
    return result[key];
  },
  async removeItem(key) {
    await browser.storage.local.remove(key);
  },
  async setItem(key, value) {
    await browser.storage.local.set({[key]: value});
  },
};
