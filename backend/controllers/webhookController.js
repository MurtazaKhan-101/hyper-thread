const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

// Webhook handler for Stripe events
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log("Checkout session completed:", session.id);

  const userId = session.metadata.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId) {
    console.error("No userId in session metadata");
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId);
      return;
    }

    // Update user with Stripe customer ID and subscription ID
    user.stripeCustomerId = customerId;
    user.stripeSubscriptionId = subscriptionId;

    // Get subscription details to set expiration
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Use current_period_end, or fallback to billing_cycle_anchor + interval
      let periodEnd;

      if (subscription.current_period_end) {
        periodEnd = new Date(subscription.current_period_end * 1000);
      } else if (subscription.billing_cycle_anchor) {
        // Fallback: calculate based on billing cycle
        const interval =
          subscription.items?.data?.[0]?.price?.recurring?.interval;
        const billingStart = new Date(subscription.billing_cycle_anchor * 1000);

        if (interval === "year") {
          periodEnd = new Date(billingStart);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          // Default to monthly
          periodEnd = new Date(billingStart);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
      }

      if (periodEnd && !isNaN(periodEnd.getTime())) {
        user.isPremium = true;
        user.premiumExpiresAt = periodEnd;
        user.subscriptionStatus = subscription.status || "active";
      } else {
        console.error("Could not determine subscription period end");
        // Still set premium status even if we can't determine expiry
        user.isPremium = true;
        user.subscriptionStatus = subscription.status || "active";
      }
    }

    await user.save();
    console.log(`User ${userId} upgraded to premium`);
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  console.log("Subscription created:", subscription.id);

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Use current_period_end, or fallback to billing_cycle_anchor + interval
    let periodEnd;

    if (subscription.current_period_end) {
      periodEnd = new Date(subscription.current_period_end * 1000);
    } else if (subscription.billing_cycle_anchor) {
      // Fallback: calculate based on billing cycle
      const interval =
        subscription.items?.data?.[0]?.price?.recurring?.interval;
      const billingStart = new Date(subscription.billing_cycle_anchor * 1000);

      if (interval === "year") {
        periodEnd = new Date(billingStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        // Default to monthly
        periodEnd = new Date(billingStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
    }

    if (!periodEnd || isNaN(periodEnd.getTime())) {
      console.error("Could not determine subscription period end");
      // Still set premium status
      user.isPremium = true;
      user.subscriptionStatus = subscription.status || "active";
    } else {
      user.isPremium = true;
      user.premiumExpiresAt = periodEnd;
      user.subscriptionStatus = subscription.status || "active";
    }

    user.stripeSubscriptionId = subscriptionId;
    await user.save();
    console.log(
      `Subscription ${subscriptionId} activated for user ${user._id}`
    );
  } catch (error) {
    console.error("Error in handleSubscriptionCreated:", error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Get current_period_end from subscription items (it's inside items.data[0])
    let periodEndTimestamp = subscription.current_period_end;

    // Fallback: check inside items.data if not found at root level
    if (
      !periodEndTimestamp &&
      subscription.items?.data?.[0]?.current_period_end
    ) {
      periodEndTimestamp = subscription.items.data[0].current_period_end;
      console.log(
        `Using current_period_end from items.data: ${periodEndTimestamp}`
      );
    }

    if (!periodEndTimestamp) {
      console.error("No current_period_end in subscription:", subscriptionId);
      return;
    }

    const periodEnd = new Date(periodEndTimestamp * 1000);

    if (isNaN(periodEnd.getTime())) {
      console.error("Invalid period end date:", periodEndTimestamp);
      return;
    }

    // Update subscription status
    user.subscriptionStatus = subscription.status;

    // Check if subscription is scheduled for cancellation
    const isCancelled =
      subscription.cancel_at || subscription.cancel_at_period_end;
    const cancelDate = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : periodEnd;

    // Check if subscription was reactivated (previously cancelled, now not cancelled)
    const wasReactivated =
      user.premiumExpiresAt &&
      user.isPremium &&
      !isCancelled &&
      subscription.status === "active";

    // Handle different subscription statuses
    if (
      subscription.status === "active" ||
      subscription.status === "trialing"
    ) {
      user.isPremium = true;
      user.premiumExpiresAt = periodEnd;

      // Send reactivation confirmation if subscription was reactivated
      if (wasReactivated) {
        const emailService = require("../services/emailService");
        await emailService.sendSubscriptionReactivatedEmail(user, periodEnd);
        console.log(
          `Subscription reactivated for user ${user._id}, access until ${periodEnd}`
        );
      }
      // Send cancellation notification email if subscription is scheduled to cancel
      else if (
        isCancelled &&
        subscription.cancellation_details?.reason === "cancellation_requested"
      ) {
        const emailService = require("../services/emailService");
        await emailService.sendSubscriptionCancellationScheduledEmail(
          user,
          cancelDate
        );
        console.log(
          `Cancellation scheduled for user ${user._id} on ${cancelDate}`
        );
      }
    } else if (subscription.status === "past_due") {
      // Grace period - keep premium active while Stripe retries payment
      user.isPremium = true;
      user.premiumExpiresAt = periodEnd;
      console.log(
        `User ${user._id} subscription past_due - grace period active`
      );
    } else if (
      subscription.status === "canceled" ||
      subscription.status === "unpaid" ||
      subscription.status === "incomplete_expired"
    ) {
      // If subscription is canceled but still in current period, keep premium until expiry
      if (new Date() < periodEnd) {
        user.isPremium = true;
        user.premiumExpiresAt = periodEnd;
      } else {
        user.isPremium = false;
        user.premiumExpiresAt = null;
      }
    }

    user.stripeSubscriptionId = subscriptionId;
    await user.save();
    console.log(`Subscription ${subscriptionId} updated for user ${user._id}`);
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

  const customerId = subscription.customer;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Remove premium access
    user.isPremium = false;
    user.premiumExpiresAt = null;
    user.stripeSubscriptionId = null;
    user.subscriptionStatus = null;

    await user.save();
    console.log(`Premium access revoked for user ${user._id}`);

    // Send cancellation confirmation email
    const emailService = require("../services/emailService");
    const service = new emailService();
    await service.sendSubscriptionCancelledEmail(user);
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error);
  }
}

// Handle successful invoice payment (renewal)
async function handleInvoicePaymentSucceeded(invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Get updated subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get current_period_end from subscription items or root level
    let periodEndTimestamp = subscription.current_period_end;

    if (
      !periodEndTimestamp &&
      subscription.items?.data?.[0]?.current_period_end
    ) {
      periodEndTimestamp = subscription.items.data[0].current_period_end;
      console.log(
        `Using current_period_end from items.data: ${periodEndTimestamp}`
      );
    }

    if (!periodEndTimestamp) {
      console.error("No current_period_end in subscription:", subscriptionId);
      return;
    }

    const periodEnd = new Date(periodEndTimestamp * 1000);

    if (isNaN(periodEnd.getTime())) {
      console.error("Invalid period end date:", periodEndTimestamp);
      return;
    }

    user.isPremium = true;
    user.premiumExpiresAt = periodEnd;
    user.stripeSubscriptionId = subscriptionId;
    user.subscriptionStatus = subscription.status || "active";

    await user.save();
    console.log(`Subscription renewed for user ${user._id} until ${periodEnd}`);
  } catch (error) {
    console.error("Error in handleInvoicePaymentSucceeded:", error);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  console.log("Invoice payment failed:", invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  try {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Get subscription details
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update subscription status to past_due
      user.subscriptionStatus = subscription.status;
      await user.save();

      console.log(
        `Payment failed for user ${user._id} - Status: ${subscription.status}`
      );

      // Send email notification
      const emailService = require("../services/emailService");
      const service = new emailService();
      await service.sendPaymentFailedEmail(user, {
        amount: (invoice.amount_due / 100).toFixed(2),
        currency: invoice.currency.toUpperCase(),
        nextRetryDate: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
        attemptCount: invoice.attempt_count || 1,
      });
    }
  } catch (error) {
    console.error("Error in handleInvoicePaymentFailed:", error);
  }
}
