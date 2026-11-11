CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`rating` integer NOT NULL,
	`comments` text NOT NULL,
	`consent_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_created_at_idx` ON `feedback` (`created_at`);--> statement-breakpoint
CREATE TABLE `submission_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
