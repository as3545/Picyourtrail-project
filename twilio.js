const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
const ownerPhone = process.env.TWILIO_OWNER_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - Recipient phone number (E.164 format, e.g. +91800...)
 * @param {string} message - Message text
 * @returns {Promise<object>}
 */
const sendWhatsAppMessage = async (to, message) => {
  const res = await client.messages.create({
    from: fromNumber,
    to: `whatsapp:${ownerPhone}`,
    body: message,
  });

  return res;
};


module.exports = { sendWhatsAppMessage };
