
const socketController = async (client, io) => {

    console.log(`Cliente Conectado ${client.id}`);
    

    client.on('disconnect', async (payload, callback) => {
        console.log(`Cliente Desconectado ${client.id}`);
    });

}



module.exports = { socketController }