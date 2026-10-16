// Email templates for order notifications
// These generate HTML email bodies

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:    'Order Received',
  confirmed:  'Order Confirmed',
  processing: 'Being Prepared',
  ready:      'Ready for Collection',
  delivered:  'Order Delivered',
  cancelled:  'Order Cancelled',
  refunded:   'Order Refunded',
}

export const ORDER_STATUS_MESSAGES: Record<string, string> = {
  pending:    'We\'ve received your order and will confirm it shortly.',
  confirmed:  'Great news! Your order has been confirmed and we\'re preparing it.',
  processing: 'Your order is being carefully prepared by our team.',
  ready:      'Your order is ready! Come collect it at your chosen branch.',
  delivered:  'Your order has been delivered. We hope you love everything!',
  cancelled:  'Your order has been cancelled. If you have questions, please contact us.',
  refunded:   'Your refund has been processed. Please allow 3-5 business days.',
}

export function orderConfirmationTemplate(params: {
  customerName: string
  orderNumber: string
  items: { name: string; variantName: string; quantity: number; price: number }[]
  subtotal: number
  deliveryFee: number
  discount: number
  processingFee?: number
  total: number
  fulfillment: string
  deliveryAddress?: string
  branchName?: string
}): { subject: string; html: string } {
  const itemsHtml = params.items.map((item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #F2EDE8; font-family: 'Jost', sans-serif; font-size: 14px; color: #2C2420;">
        ${item.name} — ${item.variantName} × ${item.quantity}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #F2EDE8; text-align: right; font-family: Georgia, serif; font-size: 15px; color: #2C2420;">
        GHS ${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const fulfillmentInfo = params.fulfillment === 'delivery'
    ? `<p style="font-family: 'Jost', sans-serif; font-size: 14px; color: #8C7B74; margin: 4px 0;">Delivery to: ${params.deliveryAddress}</p>`
    : `<p style="font-family: 'Jost', sans-serif; font-size: 14px; color: #8C7B74; margin: 4px 0;">Pickup at: ${params.branchName}</p>`

  return {
    subject: `Order Confirmed — ${params.orderNumber} | Discount Beauty Barr`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #FAF7F4; font-family: sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="background: #2C2420; padding: 24px; text-align: center; border-radius: 4px 4px 0 0;">
      <h1 style="font-family: Georgia, 'Times New Roman', serif; font-weight: 300; font-size: 24px; color: white; margin: 0;">
        Discount Beauty Barr<span style="color: #E8B4A0;">.</span>
      </h1>
      <p style="font-family: sans-serif; font-size: 11px; color: rgba(255,255,255,0.5); margin: 4px 0 0; letter-spacing: 0.1em; text-transform: uppercase;">
        Order Confirmation
      </p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 28px; border: 1px solid #E8DDD4; border-top: none;">
      <p style="font-family: Georgia, serif; font-size: 20px; color: #2C2420; margin: 0 0 6px;">
        Thank you, ${params.customerName}! 🌸
      </p>
      <p style="font-family: sans-serif; font-size: 14px; color: #8C7B74; margin: 0 0 24px; line-height: 1.6;">
        We've received your order and will be in touch shortly. Here's a summary of what you ordered.
      </p>

      <!-- Order number -->
      <div style="background: #FAF7F4; border: 1px solid #E8DDD4; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="font-family: sans-serif; font-size: 12px; color: #8C7B74; margin: 0;">Order Number</p>
        <p style="font-family: Georgia, serif; font-size: 18px; color: #2C2420; margin: 2px 0 0; font-weight: bold;">${params.orderNumber}</p>
      </div>

      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        ${itemsHtml}
      </table>

      <!-- Totals -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="font-family: sans-serif; font-size: 13px; color: #8C7B74; padding: 4px 0;">Subtotal</td><td style="text-align: right; font-family: sans-serif; font-size: 13px; color: #2C2420; padding: 4px 0;">GHS ${params.subtotal.toFixed(2)}</td></tr>
        ${params.discount > 0 ? `<tr><td style="font-family: sans-serif; font-size: 13px; color: #16A34A; padding: 4px 0;">Discount</td><td style="text-align: right; font-family: sans-serif; font-size: 13px; color: #16A34A; padding: 4px 0;">-GHS ${params.discount.toFixed(2)}</td></tr>` : ''}
        <tr><td style="font-family: sans-serif; font-size: 13px; color: #8C7B74; padding: 4px 0;">Delivery</td><td style="text-align: right; font-family: sans-serif; font-size: 13px; color: #2C2420; padding: 4px 0;">${params.deliveryFee === 0 ? 'Free' : `GHS ${params.deliveryFee.toFixed(2)}`}</td></tr>
        ${(params.processingFee ?? 0) > 0 ? `<tr><td style="font-family: sans-serif; font-size: 13px; color: #8C7B74; padding: 4px 0;">Card / MoMo processing fee (1.95%)</td><td style="text-align: right; font-family: sans-serif; font-size: 13px; color: #2C2420; padding: 4px 0;">GHS ${(params.processingFee ?? 0).toFixed(2)}</td></tr>` : ''}
        <tr style="border-top: 1px solid #E8DDD4;"><td style="font-family: Georgia, serif; font-size: 17px; color: #2C2420; padding: 8px 0 0;">Total</td><td style="text-align: right; font-family: Georgia, serif; font-size: 19px; color: #2C2420; padding: 8px 0 0; font-weight: bold;">GHS ${params.total.toFixed(2)}</td></tr>
      </table>

      <!-- Fulfillment -->
      <div style="background: #F2EDE8; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="font-family: sans-serif; font-size: 12px; color: #B76E79; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.08em;">${params.fulfillment === 'delivery' ? 'Delivery Details' : 'Pickup Details'}</p>
        ${fulfillmentInfo}
      </div>

      <p style="font-family: sans-serif; font-size: 13px; color: #8C7B74; line-height: 1.7; margin: 0;">
        We'll send you another email when your order status is updated. If you have any questions, reply to this email or WhatsApp us.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 16px; text-align: center;">
      <p style="font-family: sans-serif; font-size: 11px; color: #C4B8B2; margin: 0;">
        Discount Beauty Barr · Osu & East Legon, Accra, Ghana<br>
        hello@discountbeautybarr.com
      </p>
    </div>
  </div>
</body>
</html>
    `,
  }
}

export function orderStatusUpdateTemplate(params: {
  customerName: string
  orderNumber: string
  status: string
  message?: string
}): { subject: string; html: string } {
  const statusLabel = ORDER_STATUS_LABELS[params.status] ?? params.status
  const statusMessage = params.message ?? ORDER_STATUS_MESSAGES[params.status] ?? ''

  return {
    subject: `Your Order Update — ${statusLabel} | ${params.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #FAF7F4;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
    <div style="background: #2C2420; padding: 24px; text-align: center; border-radius: 4px 4px 0 0;">
      <h1 style="font-family: Georgia, serif; font-weight: 300; font-size: 22px; color: white; margin: 0;">Discount Beauty Barr<span style="color: #E8B4A0;">.</span></h1>
    </div>
    <div style="background: white; padding: 28px; border: 1px solid #E8DDD4; border-top: none;">
      <p style="font-family: Georgia, serif; font-size: 20px; color: #2C2420; margin: 0 0 6px;">Hi ${params.customerName}!</p>
      <p style="font-family: sans-serif; font-size: 14px; color: #8C7B74; margin: 0 0 20px;">Your order has been updated.</p>

      <div style="background: #FDF5F6; border: 1px solid #F2CFC3; padding: 16px; border-radius: 4px; text-align: center; margin-bottom: 20px;">
        <p style="font-family: sans-serif; font-size: 11px; color: #B76E79; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.1em;">Order Status</p>
        <p style="font-family: Georgia, serif; font-size: 22px; color: #2C2420; margin: 0; font-weight: bold;">${statusLabel}</p>
        <p style="font-family: sans-serif; font-size: 11px; color: #8C7B74; margin: 6px 0 0;">${params.orderNumber}</p>
      </div>

      <p style="font-family: sans-serif; font-size: 14px; color: #8C7B74; line-height: 1.7; margin: 0;">
        ${statusMessage}
      </p>
    </div>
    <div style="padding: 16px; text-align: center;">
      <p style="font-family: sans-serif; font-size: 11px; color: #C4B8B2; margin: 0;">Discount Beauty Barr · Accra, Ghana</p>
    </div>
  </div>
</body>
</html>
    `,
  }
}
