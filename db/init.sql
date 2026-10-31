-- Схема БД проекта Orders & Products (MySQL 8). Открывается в MySQL Workbench: File → Open SQL Script,
-- а диаграмма строится через Database → Reverse Engineer.
-- Кодировку соединения задаём явно: иначе кириллица может сохраниться «кракозябрами» (зависит от клиента импорта).
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS orders_products CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE orders_products;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lat DECIMAL(9,6) NULL,
  lng DECIMAL(9,6) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number INT NOT NULL,
  is_new TINYINT(1) NOT NULL DEFAULT 1,
  photo VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  specification TEXT,
  guarantee_start DATETIME,
  guarantee_end DATETIME,
  order_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_type (type),
  CONSTRAINT fk_products_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  symbol CHAR(3) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_prices_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- Тестовые данные
INSERT INTO orders (id, title, description, lat, lng, created_at) VALUES
  (1, 'Длинное предлинное длиннючее название прихода', 'Основная поставка мониторов', 50.450100, 30.523400, '2017-04-06 12:09:33'),
  (2, 'Длинное название прихода', 'Периферия', 49.839700, 24.029700, '2017-09-06 12:09:33'),
  (3, 'Длинное предлинное название прихода', 'Мыши и мониторы', 46.482500, 30.723300, '2017-06-06 12:09:33');

INSERT INTO products (id, serial_number, is_new, photo, title, type, specification, guarantee_start, guarantee_end, order_id, created_at) VALUES
  (1, 12345678, 1, 'monitor.svg', 'Gigabyte Technology X58-USB3', 'Monitors', 'Specification 1', '2017-04-06 12:00:00', '2025-08-06 12:00:00', 1, '2017-06-29 12:09:33'),
  (2, 12345679, 1, 'monitor.svg', 'Dell U2415', 'Monitors', 'Specification 2', '2017-04-06 12:00:00', '2025-08-06 12:00:00', 1, '2017-06-29 12:09:33'),
  (3, 12345680, 0, 'keyboard.svg', 'Logitech MX Keys', 'Keyboards', 'Specification 3', '2017-04-06 12:00:00', '2025-08-06 12:00:00', 2, '2017-06-29 12:09:33'),
  (4, 12345681, 1, 'mouse.svg', 'Razer DeathAdder', 'Mice', 'Specification 4', '2017-04-06 12:00:00', '2025-08-06 12:00:00', 3, '2017-06-29 12:09:33'),
  (5, 12345682, 1, 'monitor.svg', 'Samsung Odyssey G5', 'Monitors', 'Specification 5', '2017-04-06 12:00:00', '2025-08-06 12:00:00', 3, '2017-06-29 12:09:33'),
  (6, 12345683, 0, 'monitor.svg', 'HP 24mh', 'Monitors', 'Specification 6', '2017-04-06 12:00:00', '2025-08-06 12:00:00', 2, '2017-06-29 12:09:33');

INSERT INTO prices (product_id, amount, symbol, is_default) VALUES
  (1, 100.00, 'USD', 0), (1, 2600.00, 'UAH', 1),
  (2, 250.00, 'USD', 0), (2, 6500.00, 'UAH', 1),
  (3, 90.00, 'USD', 0),  (3, 2340.00, 'UAH', 1),
  (4, 60.00, 'USD', 0),  (4, 1560.00, 'UAH', 1),
  (5, 320.00, 'USD', 0), (5, 8320.00, 'UAH', 1),
  (6, 140.00, 'USD', 0), (6, 3640.00, 'UAH', 1);
