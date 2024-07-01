import {connect} from "mongoose"

const uri = "mongodb://127.0.0.1:27017/purple-pay"
connect(uri).then(() =>{
    console.log('db connected succesfully.')
}).catch(err =>{
    console.log('db connection error:', err.message)
})