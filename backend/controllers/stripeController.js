const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

// Create Stripe Checkout Session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, planType } = req.body;
    const userId = req.user._id;

    // Validate price ID
    const validPriceIds = [
      process.env.STRIPE_MONTHLY_PRICE_ID,
      process.env.STRIPE_YEARLY_PRICE_ID,
    ];

    if (!validPriceIds.includes(priceId)) {
      return res.status(400).json({ message: "Invalid price ID" });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has an active subscription
    if (user.isPremium && user.premiumExpiresAt > new Date()) {
      return res.status(400).json({
        message: "You already have an active premium subscription",
        isPremium: true,
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;

      // Save customer ID to user
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        userId: user._id.toString(),
        planType:
          planType ||
          (priceId === process.env.STRIPE_MONTHLY_PRICE_ID
            ? "monthly"
            : "yearly"),
      },
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// Create Customer Portal Session
exports.createPortalSession = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        message: "No Stripe customer found. Please subscribe first.",
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating portal session:", error);
    res.status(500).json({
      message: "Failed to create portal session",
      error: error.message,
    });
  }
};

// Get subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      "isPremium premiumExpiresAt stripeCustomerId stripeSubscriptionId"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let subscriptionDetails = null;

    // If user has a subscription ID, fetch details from Stripe
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId
        );

        subscriptionDetails = {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000)
            : null,
          planInterval: subscription.items.data[0]?.price?.recurring?.interval,
          cancellationReason: subscription.cancellation_details?.reason || null,
        };
      } catch (error) {
        console.error("Error fetching subscription from Stripe:", error);
      }
    }

    res.status(200).json({
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      hasStripeCustomer: !!user.stripeCustomerId,
      hasActiveSubscription: !!user.stripeSubscriptionId,
      subscription: subscriptionDetails,
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    res.status(500).json({
      message: "Failed to get subscription status",
      error: error.message,
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        message: "No active subscription found",
      });
    }

    // Cancel the subscription at period end (user keeps access until then)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    res.status(200).json({
      message:
        "Subscription will be cancelled at the end of the billing period",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};

// Reactivate subscription
exports.reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        message: "No subscription found to reactivate",
      });
    }

    // Get current subscription status
    const currentSubscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    // Check if subscription is scheduled for cancellation
    if (
      !currentSubscription.cancel_at_period_end &&
      !currentSubscription.cancel_at
    ) {
      return res.status(400).json({
        message: "Subscription is not scheduled for cancellation",
      });
    }

    // Reactivate the subscription by removing the cancellation
    // Note: Only pass cancel_at_period_end, not both parameters
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    res.status(200).json({
      message: "Subscription reactivated successfully",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({
      message: "Failed to reactivate subscription",
      error: error.message,
    });
  }
};
