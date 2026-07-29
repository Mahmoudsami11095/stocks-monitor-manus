CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL DEFAULT 'MPCI',
	`date` timestamp NOT NULL,
	`open` varchar(20) NOT NULL,
	`high` varchar(20) NOT NULL,
	`low` varchar(20) NOT NULL,
	`close` varchar(20) NOT NULL,
	`volume` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL DEFAULT 'MPCI',
	`price` varchar(20) NOT NULL,
	`day_high` varchar(20),
	`day_low` varchar(20),
	`week_high_52` varchar(20),
	`week_low_52` varchar(20),
	`pe_ratio` varchar(20),
	`eps` varchar(20),
	`market_cap` varchar(50),
	`volume` varchar(20),
	`previous_close` varchar(20),
	`open` varchar(20),
	`bid_ask` varchar(50),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technical_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL DEFAULT 'MPCI',
	`ma_20` varchar(20),
	`ma_50` varchar(20),
	`rsi` varchar(20),
	`support` varchar(20),
	`resistance` varchar(20),
	`recommendation` enum('buy','sell','hold') NOT NULL DEFAULT 'hold',
	`entry_price` varchar(20),
	`exit_price` varchar(20),
	`fair_value_min` varchar(20),
	`fair_value_max` varchar(20),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technical_indicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL DEFAULT 'MPCI',
	`signal_type` enum('price_support_cross','price_resistance_cross','recommendation_change','significant_move') NOT NULL,
	`description` text,
	`price` varchar(20),
	`notification_sent` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trading_signals_id` PRIMARY KEY(`id`)
);
