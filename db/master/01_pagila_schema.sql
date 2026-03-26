------
--  BD MASTER: Esquema de Pagila para PostgreSQL
------

SET client_encoding = 'UTF8';

-- ENUMS
DO $$ BEGIN
    CREATE TYPE mpaa_rating AS ENUM ('G','PG','PG-13','R','NC-17');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TABLES: IN (de Master a Slave)

CREATE TABLE IF NOT EXISTS language (
    language_id   SERIAL PRIMARY KEY,
    name          CHAR(20) NOT NULL,
    last_update   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actor (
    actor_id    SERIAL PRIMARY KEY,
    first_name  VARCHAR(45) NOT NULL,
    last_name   VARCHAR(45) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS film (
    film_id          SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    release_year     INT,
    language_id      SMALLINT NOT NULL REFERENCES language(language_id),
    rental_duration  SMALLINT NOT NULL DEFAULT 3,
    rental_rate      NUMERIC(4,2) NOT NULL DEFAULT 4.99,
    length           SMALLINT,
    replacement_cost NUMERIC(5,2) NOT NULL DEFAULT 19.99,
    rating           mpaa_rating DEFAULT 'G',
    last_update      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS film_actor (
    actor_id    SMALLINT NOT NULL REFERENCES actor(actor_id),
    film_id     SMALLINT NOT NULL REFERENCES film(film_id),
    last_update TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (actor_id, film_id)
);

CREATE TABLE IF NOT EXISTS film_category (
    film_id     SMALLINT NOT NULL REFERENCES film(film_id),
    category_id SMALLINT NOT NULL REFERENCES category(category_id),
    last_update TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (film_id, category_id)
);

CREATE TABLE IF NOT EXISTS country (
    country_id  SERIAL PRIMARY KEY,
    country     VARCHAR(50) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS city (
    city_id     SERIAL PRIMARY KEY,
    city        VARCHAR(50) NOT NULL,
    country_id  SMALLINT NOT NULL REFERENCES country(country_id),
    last_update TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS address (
    address_id  SERIAL PRIMARY KEY,
    address     VARCHAR(50) NOT NULL,
    address2    VARCHAR(50),
    district    VARCHAR(20) NOT NULL,
    city_id     SMALLINT NOT NULL REFERENCES city(city_id),
    postal_code VARCHAR(10),
    phone       VARCHAR(20) NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store (
    store_id         SERIAL PRIMARY KEY,
    manager_staff_id SMALLINT NOT NULL,
    address_id       SMALLINT NOT NULL REFERENCES address(address_id),
    last_update      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
    staff_id    SERIAL PRIMARY KEY,
    first_name  VARCHAR(45) NOT NULL,
    last_name   VARCHAR(45) NOT NULL,
    address_id  SMALLINT NOT NULL REFERENCES address(address_id),
    email       VARCHAR(50),
    store_id    SMALLINT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    username    VARCHAR(16) NOT NULL,
    password    VARCHAR(40),
    last_update TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id SERIAL PRIMARY KEY,
    film_id      SMALLINT NOT NULL REFERENCES film(film_id),
    store_id     SMALLINT NOT NULL REFERENCES store(store_id),
    last_update  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TABLES: OUT (de Slave a Master)

CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    store_id    SMALLINT NOT NULL REFERENCES store(store_id),
    first_name  VARCHAR(45) NOT NULL,
    last_name   VARCHAR(45) NOT NULL,
    email       VARCHAR(50),
    address_id  SMALLINT NOT NULL REFERENCES address(address_id),
    active      INT NOT NULL DEFAULT 1,
    create_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_update TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental (
    rental_id    SERIAL PRIMARY KEY,
    rental_date  TIMESTAMP NOT NULL,
    inventory_id INT NOT NULL REFERENCES inventory(inventory_id),
    customer_id  SMALLINT NOT NULL REFERENCES customer(customer_id),
    return_date  TIMESTAMP,
    staff_id     SMALLINT NOT NULL REFERENCES staff(staff_id),
    last_update  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment (
    payment_id   SERIAL PRIMARY KEY,
    customer_id  SMALLINT NOT NULL REFERENCES customer(customer_id),
    staff_id     SMALLINT NOT NULL REFERENCES staff(staff_id),
    rental_id    INT REFERENCES rental(rental_id),
    amount       NUMERIC(5,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL
);

-- SEED DATA

INSERT INTO language (language_id, name) VALUES
  (1, 'English'),
  (2, 'Italian'),
  (3, 'Japanese'),
  (4, 'Mandarin'),
  (5, 'French'),
  (6, 'German')
ON CONFLICT (language_id) DO NOTHING;

INSERT INTO actor (actor_id, first_name, last_name) VALUES
  (1,'PENELOPE','GUINESS'),
  (2,'NICK','WAHLBERG'),
  (3,'ED','CHASE'),
  (4,'JENNIFER','DAVIS'),
  (5,'JOHNNY','LOLLOBRIGIDA'),
  (6,'BETTE','NICHOLSON'),
  (7,'GRACE','MOSTEL'),
  (8,'MATTHEW','JOHANSSON'),
  (9,'JOE','SWANK'),
  (10,'CHRISTIAN','GABLE')
ON CONFLICT (actor_id) DO NOTHING;

INSERT INTO category (category_id, name) VALUES
  (1,'Action'),(2,'Animation'),(3,'Children'),(4,'Classics'),
  (5,'Comedy'),(6,'Documentary'),(7,'Drama'),(8,'Family'),
  (9,'Foreign'),(10,'Games'),(11,'Horror'),(12,'Music'),
  (13,'New'),(14,'Sci-Fi'),(15,'Sports'),(16,'Travel')
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO country (country_id, country) VALUES
  (1,'Afghanistan'),(2,'Algeria'),(3,'American Samoa'),
  (4,'Angola'),(5,'Anguilla'),(6,'Argentina'),
  (7,'Armenia'),(8,'Australia'),(9,'Austria'),(10,'Azerbaijan'),
  (100,'United States'),(101,'Honduras'),(102,'Guatemala')
ON CONFLICT (country_id) DO NOTHING;

INSERT INTO city (city_id, city, country_id) VALUES
  (1,'A Corua (La Corua)',87),(2,'Abha',82),(3,'Abu Dhabi',101),
  (4,'Acua',60),(5,'Adana',97),(6,'Addis Abeba',31),
  (100,'Tegucigalpa',101),(101,'San Pedro Sula',101),
  (102,'Guatemala City',102)
ON CONFLICT (city_id) DO NOTHING;

INSERT INTO address (address_id, address, district, city_id, phone) VALUES
  (1,'47 MySakila Drive','Alberta',1,''),
  (2,'28 MySQL Boulevard','QLD',1,''),
  (3,'23 Workhaven Lane','Alberta',1,'14033335568'),
  (4,'1411 Lillydale Drive','QLD',1,'6172235589'),
  (5,'1913 Hanoi Way','Nagasaki',1,'28303384290')
ON CONFLICT (address_id) DO NOTHING;

INSERT INTO store (store_id, manager_staff_id, address_id) VALUES
  (1, 1, 1),
  (2, 2, 2)
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO staff (staff_id, first_name, last_name, address_id, email, store_id, active, username, password) VALUES
  (1,'Mike','Hillyer',3,'Mike.Hillyer@sakilastaff.com',1,TRUE,'Mike','8cb2237d0679ca88db6464eac60da96345513964'),
  (2,'Jon','Stephens',4,'Jon.Stephens@sakilastaff.com',2,TRUE,'Jon','')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO film (film_id, title, description, release_year, language_id, rental_duration, rental_rate, length, replacement_cost, rating) VALUES
  (1,'ACADEMY DINOSAUR','A Epic Drama of a Feminist And a Mad Scientist',2006,1,6,0.99,86,20.99,'PG'),
  (2,'ACE GOLDFINGER','A Astounding Epistle of a Database Administrator And a Explorer',2006,1,3,4.99,48,12.99,'G'),
  (3,'ADAPTATION HOLES','A Astounding Reflection of a Lumberjack And a Car',2006,1,7,2.99,50,18.99,'NC-17'),
  (4,'AFFAIR PREJUDICE','A Fanciful Documentary of a Frisbee And a Lumberjack',2006,1,5,2.99,117,26.99,'G'),
  (5,'AFRICAN EGG','A Fast-Paced Documentary of a Pastry Chef And a Dentist',2006,1,6,2.99,130,22.99,'G'),
  (6,'AGENT TRUMAN','A Intrepid Panorama of a Robot And a Boy',2006,1,3,2.99,169,17.99,'PG'),
  (7,'AIRPLANE SIERRA','A Touching Saga of a Hunter And a Butler',2006,1,6,4.99,62,28.99,'PG-13'),
  (8,'AIRPORT POLLOCK','A Epic Tale of a Moose And a Girl',2006,1,6,4.99,54,15.99,'R'),
  (9,'ALABAMA DEVIL','A Thoughtful Panorama of a Database Administrator And a Mad Scientist',2006,1,3,2.99,114,21.99,'PG-13'),
  (10,'ALADDIN CALENDAR','A Action-Packed Tale of a Man And a Lumberjack',2006,1,6,4.99,63,24.99,'NC-17')
ON CONFLICT (film_id) DO NOTHING;

INSERT INTO film_actor (actor_id, film_id) VALUES
  (1,1),(1,23),(1,25),(2,3),(2,5),(3,2),(3,6),(4,1),(4,7),(5,8),(5,9),(6,10)
ON CONFLICT DO NOTHING;

INSERT INTO film_category (film_id, category_id) VALUES
  (1,6),(2,11),(3,6),(4,11),(5,8),(6,9),(7,5),(8,11),(9,11),(10,15)
ON CONFLICT DO NOTHING;

INSERT INTO inventory (inventory_id, film_id, store_id) VALUES
  (1,1,1),(2,1,1),(3,1,1),(4,1,2),(5,2,1),(6,2,2),(7,3,1),(8,3,2),
  (9,4,1),(10,5,1),(11,6,2),(12,7,1),(13,8,2),(14,9,1),(15,10,2)
ON CONFLICT (inventory_id) DO NOTHING;

INSERT INTO customer (customer_id, store_id, first_name, last_name, email, address_id, active) VALUES
  (1,1,'MARY','SMITH','MARY.SMITH@sakilacustomer.org',5,1),
  (2,1,'PATRICIA','JOHNSON','PATRICIA.JOHNSON@sakilacustomer.org',5,1),
  (3,1,'LINDA','WILLIAMS','LINDA.WILLIAMS@sakilacustomer.org',5,1)
ON CONFLICT (customer_id) DO NOTHING;

SELECT setval('language_language_id_seq',   (SELECT MAX(language_id)   FROM language),   true);
SELECT setval('actor_actor_id_seq',         (SELECT MAX(actor_id)      FROM actor),       true);
SELECT setval('category_category_id_seq',   (SELECT MAX(category_id)   FROM category),   true);
SELECT setval('country_country_id_seq',     (SELECT MAX(country_id)    FROM country),     true);
SELECT setval('city_city_id_seq',           (SELECT MAX(city_id)       FROM city),       true);
SELECT setval('address_address_id_seq',     (SELECT MAX(address_id)    FROM address),     true);
SELECT setval('store_store_id_seq',         (SELECT MAX(store_id)      FROM store),       true);
SELECT setval('staff_staff_id_seq',         (SELECT MAX(staff_id)      FROM staff),       true);
SELECT setval('film_film_id_seq',           (SELECT MAX(film_id)       FROM film),       true);
SELECT setval('inventory_inventory_id_seq', (SELECT MAX(inventory_id)  FROM inventory),  true);
SELECT setval('customer_customer_id_seq',   (SELECT MAX(customer_id)   FROM customer),   true);

-- Tabla que leva un control de la history de sincronizacion ahi
CREATE TABLE IF NOT EXISTS sync_history (
    id           SERIAL PRIMARY KEY,
    sync_type    VARCHAR(10) NOT NULL,  
    status       VARCHAR(20) NOT NULL, 
    tables_synced TEXT,
    rows_affected INT DEFAULT 0,
    error_detail TEXT,
    started_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at  TIMESTAMP
);
