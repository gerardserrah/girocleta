const { webpush } = require('./_vapid');
const { saveSubscription } = require('./_storage');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscription, preferences, timezone, isTest } = req.body || {};

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Falta la informació de subscripció (subscription.endpoint)' });
    }

    await saveSubscription({
      endpoint: subscription.endpoint,
      subscription: subscription,
      preferences: preferences || {},
      timezone: timezone || 'Europe/Madrid',
      updatedAt: new Date().toISOString()
    });

    if (isTest) {
      const payload = JSON.stringify({
        title: 'Girocleta | Servidor Connectat',
        body: 'El teu dispositiu està connectat correctament al Web Push de servidor!',
        data: { url: './' }
      });

      await webpush.sendNotification(subscription, payload);
    }

    return res.status(200).json({ success: true, message: 'Subscripció desada correctament' });
  } catch (err) {
    console.error('Error a /api/subscribe:', err);
    return res.status(500).json({ error: err.message || 'Error desant subscripció' });
  }
};
