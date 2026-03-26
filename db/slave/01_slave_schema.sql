------
--  BD SLAVE: Una replica de Pagila pero para el MySQL
------

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
USE pagila_slave;

-- TABLAS IN (La que recibe del Master)

CREATE TABLE IF NOT EXISTS language (
    language_id   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          CHAR(20) NOT NULL,
    last_update   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actor (
    actor_id    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name  VARCHAR(45) NOT NULL,
    last_name   VARCHAR(45) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS category (
    category_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(25) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS film (
    film_id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    release_year     YEAR,
    language_id      TINYINT UNSIGNED NOT NULL,
    rental_duration  TINYINT UNSIGNED NOT NULL DEFAULT 3,
    rental_rate      DECIMAL(4,2) NOT NULL DEFAULT 4.99,
    length           SMALLINT UNSIGNED,
    replacement_cost DECIMAL(5,2) NOT NULL DEFAULT 19.99,
    rating           ENUM('G','PG','PG-13','R','NC-17') DEFAULT 'G',
    last_update      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (film_id),
    FOREIGN KEY (language_id) REFERENCES language(language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS film_actor (
    actor_id    SMALLINT UNSIGNED NOT NULL,
    film_id     SMALLINT UNSIGNED NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (actor_id, film_id),
    FOREIGN KEY (actor_id) REFERENCES actor(actor_id),
    FOREIGN KEY (film_id)  REFERENCES film(film_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS film_category (
    film_id     SMALLINT UNSIGNED NOT NULL,
    category_id TINYINT UNSIGNED NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (film_id, category_id),
    FOREIGN KEY (film_id)     REFERENCES film(film_id),
    FOREIGN KEY (category_id) REFERENCES category(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS country (
    country_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    country     VARCHAR(50) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS city (
    city_id     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    city        VARCHAR(50) NOT NULL,
    country_id  SMALLINT UNSIGNED NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (city_id),
    FOREIGN KEY (country_id) REFERENCES country(country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS address (
    address_id  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    address     VARCHAR(50) NOT NULL,
    address2    VARCHAR(50),
    district    VARCHAR(20) NOT NULL,
    city_id     SMALLINT UNSIGNED NOT NULL,
    postal_code VARCHAR(10),
    phone       VARCHAR(20) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id),
    FOREIGN KEY (city_id) REFERENCES city(city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store (
    store_id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    manager_staff_id TINYINT UNSIGNED NOT NULL,
    address_id       SMALLINT UNSIGNED NOT NULL,
    last_update      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id),
    FOREIGN KEY (address_id) REFERENCES address(address_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff (
    staff_id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name  VARCHAR(45) NOT NULL,
    last_name   VARCHAR(45) NOT NULL,
    address_id  SMALLINT UNSIGNED NOT NULL,
    email       VARCHAR(50),
    store_id    TINYINT UNSIGNED NOT NULL,
    active      TINYINT(1) NOT NULL DEFAULT 1,
    username    VARCHAR(16) NOT NULL,
    password    VARCHAR(40),
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (staff_id),
    FOREIGN KEY (address_id) REFERENCES address(address_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    film_id      SMALLINT UNSIGNED NOT NULL,
    store_id     TINYINT UNSIGNED NOT NULL,
    last_update  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (inventory_id),
    FOREIGN KEY (film_id)  REFERENCES film(film_id),
    FOREIGN KEY (store_id) REFERENCES store(store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLAS OUT (La que envia al Master)

CREATE TABLE IF NOT EXISTS customer (
    customer_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    store_id    TINYINT UNSIGNED NOT NULL,
    first_name  VARCHAR(45) NOT NULL,
    last_name   VARCHAR(45) NOT NULL,
    email       VARCHAR(50),
    address_id  SMALLINT UNSIGNED NOT NULL,
    active      TINYINT(1) NOT NULL DEFAULT 1,
    create_date DATE NOT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id),
    FOREIGN KEY (store_id)   REFERENCES store(store_id),
    FOREIGN KEY (address_id) REFERENCES address(address_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rental (
    rental_id    INT NOT NULL AUTO_INCREMENT,
    rental_date  DATETIME NOT NULL,
    inventory_id MEDIUMINT UNSIGNED NOT NULL,
    customer_id  SMALLINT UNSIGNED NOT NULL,
    return_date  DATETIME,
    staff_id     TINYINT UNSIGNED NOT NULL,
    last_update  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rental_id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id),
    FOREIGN KEY (customer_id)  REFERENCES customer(customer_id),
    FOREIGN KEY (staff_id)     REFERENCES staff(staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment (
    payment_id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id  SMALLINT UNSIGNED NOT NULL,
    staff_id     TINYINT UNSIGNED NOT NULL,
    rental_id    INT,
    amount       DECIMAL(5,2) NOT NULL,
    payment_date DATETIME NOT NULL,
    PRIMARY KEY (payment_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (staff_id)    REFERENCES staff(staff_id),
    FOREIGN KEY (rental_id)   REFERENCES rental(rental_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
