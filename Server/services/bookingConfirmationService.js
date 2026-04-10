const nodemailer = require('nodemailer');
const { generateInvoice } = require('./invoiceGenerator');
const fs = require('fs').promises;
const path = require('path');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email template for booking confirmation
const generateBookingConfirmationEmail = (bookingData, serviceData = {}) => {
  const {
    bookingId,
    clientName,
    serviceName,
    checkInDate,
    checkOutDate,
    totalAmount,
    numberOfGuests,
    clientEmail
  } = bookingData;

  const {
    brandName,
    location,
    amenities = [],
    contactInfo = {}
  } = serviceData;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
                font-size: 28px;
            }
            .booking-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
                font-weight: bold;
                font-size: 18px;
                color: #007bff;
            }
            .amenities {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .amenity-tag {
                background: #007bff;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
            }
            .contact-info {
                background: #e9ecef;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
                <p>Thank you for choosing our services</p>
            </div>
            
            <p>Dear ${clientName},</p>
            
            <p>We're excited to confirm your booking! Your ${serviceName} reservation has been successfully processed.</p>
            
            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <div class="detail-row">
                    <span>Booking ID:</span>
                    <span><strong>${bookingId}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Service:</span>
                    <span>${brandName || serviceName}</span>
                </div>
                <div class="detail-row">
                    <span>Location:</span>
                    <span>${location || 'TBD'}</span>
                </div>
                <div class="detail-row">
                    <span>Check-in Date:</span>
                    <span>${formatDate(checkInDate)}</span>
                </div>
                <div class="detail-row">
                    <span>Check-out Date:</span>
                    <span>${formatDate(checkOutDate)}</span>
                </div>
                <div class="detail-row">
                    <span>Number of Guests:</span>
                    <span>${numberOfGuests}</span>
                </div>
                <div class="detail-row">
                    <span>Total Amount:</span>
                    <span>$${totalAmount}</span>
                </div>
            </div>
            
            ${amenities && amenities.length > 0 ? `
            <div class="booking-details">
                <h3>✨ Amenities Included</h3>
                <div class="amenities">
                    ${amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            ${(contactInfo?.phone || contactInfo?.email) ? `
            <div class="contact-info">
                <h3>📞 Contact Information</h3>
                ${contactInfo.phone ? `<p><strong>Phone:</strong> ${contactInfo.phone}</p>` : ''}
                ${contactInfo.email ? `<p><strong>Email:</strong> ${contactInfo.email}</p>` : ''}
            </div>
            ` : ''}
            
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>Please arrive 15 minutes before your scheduled check-in time</li>
                <li>Bring a valid ID for verification</li>
                <li>Your invoice is attached to this email for your records</li>
                <li>For any changes or cancellations, please contact us at least 24 hours in advance</li>
            </ul>
            
            <div class="footer">
                <p>Thank you for choosing our services!</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p><small>This is an automated confirmation email. Please do not reply directly to this email.</small></p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Main function to send booking confirmation with invoice
const sendBookingConfirmation = async (bookingData, serviceData) => {
  try {
    console.log('Starting booking confirmation process for booking:', bookingData.bookingId);

    // Generate invoice PDF
    const invoiceData = {
      bookingId: bookingData.bookingId,
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      serviceName: bookingData.serviceName,
      brandName: serviceData?.brandName || bookingData.serviceName,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      numberOfGuests: bookingData.numberOfGuests,
      baseAmount: bookingData.baseAmount || bookingData.totalAmount,
      extraItems: bookingData.extraItems || [],
      totalAmount: bookingData.totalAmount,
      bookingDate: bookingData.createdAt || new Date(),
      location: serviceData?.location || 'TBD'
    };

    console.log('Generating invoice PDF...');
    const invoicePath = await generateInvoice(invoiceData);
    console.log('Invoice generated at:', invoicePath);

    // Generate email HTML content
    const emailHtml = generateBookingConfirmationEmail(bookingData, serviceData);

    // Email options
    const mailOptions = {
      from: {
        name: 'Travel Dashboard',
        address: process.env.EMAIL_USER
      },
      to: bookingData.clientEmail,
      subject: `Booking Confirmation - ${bookingData.bookingId} | ${bookingData.serviceName}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Invoice_${bookingData.bookingId}.pdf`,
          path: invoicePath,
          contentType: 'application/pdf'
        }
      ]
    };

    // Send email
    console.log('Sending confirmation email to:', bookingData.clientEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    // Clean up temporary invoice file (optional)
    // await fs.unlink(invoicePath);

    return {
      success: true,
      messageId: info.messageId,
      invoicePath: invoicePath,
      message: 'Booking confirmation sent successfully with invoice attachment'
    };

  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send booking confirmation'
    };
  }
};

// Function to verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send emails');
    return true;
  } catch (error) {
    console.error('Email server verification failed:', error);
    return false;
  }
};

// Function to send test email
const sendTestEmail = async (testEmail = 'test@example.com') => {
  try {
    const testBookingData = {
      bookingId: 'BK123456',
      clientName: 'John Doe',
      clientEmail: testEmail,
      serviceName: 'activity',
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      numberOfGuests: 2,
      totalAmount: 150.00,
      baseAmount: 120.00,
      extraItems: [
        { name: 'Airport Pickup', price: 15, quantity: 1 },
        { name: 'Breakfast', price: 15, quantity: 2 }
      ],
      createdAt: new Date()
    };

    const testServiceData = {
      brandName: 'Fun Activities & Adventures',
      location: 'Goa, India',
      amenities: ['Free WiFi', 'Guided Tours'],
      contactInfo: { phone: '+91-1234567890', email: 'info@funadventures.com' }
    };

    return await sendBookingConfirmation(testBookingData, testServiceData);
  } catch (error) {
    console.error('Test email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation,
  generateBookingConfirmationEmail,
  verifyEmailConfig,
  sendTestEmail
};