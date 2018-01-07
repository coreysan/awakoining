import { key as KEY, secret as SECRET } from './credentials';

module.exports = {
  headers: {
    'X-MBX-APIKEY': KEY,
    signature: SECRET,
  },
}
