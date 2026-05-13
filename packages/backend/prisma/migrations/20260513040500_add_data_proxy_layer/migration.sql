-- CreateTable
CREATE TABLE `proxy_apis` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL DEFAULT 'POST',
    `description` VARCHAR(191) NULL,
    `stored_procedure` VARCHAR(191) NOT NULL,
    `param_mappings` JSON NOT NULL,
    `require_auth` BOOLEAN NOT NULL DEFAULT true,
    `auth_type` VARCHAR(191) NOT NULL DEFAULT 'JWT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `proxy_apis_path_key`(`path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `key_hash` VARCHAR(191) NOT NULL,
    `key_prefix` VARCHAR(191) NOT NULL,
    `allowed_apis` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `expires_at` DATETIME(3) NULL,
    `last_used_at` DATETIME(3) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `api_keys_key_hash_key`(`key_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_call_logs` (
    `id` VARCHAR(191) NOT NULL,
    `api_id` VARCHAR(191) NOT NULL,
    `api_key_id` VARCHAR(191) NULL,
    `caller_ip` VARCHAR(191) NOT NULL,
    `request_body` JSON NULL,
    `response_code` INTEGER NOT NULL,
    `duration_ms` INTEGER NOT NULL,
    `error_msg` TEXT NULL,
    `called_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `api_call_logs_api_id_idx`(`api_id`),
    INDEX `api_call_logs_called_at_idx`(`called_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `api_call_logs` ADD CONSTRAINT `api_call_logs_api_id_fkey` FOREIGN KEY (`api_id`) REFERENCES `proxy_apis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_call_logs` ADD CONSTRAINT `api_call_logs_api_key_id_fkey` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
