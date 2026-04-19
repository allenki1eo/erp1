CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`password_hash` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`tin` text,
	`vrn` text,
	`country` text DEFAULT 'TZ' NOT NULL,
	`base_currency` text DEFAULT 'TZS' NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`logo_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `role` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_company` (
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`role_id` text,
	`is_default` integer DEFAULT false NOT NULL,
	`sales_target_monthly` integer DEFAULT 0,
	PRIMARY KEY(`user_id`, `company_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'RETAIL' NOT NULL,
	`tin` text,
	`vrn` text,
	`phone` text,
	`email` text,
	`address` text,
	`region` text,
	`route_id` text,
	`credit_limit` real DEFAULT 0,
	`payment_terms_days` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `excise_rate` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`product_class` text NOT NULL,
	`rate_per_litre` real,
	`rate_per_loa` real,
	`effective_from` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_category` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`product_class` text,
	`category_id` text,
	`uom` text DEFAULT 'PCS' NOT NULL,
	`pack_size` real,
	`units_per_case` integer,
	`abv` real,
	`excise_rate_id` text,
	`cost_price` real DEFAULT 0,
	`selling_price` real DEFAULT 0,
	`reorder_level` real DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `product_category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe_item` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`uom` text NOT NULL,
	`stage` text,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`version` text DEFAULT '1.0' NOT NULL,
	`expected_yield` real NOT NULL,
	`expected_abv` real,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `route` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`region` text,
	`assigned_rep_id` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`tin` text,
	`vrn` text,
	`phone` text,
	`email` text,
	`address` text,
	`payment_terms_days` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_code` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`rate` real NOT NULL,
	`type` text DEFAULT 'VAT' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `warehouse` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'MAIN' NOT NULL,
	`address` text,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bin_location` (
	`id` text PRIMARY KEY NOT NULL,
	`warehouse_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text,
	`zone` text,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stock_balance` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`product_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`qty` real DEFAULT 0 NOT NULL,
	`unit_cost` real DEFAULT 0,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_balance_company_id_product_id_warehouse_id_unique` ON `stock_balance` (`company_id`,`product_id`,`warehouse_id`);--> statement-breakpoint
CREATE TABLE `stock_batch` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`product_id` text NOT NULL,
	`lot_number` text NOT NULL,
	`batch_number` text,
	`warehouse_id` text NOT NULL,
	`bin_id` text,
	`qty_on_hand` real DEFAULT 0 NOT NULL,
	`qty_reserved` real DEFAULT 0 NOT NULL,
	`uom` text NOT NULL,
	`manufactured_on` integer,
	`expiry_date` integer,
	`unit_cost` real DEFAULT 0,
	`source` text DEFAULT 'PURCHASE' NOT NULL,
	`source_ref` text,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bin_id`) REFERENCES `bin_location`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`batch_id` text,
	`product_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`bin_id` text,
	`type` text NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`qty` real NOT NULL,
	`unit_cost` real,
	`notes` text,
	`transacted_by_id` text,
	`transacted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batch`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bin_id`) REFERENCES `bin_location`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transacted_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_take_line` (
	`id` text PRIMARY KEY NOT NULL,
	`stock_take_id` text NOT NULL,
	`product_id` text NOT NULL,
	`batch_id` text,
	`bin_id` text,
	`system_qty` real DEFAULT 0 NOT NULL,
	`counted_qty` real,
	`variance` real,
	`unit_cost` real DEFAULT 0,
	`variance_cost` real DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`stock_take_id`) REFERENCES `stock_take`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batch`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bin_id`) REFERENCES `bin_location`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_take` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`taken_at` integer NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`notes` text,
	`conducted_by_id` text,
	`confirmed_by_id` text,
	`confirmed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conducted_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_transfer_line` (
	`id` text PRIMARY KEY NOT NULL,
	`transfer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`batch_id` text,
	`from_bin_id` text,
	`to_bin_id` text,
	`qty` real NOT NULL,
	`unit_cost` real DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batch`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_bin_id`) REFERENCES `bin_location`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_bin_id`) REFERENCES `bin_location`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_transfer` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`from_warehouse_id` text NOT NULL,
	`to_warehouse_id` text NOT NULL,
	`transferred_at` integer,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`notes` text,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goods_receipt_line` (
	`id` text PRIMARY KEY NOT NULL,
	`grn_id` text NOT NULL,
	`po_line_id` text,
	`product_id` text NOT NULL,
	`qty_ordered` real DEFAULT 0,
	`qty_received` real NOT NULL,
	`qty_rejected` real DEFAULT 0 NOT NULL,
	`rejection_reason` text,
	`unit_cost` real NOT NULL,
	`lot_number` text,
	`batch_number` text,
	`manufactured_on` integer,
	`expiry_date` integer,
	`qc_passed` integer DEFAULT true NOT NULL,
	`notes` text,
	FOREIGN KEY (`grn_id`) REFERENCES `goods_receipt`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`po_line_id`) REFERENCES `purchase_order_line`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goods_receipt` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`po_id` text,
	`supplier_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`received_date` integer NOT NULL,
	`delivery_note_number` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`notes` text,
	`received_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_order_line` (
	`id` text PRIMARY KEY NOT NULL,
	`po_id` text NOT NULL,
	`requisition_line_id` text,
	`product_id` text NOT NULL,
	`description` text,
	`qty` real NOT NULL,
	`qty_received` real DEFAULT 0 NOT NULL,
	`unit_price` real NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requisition_line_id`) REFERENCES `purchase_requisition_line`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_order` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`requisition_id` text,
	`supplier_id` text NOT NULL,
	`warehouse_id` text,
	`order_date` integer NOT NULL,
	`expected_date` integer,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TZS' NOT NULL,
	`notes` text,
	`approved_by_id` text,
	`approved_at` integer,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requisition_id`) REFERENCES `purchase_requisition`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_requisition_line` (
	`id` text PRIMARY KEY NOT NULL,
	`requisition_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`qty` real NOT NULL,
	`uom` text DEFAULT 'PCS' NOT NULL,
	`estimated_unit_cost` real DEFAULT 0,
	`estimated_total` real DEFAULT 0,
	`notes` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	FOREIGN KEY (`requisition_id`) REFERENCES `purchase_requisition`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_requisition` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`requested_by_id` text,
	`requested_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`required_by_date` integer,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`approved_by_id` text,
	`approved_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_invoice_line` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost` real NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `supplier_invoice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`our_ref` text NOT NULL,
	`supplier_invoice_number` text,
	`supplier_id` text NOT NULL,
	`po_id` text,
	`grn_id` text,
	`invoice_date` integer NOT NULL,
	`due_date` integer,
	`status` text DEFAULT 'RECEIVED' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TZS' NOT NULL,
	`notes` text,
	`approved_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grn_id`) REFERENCES `goods_receipt`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_performance_log` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`po_id` text,
	`grn_id` text,
	`delivery_days_promised` integer,
	`delivery_days_actual` integer,
	`qty_ordered` real,
	`qty_received` real,
	`qty_rejected` real DEFAULT 0 NOT NULL,
	`on_time_delivery` integer,
	`quality_score` real,
	`notes` text,
	`recorded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grn_id`) REFERENCES `goods_receipt`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `aging_batch` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`barrel_id` text NOT NULL,
	`product_id` text NOT NULL,
	`fill_volume` real NOT NULL,
	`fill_abv` real NOT NULL,
	`filled_at` integer NOT NULL,
	`emptied_at` integer,
	`emptied_volume` real,
	`emptied_abv` real,
	`angels_share` real,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`barrel_id`) REFERENCES `barrel`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `barrel` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`capacity` real NOT NULL,
	`wood_type` text,
	`char_level` text,
	`fills_count` integer DEFAULT 0 NOT NULL,
	`warehouse_id` text,
	`status` text DEFAULT 'EMPTY' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bottling_run` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`run_number` text NOT NULL,
	`finished_product_id` text NOT NULL,
	`source_batch_id` text,
	`source_type` text,
	`planned_qty` real NOT NULL,
	`actual_qty` real,
	`uom` text DEFAULT 'PCS' NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`finished_product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `brew_material_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`brew_id` text NOT NULL,
	`product_id` text NOT NULL,
	`qty` real NOT NULL,
	`uom` text NOT NULL,
	`stage` text,
	FOREIGN KEY (`brew_id`) REFERENCES `brew`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `brew_measurement` (
	`id` text PRIMARY KEY NOT NULL,
	`brew_id` text NOT NULL,
	`stage` text NOT NULL,
	`measured_at` integer NOT NULL,
	`temperature` real,
	`gravity` real,
	`ph` real,
	`notes` text,
	`recorded_by_id` text,
	FOREIGN KEY (`brew_id`) REFERENCES `brew`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `brew` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`batch_number` text NOT NULL,
	`product_id` text NOT NULL,
	`recipe_id` text,
	`vessel_id` text,
	`planned_volume` real NOT NULL,
	`actual_volume` real,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`final_abv` real,
	`yield_percent` real,
	`brewmaster_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `distillation_cut` (
	`id` text PRIMARY KEY NOT NULL,
	`distillation_id` text NOT NULL,
	`cut_type` text NOT NULL,
	`volume` real NOT NULL,
	`abv` real NOT NULL,
	`loa` real,
	`destination` text,
	FOREIGN KEY (`distillation_id`) REFERENCES `distillation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `distillation` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`run_number` text NOT NULL,
	`product_id` text NOT NULL,
	`recipe_id` text,
	`still_id` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`feed_volume` real,
	`feed_abv` real,
	`total_output` real,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `batch_hold_event` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text,
	`nc_id` text,
	`previous_status` text,
	`new_status` text NOT NULL,
	`actioned_by_id` text,
	`actioned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `non_conformance` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`batch_id` text,
	`severity` text DEFAULT 'MINOR' NOT NULL,
	`description` text NOT NULL,
	`root_cause` text,
	`corrective_action` text,
	`disposition` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`raised_by_id` text,
	`raised_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`closed_by_id` text,
	`closed_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `qc_check_template` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`ref_type` text NOT NULL,
	`stage` text,
	`check_type` text NOT NULL,
	`product_class` text,
	`product_id` text,
	`unit` text,
	`min_spec` real,
	`max_spec` real,
	`mandatory` integer DEFAULT true NOT NULL,
	`hold_on_fail` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quality_check` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`template_id` text,
	`ref_type` text NOT NULL,
	`ref_id` text NOT NULL,
	`stage` text,
	`check_type` text NOT NULL,
	`measured_value` real,
	`unit` text,
	`min_spec` real,
	`max_spec` real,
	`result` text NOT NULL,
	`inspector_id` text,
	`notes` text,
	`checked_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `qc_check_template`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bonded_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`movement_type` text NOT NULL,
	`product_id` text NOT NULL,
	`product_class` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`destination_warehouse_id` text,
	`batch_id` text,
	`qty_litres` real NOT NULL,
	`abv` real,
	`loa` real,
	`rate_per_litre` real,
	`rate_per_loa` real,
	`excise_amount` real DEFAULT 0 NOT NULL,
	`vat_amount` real DEFAULT 0 NOT NULL,
	`reference` text,
	`moved_at` integer NOT NULL,
	`declaration_id` text,
	`status` text DEFAULT 'POSTED' NOT NULL,
	`notes` text,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `excise_declaration_line` (
	`id` text PRIMARY KEY NOT NULL,
	`declaration_id` text NOT NULL,
	`product_class` text NOT NULL,
	`product_id` text,
	`qty_litres` real DEFAULT 0 NOT NULL,
	`qty_loa` real DEFAULT 0 NOT NULL,
	`excise_amount` real DEFAULT 0 NOT NULL,
	`vat_amount` real DEFAULT 0 NOT NULL,
	`movement_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`declaration_id`) REFERENCES `excise_declaration`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `excise_declaration` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`period_label` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`total_litres` real DEFAULT 0 NOT NULL,
	`total_loa` real DEFAULT 0 NOT NULL,
	`total_excise` real DEFAULT 0 NOT NULL,
	`total_vat` real DEFAULT 0 NOT NULL,
	`submitted_at` integer,
	`paid_at` integer,
	`tra_reference` text,
	`notes` text,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tax_stamp_allocation` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`roll_id` text NOT NULL,
	`ref_type` text NOT NULL,
	`ref_id` text,
	`serial_from` text NOT NULL,
	`serial_to` text NOT NULL,
	`quantity` integer NOT NULL,
	`wasted_qty` integer DEFAULT 0 NOT NULL,
	`allocated_by_id` text,
	`allocated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roll_id`) REFERENCES `tax_stamp_roll`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`allocated_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tax_stamp_roll` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`roll_number` text NOT NULL,
	`stamp_type` text NOT NULL,
	`serial_from` text NOT NULL,
	`serial_to` text NOT NULL,
	`quantity` integer NOT NULL,
	`used_qty` integer DEFAULT 0 NOT NULL,
	`wasted_qty` integer DEFAULT 0 NOT NULL,
	`issued_at` integer,
	`received_at` integer,
	`warehouse_id` text,
	`status` text DEFAULT 'RECEIVED' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_visit` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`sales_rep_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`visited_at` integer NOT NULL,
	`outcome` text NOT NULL,
	`order_id` text,
	`latitude` real,
	`longitude` real,
	`notes` text,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sales_rep_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `sales_order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_payment` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`paid_at` integer NOT NULL,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`reference` text,
	`received_by_id` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`order_id` text,
	`customer_id` text NOT NULL,
	`sales_rep_id` text,
	`invoice_date` integer NOT NULL,
	`due_date` integer,
	`status` text DEFAULT 'UNPAID' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`excise_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TZS' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `sales_order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sales_rep_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_order_line` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`qty` real NOT NULL,
	`uom` text NOT NULL,
	`unit_price` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`excise_amount` real DEFAULT 0 NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `sales_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_order` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`sales_rep_id` text,
	`warehouse_id` text,
	`route_id` text,
	`order_date` integer NOT NULL,
	`delivery_date` integer,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`excise_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TZS' NOT NULL,
	`notes` text,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sales_rep_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`route_id`) REFERENCES `route`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_return` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`invoice_id` text,
	`customer_id` text NOT NULL,
	`return_date` integer NOT NULL,
	`reason` text,
	`total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`before` text,
	`after` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journal_line` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_id` text NOT NULL,
	`account_id` text NOT NULL,
	`debit` real DEFAULT 0 NOT NULL,
	`credit` real DEFAULT 0 NOT NULL,
	`description` text,
	FOREIGN KEY (`journal_id`) REFERENCES `journal_entry`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `ledger_account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `journal_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`entry_date` integer NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`description` text,
	`status` text DEFAULT 'POSTED' NOT NULL,
	`created_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `driver` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`user_id` text,
	`full_name` text NOT NULL,
	`phone` text,
	`national_id` text,
	`license_number` text NOT NULL,
	`license_class` text,
	`license_expiry` integer,
	`date_hired` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fuel_log` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`driver_id` text,
	`fuel_station_id` text,
	`station_type` text DEFAULT 'EXTERNAL' NOT NULL,
	`filled_at` integer NOT NULL,
	`station` text,
	`litres` real NOT NULL,
	`price_per_litre` real NOT NULL,
	`total_cost` real NOT NULL,
	`odometer` real NOT NULL,
	`is_full_tank` integer DEFAULT true NOT NULL,
	`receipt_number` text,
	`notes` text,
	`recorded_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fuel_station_id`) REFERENCES `fuel_station`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fuel_station` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'EXTERNAL' NOT NULL,
	`address` text,
	`fuel_type` text DEFAULT 'DIESEL' NOT NULL,
	`tank_capacity_litres` real,
	`current_volume_litres` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `maintenance_record` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`type` text DEFAULT 'ROUTINE' NOT NULL,
	`scheduled_for` integer,
	`performed_at` integer,
	`odometer_at` real,
	`description` text NOT NULL,
	`workshop` text,
	`mechanic` text,
	`parts_cost` real DEFAULT 0 NOT NULL,
	`labour_cost` real DEFAULT 0 NOT NULL,
	`total_cost` real DEFAULT 0 NOT NULL,
	`next_service_odometer` real,
	`next_service_date` integer,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spare_issue` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`spare_part_id` text NOT NULL,
	`vehicle_id` text,
	`maintenance_record_id` text,
	`qty` real NOT NULL,
	`unit_cost` real NOT NULL,
	`total_cost` real NOT NULL,
	`issued_at` integer NOT NULL,
	`issued_by_id` text,
	`notes` text,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spare_part_id`) REFERENCES `spare_part`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`maintenance_record_id`) REFERENCES `maintenance_record`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issued_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spare_part` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`part_number` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`uom` text DEFAULT 'PCS' NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`qty_on_hand` real DEFAULT 0 NOT NULL,
	`reorder_level` real DEFAULT 0 NOT NULL,
	`warehouse_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trip` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`driver_id` text,
	`purpose` text DEFAULT 'DELIVERY' NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`start_odometer` real,
	`end_odometer` real,
	`started_at` integer,
	`ended_at` integer,
	`origin` text,
	`destination` text,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`notes` text,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicle_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`driver_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicle_document` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`type` text NOT NULL,
	`number` text,
	`issuer` text,
	`issued_on` integer,
	`expires_on` integer,
	`file_url` text,
	`cost` real DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicle` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_company_id` text NOT NULL,
	`registration_number` text NOT NULL,
	`make` text NOT NULL,
	`model` text,
	`year` integer,
	`type` text DEFAULT 'TRUCK' NOT NULL,
	`category` text,
	`fuel_type` text DEFAULT 'DIESEL' NOT NULL,
	`tank_capacity_litres` real,
	`payload_capacity_kg` real,
	`home_warehouse_id` text,
	`current_odometer` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`acquired_on` integer,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`home_warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
