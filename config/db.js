import  Sequelize from "sequelize"
import dotenv from 'dotenv'
dotenv.config({path: '.env'})

const db = new Sequelize(process.env.BD_NOMBRE, process.env.BD_USER, process.env.BD_PASSWORD,{
    host: process.env.BD_HOST,
    port: 3309,
    dialect: 'mysql', 
    define: {
        timestamps: true
    },
    pool: {
        max:5, 
        min: 0,// cuando no alla en la pagina, se cierra la pagina
        acquire:30000, 
        idle: 10000 //si ve que no hay visitas, se finaliza la conexion en la pagina 
    },
    operatorAliases: false 
});

export default db;