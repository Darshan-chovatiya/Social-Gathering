const Notification = require('../models/Notification');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { sendNotification, sendToMultiple } = require('../utils/firebase');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Send notification to a specific user
 */
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, message, metadata } = req.body;
    const senderId = req.user._id;

    if (!userId || !title || !message) {
      return sendError(res, 'User ID, title and message are required', 400);
    }

    const receiver = await User.findById(userId);
    if (!receiver) {
      return sendError(res, 'Receiver not found', 404);
    }

    const notification = new Notification({
      title,
      message,
      type: 'individual',
      senderId,
      receiverId: userId,
      metadata
    });

    await notification.save();

    // Send FCM if token exists
    if (receiver.fcmToken) {
      try {
        await sendNotification(receiver.fcmToken, title, message, metadata);
      } catch (fcmError) {
        console.error('FCM error:', fcmError.message);
      }
    }

    return sendSuccess(res, 'Notification sent successfully', { notification }, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Send notification to all customers of a specific event
 */
exports.sendToEventCustomers = async (req, res) => {
  try {
    const { eventId, title, message, metadata } = req.body;
    const senderId = req.user._id;

    if (!eventId || !title || !message) {
      return sendError(res, 'Event ID, title and message are required', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    // Verify if the sender is the organizer of the event
    if (event.organizer.organizerId.toString() !== senderId.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to send notifications for this event', 403);
    }

    // Find all users who booked this event
    const bookings = await Booking.find({ eventId, paymentStatus: 'success' }).distinct('userId');
    const customers = await User.find({ _id: { $in: bookings } });

    const notifications = customers.map(customer => ({
      title,
      message,
      type: 'event',
      senderId,
      receiverId: customer._id,
      eventId,
      metadata
    }));

    await Notification.insertMany(notifications);

    // Send FCM to all customers with tokens
    const fcmTokens = customers.filter(c => c.fcmToken).map(c => c.fcmToken);
    if (fcmTokens.length > 0) {
      try {
        await sendToMultiple(fcmTokens, title, message, metadata);
      } catch (fcmError) {
        console.error('FCM Multicast error:', fcmError.message);
      }
    }

    return sendSuccess(res, `Notification sent to ${customers.length} customers`, { count: customers.length });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Send notification to ALL customers (broadcast)
 * If sender is Organizer: Sends to all users who have booked ANY of their events
 * If sender is Admin: Sends to all users in the database
 */
exports.sendToAllCustomers = async (req, res) => {
  try {
    const { title, message, metadata } = req.body;
    const senderId = req.user._id;

    if (!title || !message) {
      return sendError(res, 'Title and message are required', 400);
    }

    let customerIds = [];

    if (req.user.role === 'admin') {
      // Admin sends to everyone
      customerIds = await User.find({ role: 'user' }).distinct('_id');
    } else {
      // Organizer sends to all their event customers
      const myEvents = await Event.find({ 'organizer.organizerId': senderId }).distinct('_id');
      customerIds = await Booking.find({ eventId: { $in: myEvents }, paymentStatus: 'success' }).distinct('userId');
    }

    const customers = await User.find({ _id: { $in: customerIds } });

    const notifications = customers.map(customer => ({
      title,
      message,
      type: 'broadcast',
      senderId,
      receiverId: customer._id,
      metadata
    }));

    await Notification.insertMany(notifications);

    // Send FCM to all customers with tokens
    const fcmTokens = customers.filter(c => c.fcmToken).map(c => c.fcmToken);
    if (fcmTokens.length > 0) {
      try {
        await sendToMultiple(fcmTokens, title, message, metadata);
      } catch (fcmError) {
        console.error('FCM Broadcast error:', fcmError.message);
      }
    }

    return sendSuccess(res, `Notification broadcasted to ${customers.length} customers`, { count: customers.length });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get notifications for the logged in user
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ receiverId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return sendSuccess(res, 'Notifications fetched successfully', { notifications });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, receiverId: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    return sendSuccess(res, 'Notification marked as read', { notification });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { receiverId: userId, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res, 'All notifications marked as read');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Update FCM Token for the user
 */
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return sendError(res, 'FCM Token is required', 400);
    }

    await User.findByIdAndUpdate(userId, { fcmToken });

    return sendSuccess(res, 'FCM Token updated successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get sent notifications (for organizers/admins)
 */
exports.getSentNotifications = async (req, res) => {
  try {
    const senderId = req.user._id;
    const notifications = await Notification.find({ senderId })
      .populate('receiverId', 'name mobile email')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Sent notifications fetched successfully', { notifications });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ 
      receiverId: userId, 
      isRead: false 
    });

    return sendSuccess(res, 'Unread count fetched successfully', { unreadCount: count });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get all reachable customers for the sender
 */
exports.getAllPortalCustomers = async (req, res) => {
  try {
    let customers;
    if (req.user.role === 'admin') {
      // Admin sees all customers
      customers = await User.find({ role: 'user' }).select('name mobile email');
    } else {
      // Organizer sees customers who have booked their events
      const senderId = req.user._id;
      const myEvents = await Event.find({ 'organizer.organizerId': senderId }).distinct('_id');
      const customerIds = await Booking.find({ 
        eventId: { $in: myEvents }, 
        paymentStatus: 'success' 
      }).distinct('userId');
      customers = await User.find({ _id: { $in: customerIds } }).select('name mobile email');
    }

    return sendSuccess(res, 'Customers fetched successfully', { customers });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

