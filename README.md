This is a Node.js application that fetches web pages and saves them locally. It can also provide metadata about the fetched pages. The application is containerized using Docker for easy deployment and consistent execution across different environments.

## Prerequisites

- Docker installed on your machine. You can download it from [here](https://www.docker.com/products/docker-desktop).

## Getting Started

Build the Docker image:
docker build -t fetch-app .
## Usage

### Basic Usage

To fetch a single webpage:
## windows
docker run --rm -v ${PWD}:/usr/src/app -e OUTPUT_DIR=/output fetch-app https://www.google.com
 
## Unix / linux / mac
docker run --rm -v $(pwd):/usr/src/app fetch-app https://www.google.com


This will save the webpage in the `output` directory in your current working directory.

### Fetching Multiple Webpages

To fetch multiple webpages:
docker run --rm -v $(pwd):/usr/src/app fetch-app https://www.yahoo.com https://www.google.com

### Fetching Metadata

To fetch a webpage and display its metadata:
docker run --rm -v "$(pwd)/output:/usr/src/app/output" fetch-app --metadata https://www.example.com


## Output

The fetched webpages and their assets will be saved in the `output` directory, organized by domain name. If you used the `--metadata` flag, the metadata will be displayed in the console output.

## Troubleshooting

If you encounter any issues:

1. Ensure Docker is running on your machine.
2. Make sure you have built the Docker image before trying to run it.
3. Check that you have write permissions in the current directory for the `output` folder.