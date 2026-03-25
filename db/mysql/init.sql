-- ===============================================
-- ESQUEMA DE PAGILA PARA MYSQL 8.0 (por compatibilidad)
-- Solo tablas participantes en la sincronizacion
-- Tablas IN + OUT 
-- ===============================================

SET FOREIGN_KEY_CHECKS = 0;

-- TABLAS IN (MASTER -> SLAVE)

CREATE TABLE IF NOT EXISTS language (
  language_id   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          CHAR(20)         NOT NULL,
  last_update   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS country (
  country_id    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  country       VARCHAR(50)       NOT NULL,
  last_update   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS city (
  city_id       SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city          VARCHAR(50)       NOT NULL,
  country_id    SMALLINT UNSIGNED NOT NULL,
  last_update   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (city_id),
  CONSTRAINT fk_city_country FOREIGN KEY (country_id) REFERENCES country (country_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS address (
  address_id    SMALLINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  address       VARCHAR(50)        NOT NULL,
  address2      VARCHAR(50)        DEFAULT NULL,
  district      VARCHAR(20)        NOT NULL,
  city_id       SMALLINT UNSIGNED  NOT NULL,
  postal_code   VARCHAR(10)        DEFAULT NULL,
  phone         VARCHAR(20)        NOT NULL,
  last_update   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (address_id),
  CONSTRAINT fk_address_city FOREIGN KEY (city_id) REFERENCES city (city_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actor (
  actor_id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name    VARCHAR(45)       NOT NULL,
  last_name     VARCHAR(45)       NOT NULL,
  last_update   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS category (
  category_id   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(25)      NOT NULL,
  last_update   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS film (
  film_id              SMALLINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  title                VARCHAR(255)        NOT NULL,
  description          TEXT                DEFAULT NULL,
  release_year         YEAR                DEFAULT NULL,
  language_id          TINYINT UNSIGNED    NOT NULL,
  original_language_id TINYINT UNSIGNED    DEFAULT NULL,
  rental_duration      TINYINT UNSIGNED    NOT NULL DEFAULT 3,
  rental_rate          DECIMAL(4,2)        NOT NULL DEFAULT 4.99,
  length               SMALLINT UNSIGNED   DEFAULT NULL,
  replacement_cost     DECIMAL(5,2)        NOT NULL DEFAULT 19.99,
  rating               ENUM('G','PG','PG-13','R','NC-17') DEFAULT 'G',
  special_features     JSON                DEFAULT NULL,
  last_update          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (film_id),
  CONSTRAINT fk_film_language FOREIGN KEY (language_id) REFERENCES language (language_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS film_actor (
  actor_id    SMALLINT UNSIGNED NOT NULL,
  film_id     SMALLINT UNSIGNED NOT NULL,
  last_update DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (actor_id, film_id),
  CONSTRAINT fk_film_actor_actor FOREIGN KEY (actor_id) REFERENCES actor (actor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_film_actor_film  FOREIGN KEY (film_id)  REFERENCES film (film_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS film_category (
  film_id     SMALLINT UNSIGNED NOT NULL,
  category_id TINYINT UNSIGNED  NOT NULL,
  last_update DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (film_id, category_id),
  CONSTRAINT fk_film_category_film     FOREIGN KEY (film_id)     REFERENCES film (film_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_film_category_category FOREIGN KEY (category_id) REFERENCES category (category_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store (
  store_id         TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  manager_staff_id TINYINT UNSIGNED  NOT NULL,
  address_id       SMALLINT UNSIGNED NOT NULL,
  last_update      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id),
  CONSTRAINT fk_store_address FOREIGN KEY (address_id) REFERENCES address (address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLA staff con tamaños aumentados
CREATE TABLE IF NOT EXISTS staff (
  staff_id    TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  first_name  VARCHAR(45)       NOT NULL,
  last_name   VARCHAR(45)       NOT NULL,
  address_id  SMALLINT UNSIGNED NOT NULL,
  email       VARCHAR(100)      DEFAULT NULL,          -- aumentado a 100
  store_id    TINYINT UNSIGNED  NOT NULL,
  active      TINYINT(1)        NOT NULL DEFAULT 1,
  username    VARCHAR(50)       NOT NULL,              -- aumentado a 50
  password    VARCHAR(100)      DEFAULT NULL,          -- aumentado a 100
  last_update DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  picture     BLOB              DEFAULT NULL,
  PRIMARY KEY (staff_id),
  CONSTRAINT fk_staff_address FOREIGN KEY (address_id) REFERENCES address (address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_staff_store   FOREIGN KEY (store_id)   REFERENCES store (store_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE store
  ADD CONSTRAINT fk_store_staff FOREIGN KEY (manager_staff_id)
    REFERENCES staff (staff_id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS inventory (
  inventory_id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
  film_id      SMALLINT UNSIGNED  NOT NULL,
  store_id     TINYINT UNSIGNED   NOT NULL,
  last_update  DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (inventory_id),
  CONSTRAINT fk_inventory_film  FOREIGN KEY (film_id)  REFERENCES film (film_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_store FOREIGN KEY (store_id) REFERENCES store (store_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLAS OUT (SLAVE -> MASTER)

CREATE TABLE IF NOT EXISTS customer (
  customer_id SMALLINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  store_id    TINYINT UNSIGNED   NOT NULL,
  first_name  VARCHAR(45)        NOT NULL,
  last_name   VARCHAR(45)        NOT NULL,
  email       VARCHAR(50)        DEFAULT NULL,
  address_id  SMALLINT UNSIGNED  NOT NULL,
  active      TINYINT(1)         NOT NULL DEFAULT 1,
  create_date DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_update DATETIME           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  CONSTRAINT fk_customer_address FOREIGN KEY (address_id) REFERENCES address (address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_customer_store   FOREIGN KEY (store_id)   REFERENCES store (store_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rental (
  rental_id    INT               NOT NULL AUTO_INCREMENT,
  rental_date  DATETIME          NOT NULL,
  inventory_id MEDIUMINT UNSIGNED NOT NULL,
  customer_id  SMALLINT UNSIGNED  NOT NULL,
  return_date  DATETIME           DEFAULT NULL,
  staff_id     TINYINT UNSIGNED   NOT NULL,
  last_update  DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (rental_id),
  CONSTRAINT fk_rental_customer  FOREIGN KEY (customer_id)  REFERENCES customer (customer_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rental_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rental_staff     FOREIGN KEY (staff_id)     REFERENCES staff (staff_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment (
  payment_id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id  SMALLINT UNSIGNED NOT NULL,
  staff_id     TINYINT UNSIGNED  NOT NULL,
  rental_id    INT               DEFAULT NULL,
  amount       DECIMAL(5,2)      NOT NULL,
  payment_date DATETIME          NOT NULL,
  last_update  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_payment_rental   FOREIGN KEY (rental_id)   REFERENCES rental (rental_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_payment_staff    FOREIGN KEY (staff_id)    REFERENCES staff (staff_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SHADOW TABLES (sin cambios, se mantienen igual)
CREATE TABLE IF NOT EXISTS customer_log (
  log_id       INT          NOT NULL AUTO_INCREMENT,
  operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  operated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_id  SMALLINT UNSIGNED,
  store_id     TINYINT UNSIGNED,
  first_name   VARCHAR(45),
  last_name    VARCHAR(45),
  email        VARCHAR(50),
  address_id   SMALLINT UNSIGNED,
  active       TINYINT(1),
  create_date  DATETIME,
  last_update  DATETIME,
  synced       TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rental_log (
  log_id       INT           NOT NULL AUTO_INCREMENT,
  operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  operated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rental_id    INT,
  rental_date  DATETIME,
  inventory_id MEDIUMINT UNSIGNED,
  customer_id  SMALLINT UNSIGNED,
  return_date  DATETIME,
  staff_id     TINYINT UNSIGNED,
  last_update  DATETIME,
  synced       TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_log (
  log_id        INT           NOT NULL AUTO_INCREMENT,
  operation     ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  operated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_id    SMALLINT UNSIGNED,
  customer_id   SMALLINT UNSIGNED,
  staff_id      TINYINT UNSIGNED,
  rental_id     INT,
  amount        DECIMAL(5,2),
  payment_date  DATETIME,
  last_update   DATETIME,
  synced        TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;