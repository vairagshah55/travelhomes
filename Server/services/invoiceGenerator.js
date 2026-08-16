const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const env = require('../config/env');
const logger = require('../shared/logger');

/**
 * Shared headless browser.
 *
 * Every invoice used to `puppeteer.launch()` its own Chromium and close it
 * again — roughly 1-2s of startup and ~300MB RSS per invoice, paid inline
 * inside the booking request. One instance is launched lazily on first use and
 * reused; only the page is per-invoice.
 */
let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      .then((browser) => {
        // If Chromium dies (OOM-killed, crashed), drop the cached promise so the
        // next invoice launches a fresh one instead of reusing a dead handle.
        browser.on('disconnected', () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

/** Close the shared browser — for graceful shutdown and tests. */
async function closeBrowser() {
  if (!browserPromise) return;
  const pending = browserPromise;
  browserPromise = null;
  try {
    const browser = await pending;
    await browser.close();
  } catch {
    /* already gone */
  }
}

class InvoiceGenerator {

  /**
   * Generate PDF invoice for booking
   * @param {Object} bookingData - Complete booking information with user and service details
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateInvoice(bookingData) {
    let page;

    try {
      const browser = await getBrowser();
      page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(bookingData);

      // The document is fully self-contained (inline CSS, no remote assets), so
      // there is no network to idle on — `networkidle0` just added a fixed
      // ~500ms wait to every invoice.
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

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
      logger.error({ err: error.message }, 'invoice PDF generation failed');
      throw new Error('Failed to generate invoice PDF');
    } finally {
      // Close the page, not the browser — the browser is shared.
      if (page) await page.close().catch(() => {});
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

    // Every price in this product is rupees. Formatting them as USD printed a
    // dollar sign on invoices that customers were being charged INR for.
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(Number(amount) || 0);
    };

    // Callers have handed this a Booking document whose field is
    // `bookingStatus`, leaving `status` undefined — and an unguarded
    // .toUpperCase() on it threw, so no invoice ever rendered.
    const status = String(booking.status || 'confirmed');

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

    /**
     * The invoice total must equal what the customer was actually charged.
     *
     * This used to take `booking.totalAmount` as a subtotal, add a hardcoded
     * 10% "tax", and print the sum as the Total — so the invoice claimed a
     * figure 10% higher than the payment the customer actually made, against a
     * tax line the platform never levied or collected. Nothing else in the
     * codebase computes tax, and the Payment record stores the charged amount
     * only.
     *
     * If GST does need to appear here it has to come from real per-booking
     * numbers (rate depends on the service type and tariff slab), not a
     * constant — so the fabricated line is gone rather than guessed at.
     */
    const totalAmount = Number(booking.totalAmount) || 0;

    // Company identity — configured, not hardcoded. See COMPANY_* in config/env.js.
    const company = {
      name: env.COMPANY_NAME,
      address: env.COMPANY_ADDRESS || '',
      email: env.COMPANY_EMAIL || env.EMAIL_SENDER || '',
      phone: env.COMPANY_PHONE || '',
      gstin: env.COMPANY_GSTIN || '',
    };

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
                    <h1>${company.name}</h1>
                    <p>Your Premium Travel Experience Partner</p>
                    <p>${[company.email && `📧 ${company.email}`, company.phone && `📞 ${company.phone}`].filter(Boolean).join(' | ')}</p>
                </div>
                <div class="invoice-details">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${booking.bookingNumber}</p>
                    <p><strong>Date:</strong> ${formatDate(new Date())}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${status}">${status.toUpperCase()}</span></p>
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
                    <p><strong>${company.name}</strong></p>
                    ${company.address ? `<p>${company.address}</p>` : ''}
                    ${company.email ? `<p>📧 ${company.email}</p>` : ''}
                    ${company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ''}
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
                        <td>${formatCurrency(totalAmount / days)}</td>
                        <td>${formatCurrency(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Total Section -->
            <div class="total-section">
                <div class="total-row final">
                    <span>Total Amount:</span>
                    <span>${formatCurrency(totalAmount)}</span>
                </div>
            </div>

            <!-- Payment Information -->
            <div class="payment-info">
                <h3>💳 Payment Information</h3>
                <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
                <p><strong>Payment Status:</strong> ${status === 'confirmed' ? 'Paid' : 'Pending'}</p>
                ${booking.specialRequests ? `<p><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Thank you for choosing ${company.name}!</strong></p>
                ${company.email ? `<p>For any questions about this invoice, please contact us at ${company.email}</p>` : ''}
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

/**
 * This line was a bare `module.exports` — an expression statement, not an
 * assignment — so the module exported the default empty object. Every caller
 * did `new InvoiceGenerator()`, got "InvoiceGenerator is not a constructor",
 * and swallowed it in a try/catch: booking confirmation emails went out with no
 * invoice attached and the only trace was a log line.
 */
module.exports = InvoiceGenerator;
module.exports.InvoiceGenerator = InvoiceGenerator;
module.exports.closeBrowser = closeBrowser;