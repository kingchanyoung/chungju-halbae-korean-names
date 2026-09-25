CREATE TABLE `name_results` (
	`id` text PRIMARY KEY NOT NULL,
	`access_token_hash` text NOT NULL,
	`original_name` text NOT NULL,
	`pronunciation_hint` text,
	`meaning_hint` text,
	`style` text NOT NULL,
	`candidates_json` text NOT NULL,
	`algorithm_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_name_results_expires_at` ON `name_results` (`expires_at`);