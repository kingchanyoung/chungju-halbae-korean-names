CREATE TABLE `beta_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`rating` integer NOT NULL,
	`selected_name` text,
	`comment` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_beta_feedback_created_at` ON `beta_feedback` (`created_at`);--> statement-breakpoint
CREATE TABLE `beta_rate_limits` (
	`visitor_key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_beta_rate_limits_reset_at` ON `beta_rate_limits` (`reset_at`);