const { webpush } = require('./_vapid');
const { getSubscriptions, removeSubscription } = require('./_storage');

const CITYBIK_API = 'https://api.citybik.es/v2/networks/girocleta';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Fetch live Girocleta stations data
    const apiRes = await fetch(CITYBIK_API);
    if (!apiRes.ok) throw new Error(`Error cridant CityBik API: ${apiRes.status}`);
    const citybikData = await apiRes.json();
    const stations = (citybikData && citybikData.network && citybikData.network.stations) ? citybikData.network.stations : [];

    if (stations.length === 0) {
      return res.status(200).json({ status: 'no_stations_found' });
    }

    // Map stations by id/uid and name
    const stationMap = new Map();
    stations.forEach(s => {
      if (s.extra && s.extra.uid) {
        stationMap.set(Number(s.extra.uid), s);
      }
      stationMap.set(s.id, s);
      stationMap.set(s.name, s);
    });

    // 2. Load all active subscriptions
    const subscriptions = await getSubscriptions();
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ status: 'no_subscriptions', total: 0 });
    }

    const now = new Date();
    let sentCount = 0;
    let failedCount = 0;

    for (const subItem of subscriptions) {
      const { subscription, preferences, timezone } = subItem;
      if (!subscription || !preferences || !preferences.notificationsEnabled) continue;

      // Determine time in user's timezone (default Europe/Madrid)
      const userTz = timezone || 'Europe/Madrid';
      let userTimeStr = '';
      let userDay = 0;
      try {
        const timeFormatter = new Intl.DateTimeFormat('ca-ES', { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: false });
        userTimeStr = timeFormatter.format(now);
        const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: userTz, weekday: 'short' });
        const dayStr = dayFormatter.format(now);
        userDay = (dayStr === 'Sun') ? 0 : (dayStr === 'Sat') ? 6 : 1; // 0=Sun, 6=Sat, 1=Weekday
      } catch (e) {
        userTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        userDay = now.getDay();
      }

      // Check days filter
      if (preferences.daysMode === 'weekdays' && (userDay === 0 || userDay === 6)) continue;
      if (preferences.daysMode === 'weekends' && userDay !== 0 && userDay !== 6) continue;

      // Check scheduled times:
      // Match if current time is within +/- 5 minutes of a schedule time
      const [curH, curM] = userTimeStr.split(':').map(Number);
      const curTotalMins = curH * 60 + curM;

      const matchingSchedules = (preferences.schedules || []).filter(sched => {
        if (!sched.enabled || !sched.time) return false;
        const [sH, sM] = sched.time.split(':').map(Number);
        const schedTotalMins = sH * 60 + sM;
        const diff = Math.abs(curTotalMins - schedTotalMins);
        return diff <= 5; // within 5 min window
      });

      if (matchingSchedules.length === 0) continue;

      // Collect target stations for these matching schedules
      const targetStationIds = new Set();
      matchingSchedules.forEach(sched => {
        if (Array.isArray(sched.stationIds) && sched.stationIds.length > 0) {
          sched.stationIds.forEach(id => targetStationIds.add(Number(id)));
        }
      });

      if (targetStationIds.size === 0) continue;

      for (const stId of targetStationIds) {
        const station = stationMap.get(stId);
        if (!station) continue;

        const bikes = station.free_bikes ?? 0;
        const slots = station.empty_slots ?? 0;

        // Apply low bikes / low slots thresholds if configured
        if (preferences.alertOnlyIfLowBikes && bikes > (preferences.minBikesThreshold || 3)) continue;
        if (preferences.alertOnlyIfLowSlots && slots > (preferences.minSlotsThreshold || 3)) continue;

        const payload = JSON.stringify({
          title: `Girocleta | ${station.name}`,
          body: `🚲 ${bikes} bicis disponibles\n🅿️ ${slots} llocs lliures`,
          tag: `girocleta-st-${stId}`,
          data: { stationId: stId, url: `./?station=${stId}` }
        });

        try {
          await webpush.sendNotification(subscription, payload);
          sentCount++;
        } catch (pushErr) {
          console.warn('Push delivery failed for subscription:', pushErr.statusCode, pushErr.message);
          // If subscription has expired or is unsubscribed (404 or 410 Gone), remove it
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            await removeSubscription(subItem.endpoint);
          }
          failedCount++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      totalChecked: subscriptions.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error a /api/cron:', err);
    return res.status(500).json({ error: err.message });
  }
};
