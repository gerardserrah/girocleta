// Storage adapter for Push Subscriptions
// Supports Vercel KV / Upstash Redis REST API, GitHub repo file, and in-memory fallback.

let memoryStore = [];

async function getSubscriptions() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/girocleta_subs`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (err) {
      console.warn('Error reading from KV/Upstash:', err.message);
    }
  }

  // Fallback to GitHub file storage if GITHUB_TOKEN configured
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/data/subscriptions.json`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Girocleta-App'
        }
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        const content = Buffer.from(ghData.content, 'base64').toString('utf8');
        return JSON.parse(content);
      }
    } catch (ghErr) {
      console.warn('Error reading from GitHub storage:', ghErr.message);
    }
  }

  return memoryStore;
}

async function saveSubscription(newSubItem) {
  const list = await getSubscriptions();
  const existingIdx = list.findIndex(item => item.endpoint === newSubItem.endpoint);
  
  if (existingIdx >= 0) {
    list[existingIdx] = Object.assign({}, list[existingIdx], newSubItem);
  } else {
    list.push(newSubItem);
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/girocleta_subs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(list)
      });
      return true;
    } catch (err) {
      console.warn('Error saving to KV/Upstash:', err.message);
    }
  }

  memoryStore = list;
  return true;
}

async function removeSubscription(endpoint) {
  let list = await getSubscriptions();
  list = list.filter(item => item.endpoint !== endpoint);

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/girocleta_subs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(list)
      });
    } catch (err) {
      console.warn('Error updating KV/Upstash after removal:', err.message);
    }
  }

  memoryStore = list;
  return true;
}

module.exports = {
  getSubscriptions,
  saveSubscription,
  removeSubscription
};
