ALTER TABLE `images` ADD COLUMN `lifetime` DATETIME NOT NULL AFTER `size`;
UPDATE images SET lifetime = DATE_ADD(`date`,INTERVAL 5 MINUTE) WHERE md5 <> '';
