DELIMITER $$

-- TRIGGERS: customer

CREATE TRIGGER trg_customer_insert
AFTER INSERT ON customer FOR EACH ROW
BEGIN
  INSERT INTO customer_log
    (operation, customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update)
  VALUES
    ('INSERT', NEW.customer_id, NEW.store_id, NEW.first_name, NEW.last_name,
     NEW.email, NEW.address_id, NEW.active, NEW.create_date, NEW.last_update);
END$$

CREATE TRIGGER trg_customer_update
AFTER UPDATE ON customer FOR EACH ROW
BEGIN
  INSERT INTO customer_log
    (operation, customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update)
  VALUES
    ('UPDATE', NEW.customer_id, NEW.store_id, NEW.first_name, NEW.last_name,
     NEW.email, NEW.address_id, NEW.active, NEW.create_date, NEW.last_update);
END$$

CREATE TRIGGER trg_customer_delete
AFTER DELETE ON customer FOR EACH ROW
BEGIN
  INSERT INTO customer_log
    (operation, customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update)
  VALUES
    ('DELETE', OLD.customer_id, OLD.store_id, OLD.first_name, OLD.last_name,
     OLD.email, OLD.address_id, OLD.active, OLD.create_date, OLD.last_update);
END$$

-- TRIGGERS: rental
CREATE TRIGGER trg_rental_insert
AFTER INSERT ON rental FOR EACH ROW
BEGIN
  INSERT INTO rental_log
    (operation, rental_id, rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
  VALUES
    ('INSERT', NEW.rental_id, NEW.rental_date, NEW.inventory_id,
     NEW.customer_id, NEW.return_date, NEW.staff_id, NEW.last_update);
END$$

CREATE TRIGGER trg_rental_update
AFTER UPDATE ON rental FOR EACH ROW
BEGIN
  INSERT INTO rental_log
    (operation, rental_id, rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
  VALUES
    ('UPDATE', NEW.rental_id, NEW.rental_date, NEW.inventory_id,
     NEW.customer_id, NEW.return_date, NEW.staff_id, NEW.last_update);
END$$

CREATE TRIGGER trg_rental_delete
AFTER DELETE ON rental FOR EACH ROW
BEGIN
  INSERT INTO rental_log
    (operation, rental_id, rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
  VALUES
    ('DELETE', OLD.rental_id, OLD.rental_date, OLD.inventory_id,
     OLD.customer_id, OLD.return_date, OLD.staff_id, OLD.last_update);
END$$

-- TRIGGERS: payment

CREATE TRIGGER trg_payment_insert
AFTER INSERT ON payment FOR EACH ROW
BEGIN
  INSERT INTO payment_log
    (operation, payment_id, customer_id, staff_id, rental_id, amount, payment_date, last_update)
  VALUES
    ('INSERT', NEW.payment_id, NEW.customer_id, NEW.staff_id,
     NEW.rental_id, NEW.amount, NEW.payment_date, NEW.last_update);
END$$

CREATE TRIGGER trg_payment_update
AFTER UPDATE ON payment FOR EACH ROW
BEGIN
  INSERT INTO payment_log
    (operation, payment_id, customer_id, staff_id, rental_id, amount, payment_date, last_update)
  VALUES
    ('UPDATE', NEW.payment_id, NEW.customer_id, NEW.staff_id,
     NEW.rental_id, NEW.amount, NEW.payment_date, NEW.last_update);
END$$

CREATE TRIGGER trg_payment_delete
AFTER DELETE ON payment FOR EACH ROW
BEGIN
  INSERT INTO payment_log
    (operation, payment_id, customer_id, staff_id, rental_id, amount, payment_date, last_update)
  VALUES
    ('DELETE', OLD.payment_id, OLD.customer_id, OLD.staff_id,
     OLD.rental_id, OLD.amount, OLD.payment_date, OLD.last_update);
END$$

DELIMITER ;