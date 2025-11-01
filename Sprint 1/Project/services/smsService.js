const twilio = require('twilio');

// You'll need to get these from Twilio console (free account)
const TWILIO_ACCOUNT_SID = 'your_account_sid_here';
const TWILIO_AUTH_TOKEN = 'your_auth_token_here';
const TWILIO_PHONE_NUMBER = 'your_twilio_phone_number_here';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const sendMedicationReminder = async (phoneNumber, medicationName, dosage) => {
  try {
    const message = await client.messages.create({
      body: `Medication Reminder: Time to take ${medicationName} (${dosage})`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log('SMS sent:', message.sid);
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

export const scheduleMedicationSMS = (phoneNumber, medications) => {
  // This would need a server/cloud function to actually schedule
  // For now, just a placeholder
  console.log('Would schedule SMS for:', medications.length, 'medications');
};