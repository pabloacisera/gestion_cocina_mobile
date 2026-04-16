```javascript
const data = $input.all();

const insumos = data[0].json.body.insumos;

// Esto transforma el array en múltiples ítems de n8n
return insumos.map(item => {
  return {
    json: {
      id: item.id,
      nombre: item.nombre
    }
  };
});
```