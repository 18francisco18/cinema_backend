const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Room = require('../rooms/rooms');

const cinemaSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    movies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    sessions: [{ type: Schema.Types.ObjectId, ref: 'Session', required: true }],
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
});


// Middleware para remover salas associadas quando um cinema é deletado
cinemaSchema.pre("findOneAndDelete", async function (next) {
  // Verifica se a função que está a ser chamada é a de remover um cinema pelo id
  if (this.options.functionName === "removeCinemaById") {
    // Encontra o cinema pelo id. O this.getQuery() representa a resposta da busca do findOne().
    const cinema = await this.model.findOne(this.getQuery());
    if (cinema) {
      console.log(`Removendo salas associadas ao cinema com ID: ${cinema._id}`);
      // Se o cinema for encontrado, remove todas as salas associadas a ele
      // $in é um operador que seleciona os documentos onde o valor de um campo é igual 
      // a qualquer valor especificado em um array.
      const result = await Room.deleteMany({ _id: { $in: cinema.rooms } });
      console.log(`Salas removidas: ${result.deletedCount}`);
    }
  }
  next();
});

const Cinema = mongoose.model('Cinema', cinemaSchema);
module.exports = Cinema;