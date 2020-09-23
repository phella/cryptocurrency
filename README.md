# cryptocurrency
cryptocurrency project implemented in node.js using blockchain technology

# Build Status
[![Build Status](https://travis-ci.org/phella/cryptocurrency.svg?branch=master)](https://travis-ci.org/phella/cryptocurrency)

[![Coverage Status](https://coveralls.io/repos/github/phella/cryptocurrency/badge.svg?branch=)](https://coveralls.io/github/phella/cryptocurrency?branch=)

# How to run project

## Recommneded using Docker
Make sure that docker is installed and running using 
```
docker version
```

| Command | Description |
| --- | --- |
| docker-compose up --build| To build and run the project and redis server |
| docker build -t philo/cryptocurrency -f Dockerfile.dev . | To build development image |
| docker run philo/cryptocurrency npm run test:coveralls | To run the test cases and export coverage report |


## Using Npm
Make sure that npm and redis are installed and running using 
```
npm version
redis-cli ping
```
then run 
```
npm install
npm start
```
