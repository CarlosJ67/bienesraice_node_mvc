import { DataTypes } from "sequelize"
import bcrypt from 'bcrypt'
import db from '../config/db.js'

const Usuario = db.define('usuarios', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: DataTypes.STRING,
    confirmado: DataTypes.BOOLEAN
}, {
    hooks: {
        beforeCreate: async function(usuario) {
         const salt = await bcrypt.genSalt(10)// con estas dos lineas se hashea un password 
         usuario.password = await bcrypt.hash( usuario.password, salt);
        }
    },
    scopes: {
        eliminarPassword: {
            attributes: {
                exclude: ['password', 'token', 'confirmado', 'createdAt', 'updatedAt']
            }
        }
    }
})

//Metodos Personalisados 
// Prototype: tiene todas las funciones que puedes ocupar en ese objeto
// Escopres sirven para eliminae ciertos campos cuando haces una consulta aun modelo en especifico
Usuario.prototype.verificarPassword = function(password){
  return bcrypt.compareSync(password, this.password);
}

export default Usuario