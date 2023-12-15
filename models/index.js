import Propiedad from './Propiedad.js' // Importamos los modelos de cada uno de la tablas  
import Precio from './Precio.js'
import Categoria from './Categoria.js'
import Usuario from './Usuario.js'
import Mensaje from './Mensaje.js'

//Precio.hasOne(Propiedad)

Propiedad.belongsTo(Precio, { foreignKey: 'precioId'})  // Hacemos la relacion entre propiedad y precio
Propiedad.belongsTo(Categoria, { foreignKey: 'categoriaId'}) // Relacion entre propiedad y categoria 
Propiedad.belongsTo(Usuario, { foreignKey: 'usuarioId'}) // Relacion entre propiedad y usuario
Propiedad.hasMany(Mensaje, { foreignKey: 'propiedadId'})

Mensaje.belongsTo(Propiedad, { foreignKey: 'propiedadId'})
Mensaje.belongsTo(Usuario, { foreignKey: 'usuarioId'})


export{
    Propiedad,
    Precio,
    Categoria,
    Usuario,
    Mensaje

}