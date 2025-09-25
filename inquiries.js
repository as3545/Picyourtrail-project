const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const Inquiry = require("../models/Inquiry");
const TourPackage = require("../models/TourPackage");
const { sendEmail } = require("../utils/mailer");

// Load environment variables for Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const ownerPhone = process.env.TWILIO_OWNER_PHONE_NUMBER;
const ownerEmail = process.env.OWNER_EMAIL;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// POST /api/inquiries
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, packageId, message } = req.body;

    // 1. Validate required fields
    if (!name || !email || !phone || !packageId || !message) {
      return res.status(400).json({
        error:
          "All fields are required: name, email, phone, packageId, message",
      });
    }

    // 2. Validate tour package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({ error: "Package not found" });
    }
    const packageTitle = tourPackage.title;

    // 3. Save inquiry to DB
    const newInquiry = new Inquiry({
      name,
      email,
      phone,
      packageId,
      message,
    });
    const savedInquiry = await newInquiry.save();
    await savedInquiry.populate("packageId", "title destination");

    // 4. Send email notifications
    try {
      // Owner email
      await sendEmail(
        ownerEmail,
        `New Inquiry for ${packageTitle}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">New Inquiry</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${packageTitle}</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">You’ve received a new inquiry</h2>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 25px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Message:</strong> ${message}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                © 2024 Tour Packages. All rights reserved.
              </p>
            </div>
          </div>
        </div>
        `
      );

      // User thank-you email
      await sendEmail(
        email,
        "Thank you for your inquiry!",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Tour Packages</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Inquiry Received</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for your interest in <strong>${packageTitle}</strong>. 
              We’ve received your request and will get back to you within 24 hours.
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              In the meantime, feel free to explore more of our travel packages.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                © 2024 Tour Packages. All rights reserved.
              </p>
            </div>
          </div>
        </div>
        `
      );
    } catch (emailError) {
      console.error("❌ Email Error:", emailError);
    }

    // 5. Send WhatsApp notifications
    try {
      // User confirmation
      const userConfirmationMessage = `Hello ${name},\n\nThank you for your inquiry about "${packageTitle}". We will get back to you shortly.`;
      const userMessage = await client.messages.create({
        body: userConfirmationMessage,
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${phone}`,
      });
      console.log("✅ User WhatsApp message sent. SID:", userMessage.sid);

      // Owner notification
      const ownerNotificationMessage = `New Inquiry for "${packageTitle}"\nFrom: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
      const ownerMessage = await client.messages.create({
        body: ownerNotificationMessage,
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${ownerPhone}`,
      });
      console.log("✅ Owner WhatsApp message sent. SID:", ownerMessage.sid);
    } catch (twilioError) {
      console.error("❌ Twilio WhatsApp Error:", twilioError.message);
    }

    // 6. Final response
    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      inquiry: savedInquiry,
    });
  } catch (error) {
    console.error("❌ Inquiry submission error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET all inquiries (admin only - for future use)
router.get("/", async (req, res) => {
  try {
    const { status, packageId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (packageId) filter.packageId = packageId;
    const inquiries = await Inquiry.find(filter)
      .populate("packageId", "title destination")
      .sort({ createdAt: -1 })
      .select("-__v");
    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// GET inquiry by ID (admin only - for future use)
router.get("/:id", async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate("packageId", "title destination")
      .select("-__v");
    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    res.json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    res.status(500).json({ error: "Failed to fetch inquiry" });
  }
});

// PUT update inquiry status (admin only - for future use)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["new", "contacted", "closed"].includes(status)) {
      return res.status(400).json({
        error: "Status must be one of: new, contacted, closed",
      });
    }
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("packageId", "title destination");
    if (!updatedInquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    res.json(updatedInquiry);
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    res.status(500).json({ error: "Failed to update inquiry status" });
  }
});

// DELETE inquiry (admin only - for future use)
router.delete("/:id", async (req, res) => {
  try {
    const deletedInquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!deletedInquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    res.json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    res.status(500).json({ error: "Failed to delete inquiry" });
  }
});

module.exports = router;
