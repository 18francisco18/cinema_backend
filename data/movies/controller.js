const movieService = require("../movies"); // O serviço que lida com a requisição à OMDb API
const movieModel = require("../movies"); // O modelo de filme

const movieController = {
  searchMovie,  
};

// Controlador para lidar com a busca de filmes
async function searchMovie(req, res) {
  const { title, year, plot } = req.body; // Extrai o título e o ano da requisição

  // Verifica se o título do filme foi fornecido
  if (!title) {
    return res.status(400).send({ error: "O título do filme é obrigatório" });
  }

  try {
    // Chama o serviço que faz a requisição à OMDb API
    const movie = await movieService.getMovieByTitleYearAndPlot(title, year, plot);

    // Verifica se o filme já está no banco de dados
    // ATENCAO- A API AINDA É USADA MESMO QUE VÁ BUSCAR AO BANCO DE DADOS. PARA CORRIGIR, COLOCAR
    //ESTA PARTE DE CÓDIGO LOGO EM BAIXO DO try E COLOCAR PARA PROCURAR NO MÉTODO findOne
    //O TÍTULO E O ANO(OPCIONAL) DO FILME
    const existingMovie = await movieModel.findOne({ imdbID: movie.imdbID });
    if (existingMovie) {
      console.log(
        "Filme já existe no banco de dados, acedendo à base de dados..."
      );
      return res.status(200).send(existingMovie); // Se o filme já existe, retorna-o
    }

    // Se não existir, salva no banco de dados
    const newMovie = await movieModel.create(movie);

    res.status(201).send(newMovie); // Retorna o filme recém-salvo
  } catch (error) {
    res.status(400).send({ error: error.message }); // Em caso de erro, retorna a mensagem
    console.log(error);
  }
}

module.exports = movieController;
