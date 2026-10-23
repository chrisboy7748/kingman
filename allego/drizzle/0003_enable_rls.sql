-- Supabase expose automatiquement les tables du schéma public via son API REST.
-- Activer la sécurité par ligne sans aucune règle bloque cet accès pour tout le monde :
-- seule l'application, propriétaire des tables, peut les lire et les modifier.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weight_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "food_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "paypal_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;
