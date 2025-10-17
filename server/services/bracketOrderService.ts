import axios from 'axios';
import AlpacaAccount from '../models/AlpacaAccount';
import Order from '../models/Order';
import Position from '../models/Position';
import Trade from '../models/Trade';
import { decrypt } from '../utils/encryption';
import * as monitoringService from './monitoringService';

interface BracketOrderParams {
  symbol: string;
  quantity: number;
  takeProfit: number;
  stopLoss: number;
  side?: 'buy' | 'sell';
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
}

interface BracketOrderResponse {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status: string;
  extended_hours: boolean;
  legs?: BracketOrderResponse[];
  trail_percent?: string;
  trail_price?: string;
  hwm?: string;
}

/**
 * Submit a bracket order to Alpaca
 */
export async function submitBracketOrder(
  userId: string,
  params: BracketOrderParams
): Promise<BracketOrderResponse> {
  console.log(`[BracketOrder] Submitting bracket order for ${params.symbol}`);

  try {
    // Get user's Alpaca account
    const alpacaAccount = await AlpacaAccount.findOne({ userId });
    if (!alpacaAccount || !alpacaAccount.isConnected) {
      throw new Error('Alpaca account not connected');
    }

    // Decrypt API credentials
    const apiKey = decrypt(alpacaAccount.apiKey);
    const apiSecret = decrypt(alpacaAccount.secretKey);

    const baseUrl = alpacaAccount.isPaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    // Prepare bracket order request
    const orderRequest = {
      symbol: params.symbol,
      qty: params.quantity.toString(),
      side: params.side || 'buy',
      type: 'market',
      time_in_force: params.timeInForce || 'day',
      order_class: 'bracket',
      take_profit: {
        limit_price: params.takeProfit.toFixed(2),
      },
      stop_loss: {
        stop_price: params.stopLoss.toFixed(2),
      },
    };

    console.log('[BracketOrder] Order request:', JSON.stringify(orderRequest, null, 2));

    // Submit order to Alpaca
    const response = await axios.post(`${baseUrl}/v2/orders`, orderRequest, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type': 'application/json',
      },
    });

    const orderData: BracketOrderResponse = response.data;

    console.log(`[BracketOrder] Order submitted successfully. Order ID: ${orderData.id}`);

    // Save main order to database
    await Order.create({
      userId,
      alpacaOrderId: orderData.id,
      symbol: orderData.symbol,
      side: orderData.side,
      orderType: orderData.order_type,
      quantity: parseInt(orderData.qty),
      filledQuantity: parseInt(orderData.filled_qty || '0'),
      status: orderData.status,
      limitPrice: orderData.limit_price ? parseFloat(orderData.limit_price) : undefined,
      stopPrice: orderData.stop_price ? parseFloat(orderData.stop_price) : undefined,
      filledAvgPrice: orderData.filled_avg_price
        ? parseFloat(orderData.filled_avg_price)
        : undefined,
      submittedAt: new Date(orderData.submitted_at),
      filledAt: orderData.filled_at ? new Date(orderData.filled_at) : undefined,
    });

    // Log activity
    await monitoringService.createActivityLog(
      userId,
      'order_submitted',
      `Bracket order submitted for ${params.symbol}: ${params.quantity} shares @ Market with TP=$${params.takeProfit.toFixed(2)}, SL=$${params.stopLoss.toFixed(2)}`,
      { order: orderData },
      'info'
    );

    return orderData;
  } catch (error: any) {
    console.error('[BracketOrder] Error submitting order:', error.response?.data || error.message);

    // Log error activity
    await monitoringService.createActivityLog(
      userId,
      'order_failed',
      `Failed to submit bracket order for ${params.symbol}: ${error.response?.data?.message || error.message}`,
      { error: error.response?.data || error.message },
      'critical'
    ).catch((e) => console.error('Failed to log activity:', e));

    throw new Error(
      error.response?.data?.message || error.message || 'Failed to submit bracket order'
    );
  }
}

/**
 * Get order status from Alpaca
 */
export async function getOrderStatus(
  userId: string,
  orderId: string
): Promise<BracketOrderResponse> {
  try {
    const alpacaAccount = await AlpacaAccount.findOne({ userId });
    if (!alpacaAccount || !alpacaAccount.isConnected) {
      throw new Error('Alpaca account not connected');
    }

    const apiKey = decrypt(alpacaAccount.apiKey);
    const apiSecret = decrypt(alpacaAccount.secretKey);

    const baseUrl = alpacaAccount.isPaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    const response = await axios.get(`${baseUrl}/v2/orders/${orderId}`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('[BracketOrder] Error fetching order status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch order status');
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  userId: string,
  orderId: string
): Promise<void> {
  console.log(`[BracketOrder] Canceling order ${orderId}`);

  try {
    const alpacaAccount = await AlpacaAccount.findOne({ userId });
    if (!alpacaAccount || !alpacaAccount.isConnected) {
      throw new Error('Alpaca account not connected');
    }

    const apiKey = decrypt(alpacaAccount.apiKey);
    const apiSecret = decrypt(alpacaAccount.secretKey);

    const baseUrl = alpacaAccount.isPaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    await axios.delete(`${baseUrl}/v2/orders/${orderId}`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    });

    // Update order in database
    await Order.findOneAndUpdate(
      { alpacaOrderId: orderId },
      { status: 'canceled' }
    );

    // Log activity
    await monitoringService.createActivityLog(
      userId,
      'order_canceled',
      `Order ${orderId} canceled`,
      { orderId },
      'info'
    );

    console.log(`[BracketOrder] Order ${orderId} canceled successfully`);
  } catch (error: any) {
    console.error('[BracketOrder] Error canceling order:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to cancel order');
  }
}

/**
 * Sync order status and update database
 */
export async function syncOrderStatus(userId: string, orderId: string): Promise<void> {
  try {
    const orderStatus = await getOrderStatus(userId, orderId);

    // Update order in database
    await Order.findOneAndUpdate(
      { alpacaOrderId: orderId },
      {
        status: orderStatus.status,
        filledQuantity: parseInt(orderStatus.filled_qty || '0'),
        filledAvgPrice: orderStatus.filled_avg_price
          ? parseFloat(orderStatus.filled_avg_price)
          : undefined,
        filledAt: orderStatus.filled_at ? new Date(orderStatus.filled_at) : undefined,
      }
    );

    // If order is filled, create/update position
    if (orderStatus.status === 'filled' && orderStatus.filled_avg_price) {
      const filledPrice = parseFloat(orderStatus.filled_avg_price);
      const quantity = parseInt(orderStatus.qty);

      // Check if position already exists
      let position = await Position.findOne({
        userId,
        symbol: orderStatus.symbol,
        status: 'open',
      });

      if (position) {
        // Update existing position
        position.quantity += orderStatus.side === 'buy' ? quantity : -quantity;
        position.currentPrice = filledPrice;
        await position.save();
      } else if (orderStatus.side === 'buy') {
        // Create new position
        position = await Position.create({
          userId,
          symbol: orderStatus.symbol,
          quantity,
          entryPrice: filledPrice,
          currentPrice: filledPrice,
          stopLoss: orderStatus.legs?.find((leg) => leg.type === 'stop')?.stop_price
            ? parseFloat(orderStatus.legs.find((leg) => leg.type === 'stop')!.stop_price!)
            : undefined,
          takeProfit: orderStatus.legs?.find((leg) => leg.type === 'limit')?.limit_price
            ? parseFloat(orderStatus.legs.find((leg) => leg.type === 'limit')!.limit_price!)
            : undefined,
          status: 'open',
          exchange: 'ALPACA',
        });
      }

      console.log(`[BracketOrder] Position updated for ${orderStatus.symbol}`);
    }
  } catch (error: any) {
    console.error('[BracketOrder] Error syncing order status:', error);
    throw error;
  }
}
