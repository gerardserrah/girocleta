const { VAPID_PUBLIC_KEY } = require('./_vapid');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
};
