USE pagila_slave;

--  SHADOW TABLE: customer_log

CREATE TABLE IF NOT EXISTS customer_log (
    log_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    log_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced       TINYINT(1) NOT NULL DEFAULT 0,
    -- Estos serian los datos de la fila afectada que se mostrarian ve
    customer_id  SMALLINT UNSIGNED,
    store_id     TINYINT UNSIGNED,
    first_name   VARCHAR(45),
    last_name    VARCHAR(45),
    email        VARCHAR(50),
    address_id   SMALLINT UNSIGNED,
    active       TINYINT(1),
    create_date  DATE,
    last_update  TIMESTAMP NULL,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TRIGGER IF EXISTS trg_customer_insert;
DROP TRIGGER IF EXISTS trg_customer_update;
DROP TRIGGER IF EXISTS trg_customer_delete;

DELIMITER $$

CREATE TRIGGER trg_customer_insert
AFTER INSERT ON customer
FOR EACH ROW
BEGIN
    INSERT INTO customer_log
        (operation, customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update)
    VALUES
        ('INSERT', NEW.customer_id, NEW.store_id, NEW.first_name, NEW.last_name,
         NEW.email, NEW.address_id, NEW.active, NEW.create_date, NEW.last_update);
END$$

CREATE TRIGGER trg_customer_update
AFTER UPDATE ON customer
FOR EACH ROW
BEGIN
    INSERT INTO customer_log
        (operation, customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update)
    VALUES
        ('UPDATE', NEW.customer_id, NEW.store_id, NEW.first_name, NEW.last_name,
         NEW.email, NEW.address_id, NEW.active, NEW.create_date, NEW.last_update);
END$$

CREATE TRIGGER trg_customer_delete
AFTER DELETE ON customer
FOR EACH ROW
BEGIN
    INSERT INTO customer_log
        (operation, customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update)
    VALUES
        ('DELETE', OLD.customer_id, OLD.store_id, OLD.first_name, OLD.last_name,
         OLD.email, OLD.address_id, OLD.active, OLD.create_date, OLD.last_update);
END$$

DELIMITER ;

--  SHADOW TABLE: rental_log

CREATE TABLE IF NOT EXISTS rental_log (
    log_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    log_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced       TINYINT(1) NOT NULL DEFAULT 0,
    -- Datos de la fila afectada tambien aqui
    rental_id    INT,
    rental_date  DATETIME,
    inventory_id MEDIUMINT UNSIGNED,
    customer_id  SMALLINT UNSIGNED,
    return_date  DATETIME,
    staff_id     TINYINT UNSIGNED,
    last_update  TIMESTAMP NULL,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TRIGGER IF EXISTS trg_rental_insert;
DROP TRIGGER IF EXISTS trg_rental_update;
DROP TRIGGER IF EXISTS trg_rental_delete;

DELIMITER $$

CREATE TRIGGER trg_rental_insert
AFTER INSERT ON rental
FOR EACH ROW
BEGIN
    INSERT INTO rental_log
        (operation, rental_id, rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
    VALUES
        ('INSERT', NEW.rental_id, NEW.rental_date, NEW.inventory_id,
         NEW.customer_id, NEW.return_date, NEW.staff_id, NEW.last_update);
END$$

CREATE TRIGGER trg_rental_update
AFTER UPDATE ON rental
FOR EACH ROW
BEGIN
    INSERT INTO rental_log
        (operation, rental_id, rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
    VALUES
        ('UPDATE', NEW.rental_id, NEW.rental_date, NEW.inventory_id,
         NEW.customer_id, NEW.return_date, NEW.staff_id, NEW.last_update);
END$$

CREATE TRIGGER trg_rental_delete
AFTER DELETE ON rental
FOR EACH ROW
BEGIN
    INSERT INTO rental_log
        (operation, rental_id, rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
    VALUES
        ('DELETE', OLD.rental_id, OLD.rental_date, OLD.inventory_id,
         OLD.customer_id, OLD.return_date, OLD.staff_id, OLD.last_update);
END$$

DELIMITER ;

--  SHADOW TABLE: payment_log

CREATE TABLE IF NOT EXISTS payment_log (
    log_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    operation    ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    log_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced       TINYINT(1) NOT NULL DEFAULT 0,
    -- Datos de la fila afectada tambien x3
    payment_id   SMALLINT UNSIGNED,
    customer_id  SMALLINT UNSIGNED,
    staff_id     TINYINT UNSIGNED,
    rental_id    INT,
    amount       DECIMAL(5,2),
    payment_date DATETIME,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TRIGGER IF EXISTS trg_payment_insert;
DROP TRIGGER IF EXISTS trg_payment_update;
DROP TRIGGER IF EXISTS trg_payment_delete;

DELIMITER $$

CREATE TRIGGER trg_payment_insert
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    INSERT INTO payment_log
        (operation, payment_id, customer_id, staff_id, rental_id, amount, payment_date)
    VALUES
        ('INSERT', NEW.payment_id, NEW.customer_id, NEW.staff_id,
         NEW.rental_id, NEW.amount, NEW.payment_date);
END$$

CREATE TRIGGER trg_payment_update
AFTER UPDATE ON payment
FOR EACH ROW
BEGIN
    INSERT INTO payment_log
        (operation, payment_id, customer_id, staff_id, rental_id, amount, payment_date)
    VALUES
        ('UPDATE', NEW.payment_id, NEW.customer_id, NEW.staff_id,
         NEW.rental_id, NEW.amount, NEW.payment_date);
END$$

CREATE TRIGGER trg_payment_delete
AFTER DELETE ON payment
FOR EACH ROW
BEGIN
    INSERT INTO payment_log
        (operation, payment_id, customer_id, staff_id, rental_id, amount, payment_date)
    VALUES
        ('DELETE', OLD.payment_id, OLD.customer_id, OLD.staff_id,
         OLD.rental_id, OLD.amount, OLD.payment_date);
END$$

DELIMITER ;
