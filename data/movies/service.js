const axios = require("axios");
const mongoose = require("mongoose");
const config = require("../../config");
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");

function MovieService(movieModel) {
  let service = {
    create,
    getMovieByTitleYearAndPlot,
    findById,
    findAll,
    removeById,
    searchMovie,
    addComment,
    getMovieComments,
    updateComment,
    deleteComment,
    deleteAllComments,
    getAllComments,
  };

  async function create(movie) {
    try {
      const findMovie = await movieModel.findOne({
        title: movie.title,
        year: movie.year,
      });
      if (findMovie) {
        throw new ConflictError("Filme já existe no banco de dados");
      }

      let newMovie = new movieModel(movie);
      let savedMovie = await newMovie.save();
      return savedMovie;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Função para buscar um filme pelo título e ano na API OMDb
  async function getMovieByTitleYearAndPlot(title, year, plot) {
    try {
      // Busca o filme na API OMDb através do título e ano, cujos titulos e anos são passados
      //como parametros no pedido à API, pois a API OMDb permite pesquisar filmes por título e ano.
      //O pedido é feito com o método GET para a URL base da API OMDb (MOVIE_API_BASE_URL) e os parâmetros t e y.
      //É necessário passar a chave da API (MOVIE_API_KEY) como parâmetro apikey.
      const response = await axios.get(`${config.MOVIE_API_BASE_URL}`, {
        params: {
          t: title, // Título do filme
          y: year, // Ano do filme (opcional)
          //plot ter valores: short, full
          plot: plot, // Tipo de plot
          apikey: config.MOVIE_API_KEY, // Chave da API
        },
      });

      // Verifica se a API retornou com sucesso, caso contrário, lança um erro
      if (response.data.Response === "False") {
        console.log("erro");
        throw new Error(response.data.Error);
      }

      // Retorna os dados do filme
      const movieData = response.data;

      // O objetivo deste código é transformar o array de avaliações (Ratings) retornado pela API OMDb para garantir que cada
      //objeto de avaliação tenha os campos source e value preenchidos,
      //mesmo que a API não os forneça.
      //Primeiro acede-se ao array de avaliações com movieData.Ratings (seguido de OU [] para caso seja null ou undefined).
      //Depois, mapeia-se o array de avaliações, transformando cada objeto de avaliação (rating)
      //em um objeto com os campos source e value preenchidos.
      const transformedRatings = (movieData.Ratings || []).map((rating) => ({
        source: rating.Source || "N/A",
        value: rating.Value || "N/A",
      }));

      // Colocar valores default para os campos que podem vir vazios
      const completeMovieData = {
        title: movieData.Title || "N/A",
        year: movieData.Year || "N/A",
        rated: movieData.Rated || "N/A",
        released: movieData.Released || "N/A",
        runtime: movieData.Runtime || "N/A",
        genre: movieData.Genre || "N/A",
        director: movieData.Director || "N/A",
        writer: movieData.Writer || "N/A",
        actors: movieData.Actors || "N/A",
        plot: movieData.Plot || "N/A",
        language: movieData.Language || "N/A",
        country: movieData.Country || "N/A",
        awards: movieData.Awards || "N/A",
        poster: movieData.Poster || "N/A",
        ratings: transformedRatings,
        metascore: movieData.Metascore || "N/A",
        imdbRating: movieData.imdbRating || "N/A",
        imdbVotes: movieData.imdbVotes || "N/A",
        imdbID: movieData.imdbID || "N/A",
        type: movieData.Type || "N/A",
        dvd: movieData.DVD || "N/A",
        boxOffice: movieData.BoxOffice || "N/A",
        production: movieData.Production || "N/A",
        website: movieData.Website || "N/A",
        response: movieData.Response || "N/A",
      };

      // Retorna os dados completos do filme
      return completeMovieData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Função para buscar um filme pelo ID no banco de dados
  async function findById(id) {
    try {
      const movie = await movieModel.findById(id);
      if (!movie) {
        throw new NotFoundError("Filme não encontrado");
      }
      return movie;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Função para buscar todos os filmes no banco de dados com paginação, filtragem e ordenação
  async function findAll(page = 1, limit = 10, query = {}, sort = {}) {
    try {
      const skip = (page - 1) * limit;

      // Buscar os filmes com filtros, paginação e ordenação
      const movies = await movieModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort);

      const totalMovies = await movieModel.countDocuments(query);

      const totalPages = Math.ceil(totalMovies / limit);

      if (page > totalPages) {
        return { movies: [], total: 0, page, limit };
      }

      return {
        movies,
        totalPages,
        currentPage: page,
        totalMovies,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Função para remover um filme pelo ID no banco de dados
  async function removeById(id) {
    try {
      const movie = await movieModel.findByIdAndDelete(id);
      if (!movie) {
        throw new NotFoundError("Filme não encontrado");
      }
      return movie;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function searchMovie(title, year, plot) {
    // Verifica se o título do filme foi fornecido
    if (!title) {
      throw new ValidationError("Por favor, forneça o título do filme.");
    }

    try {
      // Verifica se o filme já está no banco de dados
      const existingMovie = await movieModel.findOne({
        title: title,
        year: year,
      });
      if (existingMovie) {
        console.log(
          "Filme já existe no banco de dados, acedendo à base de dados..."
        );
        return existingMovie; // Se o filme já existe, retorna-o
      }

      // Chama o serviço que faz a requisição à OMDb API
      const movie = await getMovieByTitleYearAndPlot(title, year, plot);

      // Se não existir, salva no banco de dados
      const newMovie = await movieModel.create(movie);
      return newMovie;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function addComment(movieId, commentData) {
    try {
      const movie = await movieModel.findById(movieId);
      if (!movie) {
        throw new NotFoundError("Filme não encontrado");
      }

      // Check if user already commented on this movie
      const existingComment = movie.comments.find(
        (comment) =>
          comment.user &&
          commentData.user &&
          comment.user.toString() === commentData.user
      );
      if (existingComment) {
        throw new ConflictError("Você já comentou neste filme");
      }

      movie.comments.push(commentData);
      await movie.save();

      // Populate user data for the new comment
      const savedComment = movie.comments[movie.comments.length - 1];
      await movie.populate({
        path: "comments.user",
        select: "username name",
        match: { _id: savedComment.user },
      });

      const commentWithUsername = {
        ...savedComment.toObject(),
        username: savedComment.user
          ? savedComment.user.username
          : "Unknown User",
      };

      return commentWithUsername;
    } catch (error) {
      throw error;
    }
  }

  async function getMovieComments(movieId) {
    try {
      const movie = await movieModel.findById(movieId).populate({
        path: "comments.user",
        select: "username name",
      });
      if (!movie) {
        throw new NotFoundError("Filme não encontrado");
      }

      // Map comments to include username
      const commentsWithUsername = movie.comments.map((comment) => ({
        ...comment.toObject(),
        username: comment.user ? comment.user.username : "Unknown User",
      }));

      return commentsWithUsername;
    } catch (error) {
      throw error;
    }
  }

  async function updateComment(movieId, commentId, updateData) {
    try {
      const movie = await movieModel.findById(movieId);
      if (!movie) {
        throw new NotFoundError("Filme não encontrado");
      }

      const comment = movie.comments.id(commentId);
      if (!comment) {
        throw new NotFoundError("Comentário não encontrado");
      }

      Object.assign(comment, updateData);
      await movie.save();

      // Populate user data for the updated comment
      await movie.populate({
        path: "comments.user",
        select: "username name",
        match: { _id: comment.user },
      });

      const commentWithUsername = {
        ...comment.toObject(),
        username: comment.user ? comment.user.username : "Unknown User",
      };

      return commentWithUsername;
    } catch (error) {
      throw error;
    }
  }

  async function deleteComment(movieId, commentId) {
    try {
      const movie = await movieModel.findById(movieId);
      if (!movie) {
        throw new NotFoundError("Filme não encontrado");
      }

      // Find the comment index
      const commentIndex = movie.comments.findIndex(
        (comment) => comment._id.toString() === commentId
      );

      if (commentIndex === -1) {
        throw new NotFoundError("Comentário não encontrado");
      }

      // Remove the comment using pull
      movie.comments.pull({ _id: commentId });
      await movie.save();
      return true;
    } catch (error) {
      throw error;
    }
  }

  async function deleteAllComments() {
    try {
      // Find all movies and update them to remove all comments
      const result = await movieModel.updateMany(
        {}, // Match all documents
        { $set: { comments: [] } } // Set comments to empty array
      );

      return {
        modifiedCount: result.modifiedCount,
        message: `Comments deleted from ${result.modifiedCount} movies`,
      };
    } catch (error) {
      throw error;
    }
  }

  // Função para buscar todos os comentários com paginação e filtragem por rating
  async function getAllComments(page = 1, limit = 10, rating = null) {
    try {
      const skip = (page - 1) * limit;

      // Buscar os filmes e popular os comentários dos usuários
      const movies = await movieModel.find().populate({
        path: "comments.user",
        select: "username name",
      });

      if (!movies) throw new NotFoundError("Nenhum filme encontrado");

      // Flatten all comments from all movies into a single array
      let allComments = movies.reduce((comments, movie) => {
        const movieComments = movie.comments.map((comment) => ({
          ...comment.toObject(),
          movieTitle: movie.title,
          movieId: movie._id,
          username: comment.user ? comment.user.username : "Unknown User",
        }));
        return [...comments, ...movieComments];
      }, []);

      // Filtrar comentários por rating, se fornecido
      if (rating !== null) {
        allComments = allComments.filter(
          (comment) => comment.rating === rating
        );
      }

      // Sort comments by date (newest first)
      allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Paginação dos comentários
      const paginatedComments = allComments.slice(skip, skip + limit);

      return {
        comments: paginatedComments,
        total: allComments.length,
        page: page,
        pages: Math.ceil(allComments.length / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  return service;
}

module.exports = MovieService;
