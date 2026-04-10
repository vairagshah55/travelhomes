
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class InvoiceGenerator {
  
  /**
   * Generate PDF invoice for booking
   * @param {Object} bookingData - Complete booking information with user and service details
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateInvoice(bookingData) {
    let browser;
    
    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(bookingData);
      
      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }
      });
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generating PDF invoice:', error);
      throw new Error('Failed to generate invoice PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate HTML content for invoice
   * @param {Object} bookingData - Booking data with user and service details
   * @returns {string} HTML content
   */
  generateInvoiceHTML(bookingData) {
    const {
      booking,
      user,
      service,
      serviceType
    } = bookingData;

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const calculateDays = () => {
      if (booking.startDate && booking.endDate) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
      }
      return 1;
    };

    const days = calculateDays();
    const baseAmount = booking.totalAmount;
    const taxRate = 0.1; // 10% tax
    const taxAmount = baseAmount * taxRate;
    const totalAmount = baseAmount + taxAmount;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Invoice - ${booking.bookingNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #fff;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #007bff;
            }
            
            .company-info h1 {
                color: #007bff;
                font-size: 28px;
                margin-bottom: 5px;
            }
            
            .company-info p {
                color: #666;
                font-size: 14px;
            }
            
            .invoice-details {
                text-align: right;
            }
            
            .invoice-details h2 {
                font-size: 24px;
                color: #333;
                margin-bottom: 10px;
            }
            
            .invoice-details p {
                margin: 5px 0;
                font-size: 14px;
            }
            
            .billing-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                gap: 40px;
            }
            
            .billing-info {
                flex: 1;
            }
            
            .billing-info h3 {
                color: #007bff;
                font-size: 16px;
                margin-bottom: 15px;
                border-bottom: 2px solid #007bff;
                padding-bottom: 5px;
            }
            
            .billing-info p {
                margin: 8px 0;
                font-size: 14px;
            }
            
            .booking-details {
                margin-bottom: 30px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }
            
            .booking-details h3 {
                color: #007bff;
                font-size: 18px;
                margin-bottom: 15px;
            }
            
            .booking-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .booking-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .booking-item:last-child {
                border-bottom: none;
            }
            
            .booking-item strong {
                color: #333;
            }
            
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .invoice-table th {
                background: #007bff;
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
            }
            
            .invoice-table td {
                padding: 15px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .invoice-table tr:nth-child(even) {
                background: #f8f9fa;
            }
            
            .total-section {
                margin-left: auto;
                width: 300px;
                margin-bottom: 30px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .total-row.final {
                border-top: 2px solid #007bff;
                border-bottom: 2px solid #007bff;
                font-weight: bold;
                font-size: 18px;
                color: #007bff;
                margin-top: 10px;
            }
            
            .payment-info {
                background: #e7f3ff;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border: 1px solid #b3d9ff;
            }
            
            .payment-info h3 {
                color: #0056b3;
                margin-bottom: 15px;
            }
            
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #666;
                font-size: 12px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .status-confirmed {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .status-pending {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            @media print {
                .invoice-container {
                    box-shadow: none;
                    border: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
                <div class="company-info">
                    <h1>Travel Dashboard</h1>
                    <p>Your Premium Travel Experience Partner</p>
                    <p>📧 support@traveldashboard.com | 📞 +1 (555) 123-4567</p>
                </div>
                <div class="invoice-details">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${booking.bookingNumber}</p>
                    <p><strong>Date:</strong> ${formatDate(new Date())}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status.toUpperCase()}</span></p>
                </div>
            </div>

            <!-- Billing Information -->
            <div class="billing-section">
                <div class="billing-info">
                    <h3>Bill To:</h3>
                    <p><strong>${user.name || user.fullname || 'Guest User'}</strong></p>
                    <p>📧 ${user.email}</p>
                    <p>📞 ${user.phone || 'Not provided'}</p>
                </div>
                <div class="billing-info">
                    <h3>Service Provider:</h3>
                    <p><strong>Travel Dashboard Inc.</strong></p>
                    <p>123 Travel Street</p>
                    <p>Adventure City, AC 12345</p>
                    <p>📧 billing@traveldashboard.com</p>
                </div>
            </div>

            <!-- Booking Details -->
            <div class="booking-details">
                <h3>📋 Booking Information</h3>
                <div class="booking-grid">
                    <div class="booking-item">
                        <span>Service Type:</span>
                        <strong>${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</strong>
                    </div>
                    <div class="booking-item">
                        <span>Service Name:</span>
                        <strong>${service.name || service.title || 'Service'}</strong>
                    </div>
                    <div class="booking-item">
                        <span>Check-in Date:</span>
                        <strong>${formatDate(booking.startDate)}</strong>
                    </div>
                    <div class="booking-item">
                        <span>Check-out Date:</span>
                        <strong>${formatDate(booking.endDate)}</strong>
                    </div>
                    <div class="booking-item">
                        <span>Duration:</span>
                        <strong>${days} day${days > 1 ? 's' : ''}</strong>
                    </div>
                    <div class="booking-item">
                        <span>Guests:</span>
                        <strong>${booking.guests} guest${booking.guests > 1 ? 's' : ''}</strong>
                    </div>
                </div>
            </div>

            <!-- Invoice Items -->
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Duration</th>
                        <th>Guests</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${service.name || service.title || 'Travel Service'}</strong><br>
                            <small>${service.description || 'Premium travel experience'}</small>
                        </td>
                        <td>${days} day${days > 1 ? 's' : ''}</td>
                        <td>${booking.guests}</td>
                        <td>${formatCurrency(baseAmount / days)}</td>
                        <td>${formatCurrency(baseAmount)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Total Section -->
            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(baseAmount)}</span>
                </div>
                <div class="total-row">
                    <span>Tax (10%):</span>
                    <span>${formatCurrency(taxAmount)}</span>
                </div>
                <div class="total-row final">
                    <span>Total Amount:</span>
                    <span>${formatCurrency(totalAmount)}</span>
                </div>
            </div>

            <!-- Payment Information -->
            <div class="payment-info">
                <h3>💳 Payment Information</h3>
                <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
                <p><strong>Payment Status:</strong> ${booking.status === 'confirmed' ? 'Paid' : 'Pending'}</p>
                ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Thank you for choosing Travel Dashboard!</strong></p>
                <p>For any questions about this invoice, please contact us at support@traveldashboard.com</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
                <p style="margin-top: 15px;">Generated on ${formatDate(new Date())} | Invoice #${booking.bookingNumber}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Save invoice to file system
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} bookingNumber - Booking number for filename
   * @returns {Promise<string>} File path
   */
  async saveInvoiceToFile(pdfBuffer, bookingNumber) {
    try {
      const invoicesDir = path.join(process.cwd(), 'invoices');
      
      // Create invoices directory if it doesn't exist
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      
      const fileName = `invoice-${bookingNumber}-${Date.now()}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      
      fs.writeFileSync(filePath, pdfBuffer);
      
      return filePath;
    } catch (error) {
      console.error('Error saving invoice file:', error);
      throw new Error('Failed to save invoice file');
    }
  }
}

module.exports