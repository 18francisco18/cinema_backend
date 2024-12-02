let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let seatStatus = require("./seatStatus");

const seatSchema = new Schema({
  number: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: [seatStatus.inCondition, seatStatus.inaccessible],
    default: seatStatus.inCondition,
  },
});

// Função para gerar o layout padrão
const generateDefaultLayout = (totalSeats = 60) => {
  const rows = Math.ceil(totalSeats / 8); // Número de filas
  const layout = [];
  let seatNumber = 1;

  for (let i = 0; i < rows; i++) {
    const row = [];
    const rowLetter = String.fromCharCode(65 + i); // Converte o índice da fila para uma letra (A, B, C, ...)
    for (let j = 0; j < 8; j++) {
      if (seatNumber <= totalSeats) {
        row.push({
          number: `${rowLetter}${j + 1}`, // Formato do número do assento (ex: A1, A2, ...)
          status: seatStatus.inCondition,
        });
        seatNumber++;
      }
    }
    layout.push(row);
  }

  return layout;
};

let roomSchema = new Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  layout: { type: [[seatSchema]], default: generateDefaultLayout },
  cinema: { type: Schema.Types.ObjectId, ref: "Cinema", required: true },
  sessions: [{ type: Schema.Types.ObjectId, ref: "Session" }],
});

roomSchema.pre("save", function (next) {



  const room = this;
  // Calcula o total de assentos no layout. O .reduce é um método de array que acumula um valor a partir
  //de todos os elementos do array. dentro da função de callback, o primeiro argumento é o valor acumulado
  //e o segundo é o array atual. O 0 no final é o valor inicial do acumulador.
  if (room.isNew) { 
  const seatCount = room.layout.reduce((total, row) => total + row.length, 0);

  if (seatCount !== room.capacity) {
    // Retorna erro se o número de assentos não for igual à capacidade
    // O uso do return next() é usado para garantir que o fluxo de execução do middleware seja 
    //interrompido corretamente quando ocorre um erro. No contexto do middleware do Mongoose, 
    //o next é uma função de callback que deve ser chamada para indicar que o middleware terminou 
    //sua execução. Se passar um erro para o next, o Mongoose saberá que ocorreu um erro 
    //e interromperá a operação de salvamento.
    return next(
      new Error(
        `O número total de assentos (${seatCount}) não corresponde à capacidade (${room.capacity}).`
      )
    );
  }
}


  // Se estiver tudo certo, continua com o save na base de dados.
  next();
});


// Middleware 'pre' para validar a unicidade do nome da sala dentro do cinema
roomSchema.pre("save", async function (next) {

  const room = this;
  if (room.isNew) {

  try {
    // Verifica se já existe uma sala com o mesmo nome no mesmo cinema
    const existingRoom = await Room.findOne({
      // O $regex é um operador do MongoDB que permite fazer buscas por expressões regulares
      // o new RegExp() é um construtor de expressões regulares do JavaScript
      // o ^ indica que a expressão deve começar no inicio da string e o $ que deve terminar no final
      // o ${room.name} é a variável que contém o nome da sala
      // o "i" no final da expressão regular indica que a busca deve ser case-insensitive.
      name: { $regex: new RegExp(`^${room.name}$`, "i") },
      cinema: room.cinema,
    });
    
    // Se encontrar uma sala com o mesmo nome relacionada com o cinema especifico, retorna um erro
    if (existingRoom) {
      const error = new Error(`A sala com o nome "${room.name}" já existe para este cinema.`);
      return next(error); // Interrompe o salvamento e passa o erro para o próximo middleware
    }

    // Se não houver conflito, continua com o salvamento
    next();
  } catch (error) {
    next(error); // Se houver algum erro na verificação, também passa o erro
  }
}
});



let Room = mongoose.model("Room", roomSchema);
module.exports = Room;