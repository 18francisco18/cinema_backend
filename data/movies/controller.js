const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");
const movieService = require("../movies");
const movieModel = require("./movies");

const movieController = {
  searchMovie,
  getMovieById,
  getAllMovies,
  removeMovie,
  createComment,
  getComments,
  updateComment,
  deleteComment,
};

// Controlador para lidar com a busca de filmes
async function searchMovie(req, res, next) {
  try {
    const { title, year, plot } = req.body; // Extrai o título e o ano da requisição
    const movie = await movieService.searchMovie(title, year, plot); // Chama o serviço que faz a requisição à OMDb API
    res.status(200).send(movie); // Retorna o filme recém-salvo
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para obter um filme pelo ID
async function getMovieById(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await movieService.findById(id);
    res.status(200).send(movie);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para obter todos os filmes
async function getAllMovies(req, res, next) {
  try {
    const movies = await movieService.findAll();
    res.status(200).send(movies);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function removeMovie(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await movieService.removeById(id);
    res.status(200).send(movie);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Função auxiliar para validar o rating
async function validateRating(rating) {
  // Converte para número e verifica se é um número válido
  const numRating = Number(rating);
  if (isNaN(numRating)) {
    throw new ValidationError("Rating deve ser um número");
  }

  // Verifica se está entre 0 e 5
  if (numRating < 0 || numRating > 5) {
    throw new ValidationError("Rating deve estar entre 0 e 5");
  }

  // Verifica se é um incremento de 0.5
  if ((numRating * 2) % 1 !== 0) {
    throw new ValidationError("Rating deve ser em incrementos de 0.5");
  }

  return numRating;
}

// Controlador para criar um novo comentário
async function createComment(req, res, next) {
  try {
    const { movieId } = req.params;
    const { text, rating } = req.body;
    const userId = req.userId; // Pegando o userId do token

    // Valida o rating
    const validatedRating = await validateRating(rating);

    const comment = await movieService.addComment(movieId, {
      comment: text, // Alterado de text para comment para corresponder ao schema
      rating: validatedRating,
      user: userId, // Alterado de userId para user para corresponder ao schema
      createdAt: new Date(),
    });

    res.status(201).send(comment);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para obter comentários de um filme
async function getComments(req, res, next) {
  try {
    const { movieId } = req.params;
    const comments = await movieService.getMovieComments(movieId);
    res.status(200).send(comments);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para atualizar um comentário
async function updateComment(req, res, next) {
  try {
    const { movieId, commentId } = req.params;
    const { text, rating } = req.body;
    const userId = req.userId;

    // Busca o comentário para verificar se pertence ao usuário
    const movie = await movieService.findById(movieId);
    const existingComment = movie.comments.id(commentId);

    if (!existingComment) {
      throw new NotFoundError("Comentário não encontrado");
    }

    // Verifica se o comentário pertence ao usuário
    if (existingComment.user.toString() !== userId) {
      throw new AuthorizationError("Você não tem permissão para editar este comentário");
    }

    // Valida o rating se foi fornecido
    let validatedRating;
    if (rating !== undefined) {
      validatedRating = await validateRating(rating);
    }

    const updatedComment = await movieService.updateComment(
      movieId,
      commentId,
      {
        ...(text && { comment: text }), // Alterado de text para comment
        ...(validatedRating !== undefined && { rating: validatedRating }),
        updatedAt: new Date(),
      }
    );

    res.status(200).send(updatedComment);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para deletar um comentário
async function deleteComment(req, res, next) {
  try {
    const { movieId, commentId } = req.params;
    const userId = req.userId;

    // Busca o comentário para verificar se pertence ao usuário
    const movie = await movieService.findById(movieId);
    const comment = movie.comments.id(commentId);

    if (!comment) {
      throw new NotFoundError("Comentário não encontrado");
    }

    // Verifica se o comentário pertence ao usuário
    if (comment.user.toString() !== userId) {
      throw new AuthorizationError("Você não tem permissão para deletar este comentário");
    }

    await movieService.deleteComment(movieId, commentId);
    res.status(204).send();
  } catch (error) {
    console.log(error);
    next(error);
  }
}

module.exports = movieController;
