import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const PLAN_LIMITS: Record<string, { max_users: number; max_assets: number }> = {
  free: { max_users: 5, max_assets: 50 },
  pro: { max_users: 999999, max_assets: 999999 },
  enterprise: { max_users: 999999, max_assets: 999999 },
};

/**
 * Determine plan tier from the Stripe price/product.
 * Checks subscription item metadata for a `plan` key first,
 * then falls back to the product name (case-insensitive match).
 */
async function resolvePlanFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string> {
  // Check metadata on the subscription itself
  if (subscription.metadata?.plan) {
    return subscription.metadata.plan;
  }

  // Inspect the first subscription item
  const item = subscription.items?.data?.[0];
  if (!item) return "pro"; // safe default for paid

  // Check price metadata
  if (item.price?.metadata?.plan) {
    return item.price.metadata.plan;
  }

  // Check product name
  const productId =
    typeof item.price.product === "string"
      ? item.price.product
      : item.price.product?.id;

  if (productId) {
    const product = await stripe.products.retrieve(productId as string);
    const name = product.name?.toLowerCase() || "";
    if (name.includes("enterprise")) return "enterprise";
    if (name.includes("pro")) return "pro";
  }

  return "pro";
}

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    // ---- Handle events ----

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;

        if (!orgId) {
          console.warn("checkout.session.completed: missing org_id in metadata");
          break;
        }

        // Retrieve the full subscription to determine plan
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        let plan = "pro";
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          plan = await resolvePlanFromSubscription(stripe, subscription);
        }

        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.pro;

        const { error } = await supabase
          .from("organizations")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId || null,
            max_users: limits.max_users,
            max_assets: limits.max_assets,
            is_active: true,
          })
          .eq("id", orgId);

        if (error) {
          console.error("Failed to update org after checkout:", error);
        } else {
          console.log(`Org ${orgId} upgraded to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;

        if (!orgId) {
          // Try to find org by stripe_subscription_id
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (!org) {
            console.warn("subscription.updated: cannot find org for subscription", subscription.id);
            break;
          }

          const plan = await resolvePlanFromSubscription(stripe, subscription);
          const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.pro;

          await supabase
            .from("organizations")
            .update({
              plan,
              max_users: limits.max_users,
              max_assets: limits.max_assets,
              is_active: subscription.status === "active" || subscription.status === "trialing",
            })
            .eq("id", org.id);

          console.log(`Org ${org.id} subscription updated to ${plan}`);
          break;
        }

        const plan = await resolvePlanFromSubscription(stripe, subscription);
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.pro;

        const { error } = await supabase
          .from("organizations")
          .update({
            plan,
            max_users: limits.max_users,
            max_assets: limits.max_assets,
            is_active: subscription.status === "active" || subscription.status === "trialing",
          })
          .eq("id", orgId);

        if (error) {
          console.error("Failed to update org on subscription.updated:", error);
        } else {
          console.log(`Org ${orgId} subscription updated to ${plan}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;

        // Find the org either by metadata or by subscription ID
        let targetOrgId = orgId;
        if (!targetOrgId) {
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();
          targetOrgId = org?.id;
        }

        if (!targetOrgId) {
          console.warn("subscription.deleted: cannot find org for subscription", subscription.id);
          break;
        }

        const freeLimits = PLAN_LIMITS.free;

        const { error } = await supabase
          .from("organizations")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            max_users: freeLimits.max_users,
            max_assets: freeLimits.max_assets,
          })
          .eq("id", targetOrgId);

        if (error) {
          console.error("Failed to downgrade org on subscription.deleted:", error);
        } else {
          console.log(`Org ${targetOrgId} downgraded to free`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        console.warn(
          `Payment failed for customer ${customerId}, invoice ${invoice.id}. ` +
          `Amount: ${invoice.amount_due / 100} ${invoice.currency?.toUpperCase()}. ` +
          `Attempt: ${invoice.attempt_count}`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
