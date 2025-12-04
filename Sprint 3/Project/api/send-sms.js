const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber, medicationName, dosage } = req.body;

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const message = await client.messages.create({
      body: `Medication Reminder: Time to take ${medicationName} (${dosage})`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    res.status(200).json({ success: true, messageSid: message.sid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send SMS' });
  }
}