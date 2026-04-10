const sendTicketStatusUpdate = (option) => {
  const statusColors = {
    'Read': '#3b82f6',
    'Resolved': '#10b981',
    'Pending': '#f59e0b'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Ticket Status Update</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body { background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 40px; color: #333333; line-height: 1.6; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; color: #ffffff; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    .ticket-details { background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .ticket-details p { margin: 5px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Travelhomes Support</h1>
    </div>
    <div class="content">
      <h2>Hello ${option.name},</h2>
      <p>The status of your support ticket has been updated.</p>
      
      <div class="status-badge" style="background-color: ${statusColors[option.status] || '#000000'};">
        Status: ${option.status}
      </div>

      <div class="ticket-details">
        <p><strong>Ticket ID:</strong> ${option.ticketId}</p>
        <p><strong>Subject:</strong> ${option.subject}</p>
      </div>

      <p>Our team has processed your request. If you have any further questions, please feel free to reach out to us.</p>
      
      <p>Thank you,<br><strong>Travelhomes Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Travelhomes. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { sendTicketStatusUpdate };
