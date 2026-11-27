const { webpush } = require('./_vapid');

const CITYBIK_API = 'https://api.citybik.es/v2/networks/girocleta';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subscription, stationId } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Falta la subscripció Push' });
    }

    // Fetch live station data
    const apiRes = await fetch(CITYBIK_API);
    const data = await apiRes.json();
    const stations = (data && data.network && data.network.stations) ? data.network.stations : [];

    let targetStation = stations[0];
    if (stationId) {
      const found = stations.find(s => (s.extra && s.extra.uid && parseInt(s.extra.uid, 10) === parseInt(stationId, 10)) || s.id === stationId);
      if (found) targetStation = found;
    }

    const name = targetStation ? targetStation.name : 'Biblioteca Antònia Adroher';
    const bikes = targetStation ? targetStation.free_bikes : 9;
    const slots = targetStation ? targetStation.empty_slots : 7;

    const payload = JSON.stringify({
      title: `Girocleta | ${name}`,
      body: `🚲 ${bikes} bicis disponibles\n🅿️ ${slots} llocs lliures (Servidor)`,
      tag: 'girocleta-test-server',
      data: { url: './' }
    });

    await webpush.sendNotification(subscription, payload);

    return res.status(200).json({ success: true, message: 'Notificació de servidor enviada amb èxit' });
  } catch (err) {
    console.error('Error enviant test push:', err);
    return res.status(500).json({ error: err.message || 'Error enviant notificació Push' });
  }
};
