# Sincronizacion-de-datos-Pagila

El proyecto consiste en crear un aplicativo que implemente la dinámica de sincranización entr bases de datos (una matesra y una esclava), acorde a los requerimientos indicados en el proyecto. Dicho proyecto estaría hecho en Python mediante las librerías flask, psycopg2-binary, gunicorn y mysql-connector-python; además, con una interfaz HTML sencilla la cual sirve, utilizando la mínima cantidad de librerías externas en lo posible, priorizando los requisitos del proyecto y no sobrecargar los módulos de este mismo.

## Como ejecutar el proyecto

* Paso 1: clonar el proyecto: 
``` 
git clone https://github.com/heydenAldana/Sincronizacion-de-datos-Pagila.git
``` 
* Paso 2: ejecutar en tu terminal o IDE preferido en el directorio raiz:
``` 
docker-compose up --build # Docker
podman compose up --build # Podman
``` 
* Paso 3: abrir un navegador y poner:
``` 
http://localhost:5000/
``` 
* Paso 4: Navegar por la interfaz y realizar dichas pruebas

## Notas adicionales:

* Es complicado trabajar con Node.js para la sincronización del backend, asi que después de dos intentos fallidos, med ecanté por python mejor.
* Se eligieorn las versiones 15 de Postgres y 8.x de MySQL por temas de compatibilidad y menores complicaciones en la hora de implementar la lógica de las sincronizaciones.