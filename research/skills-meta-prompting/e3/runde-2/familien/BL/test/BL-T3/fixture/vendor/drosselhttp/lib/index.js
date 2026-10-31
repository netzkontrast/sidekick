// drosselhttp 4.2 – öffentliche API
const { withRetry } = require("./retry");

async function request(url, init = {}) {
  return withRetry(() => fetch(url, init));
}

module.exports = { request };
