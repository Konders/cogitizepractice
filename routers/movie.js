const dotenv = require("dotenv");
dotenv.config();

const express = require('express');
const router = express.Router();
const axios= require("axios").default;
const Movie = require("../database/schemes/movie");
const { shuffle } = require("../utils");

router.post('/createMovie', async (req, res, next) => {
  try{
   console.log("Create movie request",req.body);
    const {id,title, description, rating, genres,poster,backdrop,run_time} = req.body;
    const movie =  await Movie.create ({
      id,
      title,
      description,
      rating, 
      genres,
      run_time,
      poster,
      backdrop
    });
    console.log("Movie created :", movie);
    res.json(movie);
  } catch (error) {
    next(error);
  }
  });
  const types = {
    Movie: "Movie"
  }
const genresList = {
  Any: null,
  Action: "Action",
  Horror: "Horror",
  Drama: "Drama",
  Comedy: "Comedy"
}
  router.get("/list", async (req, res, next) => {
    try {
      const {genre, type} = req.query;
      const options = {};
      if (genre && genresList[genre])
        options.genres = { $elemMatch: { name: genresList[genre] } };
      if (type && types[type]) options.type = types[type];
      const movies = await Movie.find(options).select( "_id type title poster rating genres");
      const shuffledMovies = shuffle(movies);
      if (!shuffledMovies) throw new Error("No movies found");
      res.status(200).json(shuffledMovies.slice(0, 8));
    } catch (error) {
      next(error);
    }
  });
  router.get("/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const movie = await Movie.findById(id).select("-__v -_id");
      if (movie) res.status(200).json(movie);
      else throw new Error("Movie was not found");
    } catch (error) {
      next(error);
    }
  });


   const FETCHINGDELAY = 5000;
   const iterationCount = 50;
   async function addMoviesToDatabase(pageIteration = 1) {
     if (pageIteration > 10000) return;
     for (let i = pageIteration; i < pageIteration + iterationCount ; i++) {
       const movieRes = await axios.get(
         "https://api.themoviedb.org/3/discover/movie",
         {
           params: {
             api_key: process.env.TMDB_API_KEY,
             with_genres: "28|27|18|35",
             page: pageIteration,
           },
         }
       );
       let movieIds = [];
       movieRes.data.results.forEach((element) => {
         movieIds.push(element.id);
       });
       for (let movieId of movieIds) {
         try {
           const response = await axios.get(
             `https://api.themoviedb.org/3/movie/${movieId}`,
             {
               params: {
                 api_key: process.env.TMDB_API_KEY,
               },
             }
           );
           const {id,title,genres,run_time,overview,release_date,poster_path,vote_average,backdrop_path} = response.data;
           if (overview) {
             const newMovie = await Movie.create({
               id,
               title,
               type: "Movie",
               description: overview,
              poster: `https://image.tmdb.org/t/p/original${poster_path}`,
              backdrop: `https://image.tmdb.org/t/p/original${backdrop_path}`,
               rating: vote_average,
               genres,
               run_time,
               date: release_date,
             });
           }
         } catch (error) {
          if (error.code !== 11000) console.log(JSON.stringify(error));
         }
       }
      }
       setTimeout(addMoviesToDatabase, FETCHINGDELAY, pageIteration + iterationCount);
    }
  function runBackgroundFetching() {
    let pageIterator = 1;
    addMoviesToDatabase(pageIterator++)
    setTimeout(addMoviesToDatabase, FETCHINGDELAY, pageIterator);
  }
   
  module.exports = { router, runBackgroundFetching };