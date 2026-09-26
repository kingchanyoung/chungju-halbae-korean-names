CREATE TABLE `name_poll_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`voter_key_hash` text NOT NULL,
	`selected_name` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `name_polls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_name_poll_votes_poll_voter` ON `name_poll_votes` (`poll_id`,`voter_key_hash`);--> statement-breakpoint
CREATE TABLE `name_polls` (
	`id` text PRIMARY KEY NOT NULL,
	`source_result_id` text NOT NULL,
	`access_token_hash` text NOT NULL,
	`candidates_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`source_result_id`) REFERENCES `name_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_name_polls_source_result_id` ON `name_polls` (`source_result_id`);