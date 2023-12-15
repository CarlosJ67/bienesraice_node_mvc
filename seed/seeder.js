import { exit } from 'node:process'
import categorias from './categorias.js'
import precios from './precios.js'
import usuarios from './usuarios.js'
import db from '../config/db.js'
import {Categoria, Precio, Usuario} from '../models/index.js'

const importarDatos = async () => {
    try {
        // Autenticar 
        await db.authenticate()

        // Generar las Columnas
        await db.sync()

        // Insertamos los datos 
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios),
            Usuario.bulkCreate(usuarios)
        ])

        console.log('Los datos han sido importados correctamente')
        exit()// significa que si termina la ejecuacion de ese codigo si esta bien el codigo

    }catch (error) {
        console.log(error)
        exit(1) // Cuando tiene un un termina la ejecucion pero tiene un error el codigo
    }
}

const eliminarDatos = async () => {
    try {
        await db.sync({force: true})  // Este elimina y reconstruye la tabla en la base de datos es una forma mas fuerte de hacer el proceso
        console.log('Datos eliminados Correctamente');
        exit()

    } catch (error) {
        console.log(error)
        exit(1)
    }
}

if(process.argv[2] === "-i") {
    importarDatos();
}

if(process.argv[2] === "-e") {
    eliminarDatos();
}


// ASOCIACIONES: Las asociaciones son formas de cruzar infromacion en tu base de datos 
// HASONE: Es para hacer relacion de 1:1, donde un registro puede tener mas de un registro relaciondo con otra tabla 