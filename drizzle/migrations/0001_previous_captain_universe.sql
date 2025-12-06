ALTER TABLE `users` ADD `profile_picture` text;--> statement-breakpoint
CREATE UNIQUE INDEX `swipes_swiper_id_swiped_id_unique` ON `swipes` (`swiper_id`,`swiped_id`);