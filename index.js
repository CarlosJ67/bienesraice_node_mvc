import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'
// Creando la app
const app = express()


// Habilitar lectura de datos de formularios
app.use(express.urlencoded({extended: true}))

//Habilitar Cookie Parser
app.use( cookieParser())

// Habilitar CSRF
app.use( csrf({cookie: true}) )

//Conexion a la base de datos
try {
    await db.authenticate();
    db.sync()
    console.log('Conexion Correcta a la Base de datos')
} catch (error) {
    console.log(error)
}

//Habilitando Pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta publica 
app.use( express.static('public'))


//Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)

//use---busca las rutas que inicien con una sola diagonal 

//definimos un puerto y arrancamos con el proyecto
const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`El servidor esta funcionando en el puerto ${port}
    http://localhost:3001`)
});



//Get--Utilizado para mostrar informacion--va a mostar una sola vez
//POST--Utilizado para enviar informacion
//PUT/PATCH---Utilizado para actualizar informacion 



//Un ORM es un tecnica que se utiliza donde los datos de una base de datos son tratados como objetos
//Son classes que son tratados como objetos
//Ejemplos de ORM Prisma, Mongoose, TypeORM, Sequelize, Bookshelf.js
