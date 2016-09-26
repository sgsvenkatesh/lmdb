var imdb = require('imdb-api');
var json2csv = require('json2csv');
var exec = require('child_process').exec;
var fs = require('fs');

var appArguments = process.argv.slice(2, process.argv.length);
var types = ['getinfo', 'export'];
var type;

if (appArguments.length === 0) {
    type = types[0];
} else {
    types.forEach(function (thisType) {
        if (appArguments[0] === thisType) {
            type = thisType;
        }
    })
}

if (!type) {
    console.log("Invalid option");
    process.exit();
} else if (type === types[0]) {
    getMoviesList(function (moviesList) {
        moviesList.forEach(function (movie) {
            imdb.getReq({ name: movie }, function(err, movieInfo) {
                fs.writeFile(movie + '/info.json', JSON.stringify(movieInfo, null, 4),
                    function (err) {
                        if (err) {
                            console.log("Cannot save movie info" + movie);
                            return console.log(err);
                        }

                        return console.log("Saved Info for " + movie);
                    }
                );
            });
        });
    });
} else if (type === types[1]) {
    getMoviesList(function (moviesList) {
        if (appArguments[1] === 'no-details') {
            return fs.writeFile('lmdb-movies-list-export.json', JSON.stringify(moviesList, null, 4),
                function (err) {
                    if (err) {
                        console.log("Cannot save movies list");
                        return console.log(err);
                    }

                    return console.log("Exported movies list without IMDb Info!");
                }
            );
        }

        var moviesInfoList = [];
        var resolvedPromisesCount = 0;
        moviesList.forEach(function (movie, index) {
            imdb.getReq({ name: movie }, function(err, movieInfo) {
                // moviesInfoList.push({
                //     name: movieInfo.name,
                //     rating: movieInfo.rating,
                //     genres: movieInfo.genres
                // });
                ++resolvedPromisesCount;

                if (err || !movieInfo) {
                    return console.log("Movie not found - " + movie);
                }
                moviesInfoList.push(movieInfo);

                if (resolvedPromisesCount === moviesList.length) {
                    json2csv({ data: moviesInfoList },
                        function (err, moviesListCsv) {
                            if (err) {
                                console.log("Cannot convert to CSV");
                                return console.log(err);
                            }
                            fs.writeFile('lmdb-movies-list-export.csv', moviesListCsv,
                                function (err) {
                                    if (err) {
                                        console.log("Cannot save movies list");
                                        return console.log(err);
                                    }

                                    return console.log("Exported movies list!");
                                }
                            );
                        }
                    );
                }
            });
        });
    });
}

function getMoviesList (callback) {
    var movies = [];
    exec("ls -d */ | cut -f1 -d'/'", function(error, stdout, stderr) {
        movies = stdout.trim().split("\n");
        callback && callback(movies);
    });
    return movies;
}
