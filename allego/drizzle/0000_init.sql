CREATE TYPE "public"."activity_level" AS ENUM('sedentaire', 'leger', 'modere', 'actif');--> statement-breakpoint
CREATE TYPE "public"."meal" AS ENUM('petit_dejeuner', 'dejeuner', 'diner', 'collation');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('mensuel', 'annuel');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('femme', 'homme');--> statement-breakpoint
CREATE TABLE "activity_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"duration_min" integer NOT NULL,
	"calories_burned" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"meal" "meal" NOT NULL,
	"name" text NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" integer,
	"carbs_g" integer,
	"fat_g" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"paypal_subscription_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"paid_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paypal_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"sex" "sex" NOT NULL,
	"birth_date" date NOT NULL,
	"height_cm" integer NOT NULL,
	"start_weight_kg" numeric(5, 1) NOT NULL,
	"target_weight_kg" numeric(5, 1) NOT NULL,
	"activity_level" "activity_level" NOT NULL,
	"weekly_goal_kg" numeric(3, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paypal_subscription_id" text NOT NULL,
	"plan" "plan" NOT NULL,
	"status" text NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_paypal_subscription_id_unique" UNIQUE("paypal_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"health_consent_at" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_entries" ADD CONSTRAINT "activity_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_entries_user_date" ON "activity_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "food_entries_user_date" ON "food_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "subscriptions_user" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entries_user_date" ON "weight_entries" USING btree ("user_id","date");