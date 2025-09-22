const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const Inquiry = require('../models/Inquiry');
const TourPackage = require('../models/TourPackage');

// Load environment variables for Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const ownerPhone = process.env.TWILIO_OWNER_PHONE_NUMBER;


// Initialize Twilio client
const client = twilio(accountSid, authToken);

// POST new inquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, packageId, message } = req.body;
    
    // 1. Validate required fields
    if (!name || !email || !phone || !packageId || !message) {
      return res.status(400).json({ 
        error: 'All fields are required: name, email, phone, packageId, message' 
      });
    }
    
    // 2. Validate that the tour package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    // 3. Save the new inquiry to the database
    const newInquiry = new Inquiry({
      name,
      email,
      phone,
      packageId,
      message
    });
    
    const savedInquiry = await newInquiry.save();
    
    // Populate package details for response
    await savedInquiry.populate('packageId', 'title destination');
    
    // 4. Send WhatsApp messages using a separate try/catch block
    try {
      const packageTitle = tourPackage.title; 
      
      // Send confirmation message to the user who submitted the form
      const userConfirmationMessage = `Hello ${name},\n\nThank you for your inquiry about "${packageTitle}". We will get back to you shortly.`;
      
      const userMessage = await client.messages.create({
        body: userConfirmationMessage,
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${phone}`
      });
      console.log('✅ User WhatsApp message sent. SID:', userMessage.sid);
      
      // Send the full inquiry details to the form owner
      const ownerNotificationMessage = `New Inquiry for "${packageTitle}"\nFrom: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
      
      const ownerMessage = await client.messages.create({
        body: ownerNotificationMessage,
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${ownerPhone}`
      });
      console.log('✅ Owner WhatsApp message sent. SID:', ownerMessage.sid);
      
    } catch (twilioError) {
      console.error('❌ Twilio WhatsApp Error:', twilioError.message);
      console.error('Twilio error code:', twilioError.code);
      console.error('Twilio error more info:', twilioError.moreInfo);
      
      // It's a good practice to log the error but still send a success response to the client
      // since the inquiry was successfully saved to the database.
    }
    
    // 5. Send success response back to the client
    res.status(201).json({
      message: 'Inquiry submitted successfully. Check your server console for message status.',
      inquiry: savedInquiry
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// GET all inquiries (admin only - for future use)
router.get('/', async (req, res) => {
  try {
    const { status, packageId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (packageId) filter.packageId = packageId;
    const inquiries = await Inquiry.find(filter)
      .populate('packageId', 'title destination')
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET inquiry by ID (admin only - for future use)
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('packageId', 'title destination')
      .select('-__v');
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

// PUT update inquiry status (admin only - for future use)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be one of: new, contacted, closed' 
      });
    }
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('packageId', 'title destination');
    if (!updatedInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json(updatedInquiry);
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// DELETE inquiry (admin only - for future use)
router.delete('/:id', async (req, res) => {
  try {
    const deletedInquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!deletedInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

module.exports = router;