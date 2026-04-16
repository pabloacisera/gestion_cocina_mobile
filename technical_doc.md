- se creo una base de datos sqlite con:
```
npx prisma init --datasource-provider sqlite
```

- ya podemos crear el modelo con /prisma/schema.prisma
- luego ejecutamos la migracion
```
npx prisma migrate cocina_dev_db --name init
```