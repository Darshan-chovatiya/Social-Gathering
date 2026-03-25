const axios = require('axios');
const config = require('../config/env');

/**
 * Cashfree Payment Gateway Utility
 */
class CashfreeService {
  constructor(credentials = {}) {
    this.appId = credentials.appId;
    this.secretKey = credentials.secretKey;
    // Decide Cashfree environment based on explicit payment mode,
    // falling back to NODE_ENV for backwards compatibility
    this.isProduction =
      (config.PAYMENT_MODE && config.PAYMENT_MODE === 'production') ||
      config.NODE_ENV === 'production';

    this.baseUrl = this.isProduction
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  /**
   * Create a payment order
   */
  async createOrder(orderData) {
    try {
      // Cashfree requires HTTPS return_url in production.
      // Allow explicit override via env or per-call orderData.returnUrl.
      let returnUrl =
        orderData.returnUrl ||
        config.CASHFREE_RETURN_URL ||
        `${config.FRONTEND_URL}/#/payment/verify?order_id={order_id}`;

      // If we are in production mode and the URL is not https, Cashfree will reject it.
      if (this.isProduction && returnUrl.startsWith('http://')) {
        // Try to force https scheme while keeping host/path, to avoid accidental http.
        returnUrl = returnUrl.replace('http://', 'https://');
      }

      const response = await axios.post(
        `${this.baseUrl}/orders`,
        {
          order_id: orderData.orderId,
          order_amount: orderData.amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: orderData.customerId,
            customer_email: orderData.customerEmail,
            customer_phone: orderData.customerPhone,
          },
          order_meta: {
            return_url: returnUrl,
          }
        },
        {
          headers: {
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': '2023-08-01',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Cashfree Create Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(orderId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        {
          headers: {
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': '2023-08-01',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Cashfree Verify Payment Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = CashfreeService;
