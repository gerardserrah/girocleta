const webpush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPqnGwoSmado1uPz-Ws-2jc2KvjYEbzIJ3fvyE76YrTzPQ3leE37sFoQQuI3PhqvoXe89ycyTsLWQ8iQDzcBiPA';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'HgBV3D7sqyAuworcAVJ9FwfujChb-QUohxsbCtoiNyo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:gerardserrah@gmail.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = {
  webpush,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT
};
